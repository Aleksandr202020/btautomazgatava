import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calcPrice, EXTRAS, normalizeVehicleId, type ExtraId, type VehicleId } from "./catalog";
import { generateSlots, isSlotInPast, isWorkingDate } from "./slots";
import { normalizePhone, rigaDate } from "./utils";
import { getVehiclePrice, type PriceCategory } from "./vehicles";

const ADMIN_PIN = "090021";

const ExtraZ = z.enum(["fragrance", "tyres", "leather", "antirain", "discs", "engine"]);
const VehicleZ = z.enum(["car", "large_car", "commercial", "suv"]);
const PriceCategoryZ = z.enum(["car", "large_car", "commercial"]);
const StatusZ = z.enum(["new", "confirmed", "completed", "cancelled", "no-show"]);

export type BookingPublic = {
  id: number;
  date: string;
  time: string;
  vehicleType: VehicleId;
  serviceId: string;
  extras: ExtraId[];
  price: number;
  status: string;
  name?: string;
  phone?: string;
  email?: string | null;
  comment?: string | null;
};

type BookingRow = {
  id: number;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  vehicle_type: string;
  service_id: string;
  extras: string;
  price: number | string;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: BookingRow, admin = false): BookingPublic {
  let extras: ExtraId[] = [];
  try {
    extras = JSON.parse(row.extras) as ExtraId[];
  } catch {
    extras = [];
  }
  const base: BookingPublic = {
    id: Number(row.id),
    date: String(row.booking_date).slice(0, 10),
    time: row.booking_time,
    vehicleType: normalizeVehicleId(row.vehicle_type),
    serviceId: row.service_id,
    extras,
    price: Number(row.price),
    status: row.status,
  };
  if (admin) {
    base.name = row.customer_name;
    base.phone = row.customer_phone;
    base.email = row.customer_email;
    base.comment = row.comment;
  }
  return base;
}

function isUniqueSlotError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  return /unique|duplicate|bookings_date_time/i.test(msg);
}

const rateBuckets = new Map<string, { count: number; reset: number }>();
function allowRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.reset < now) {
    rateBuckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

function pinOk(pin: string): boolean {
  return pin === ADMIN_PIN;
}

async function occupiedTimes(date: string): Promise<Set<string>> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ booking_time: string }>`
      select booking_time from bookings
      where booking_date = ${date}::date
        and status not in ('cancelled', 'no-show')
    `;
    return new Set(rows.map((r) => r.booking_time));
  } catch {
    return new Set();
  }
}

async function seedIfEmpty() {
  // kept for compatibility; no-op if migrations seed elsewhere
}

export const getAvailableSlots = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input))
  .handler(async ({ data }) => {
    if (!isWorkingDate(data.date)) {
      return { date: data.date, slots: [] as { time: string; free: boolean }[] };
    }
    let taken = new Set<string>();
    try {
      taken = await occupiedTimes(data.date);
    } catch (err) {
      console.error("getAvailableSlots DB", err);
      taken = new Set();
    }
    const slots = generateSlots().map((time) => ({
      time,
      free: !taken.has(time) && !isSlotInPast(data.date, time),
    }));
    return { date: data.date, slots };
  });

const CreateZ = z.object({
  vehicleType: VehicleZ,
  serviceId: z.string().default("komplekss"),
  extras: z.array(ExtraZ).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
  privacy: z.boolean(),
  honeypot: z.string().optional().default(""),
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  carPriceCategory: PriceCategoryZ.optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => CreateZ.parse(input))
  .handler(async ({ data }) => {
    try {
      const { authConfigured } = await import("@/lib/auth/verify.server");
      if (authConfigured) {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
          return { ok: false as const, error: "auth" as const };
        }
      }
    } catch (err) {
      console.error("createBooking auth check", err);
      return { ok: false as const, error: "generic" as const };
    }
    if (data.honeypot && data.honeypot.length > 0) {
      return { ok: false as const, error: "generic" as const };
    }
    if (!allowRate("global", 20, 60_000)) {
      return { ok: false as const, error: "generic" as const };
    }
    const phone = normalizePhone(data.phone);
    if (!phone) return { ok: false as const, error: "phone" as const };
    if (!allowRate(phone, 3, 60 * 60_000)) {
      return { ok: false as const, error: "generic" as const };
    }
    if (!isWorkingDate(data.date) || isSlotInPast(data.date, data.time)) {
      return { ok: false as const, error: "slot_taken" as const };
    }
    const validTimes = generateSlots();
    if (!validTimes.includes(data.time)) {
      return { ok: false as const, error: "slot_taken" as const };
    }
    const extras = Array.from(new Set(data.extras)).filter((id) => EXTRAS.some((e) => e.id === id));
    const resolved = getVehiclePrice(
      data.carBrand || "",
      data.carModel || "",
      (data.carPriceCategory as PriceCategory | undefined) ??
        (normalizeVehicleId(data.vehicleType) as PriceCategory),
    );
    const vehicleType = resolved.priceCategory;
    const price = calcPrice(vehicleType, extras);
    const vehicleNote =
      data.carBrand || data.carModel ? `${data.carBrand} ${data.carModel}`.trim() : "";
    const commentParts = [data.comment?.trim(), vehicleNote ? `Auto: ${vehicleNote}` : ""]
      .filter(Boolean)
      .join(" · ");
    const email = data.email && /.+@.+\..+/.test(data.email) ? data.email : null;

    try {
      const taken = await occupiedTimes(data.date);
      if (taken.has(data.time)) {
        return { ok: false as const, error: "slot_taken" as const };
      }
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const inserted = await sql<BookingRow>`
        insert into bookings (
          booking_date, booking_time, customer_name, customer_phone, customer_email,
          vehicle_type, service_id, extras, price, comment, status
        ) values (
          ${data.date}::date, ${data.time}, ${data.name}, ${phone}, ${email},
          ${vehicleType}, 'komplekss', ${JSON.stringify(extras)}, ${price},
          ${commentParts || null}, 'confirmed'
        )
        returning *
      `;
      const row = inserted[0];
      if (!row) return { ok: false as const, error: "generic" as const };
      const booking = mapRow(row, true);
      try {
        const { syncBookingToGoogleCalendar } = await import("@/lib/google-calendar");
        syncBookingToGoogleCalendar({
          id: booking.id,
          date: booking.date,
          time: booking.time,
          name: booking.name,
          phone: booking.phone,
          email: booking.email,
          vehicleType: booking.vehicleType,
          price: booking.price,
          comment: booking.comment,
          extras: booking.extras,
        });
      } catch (calErr) {
        console.error("google-calendar hook", calErr);
      }
      return { ok: true as const, booking };
    } catch (err) {
      if (isUniqueSlotError(err)) {
        return { ok: false as const, error: "slot_taken" as const };
      }
      console.error("createBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const adminListBookings = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        pin: z.string(),
        from: z.string().optional(),
        to: z.string().optional(),
        status: z.string().optional(),
        q: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, bookings: [] as BookingPublic[], dbOk: false as const };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<BookingRow>`
        select * from bookings
        order by booking_date desc, booking_time desc
        limit 500
      `;
      return { ok: true as const, bookings: rows.map((r) => mapRow(r, true)), dbOk: true as const };
    } catch (err) {
      console.error("adminListBookings", err);
      return { ok: true as const, bookings: [] as BookingPublic[], dbOk: false as const };
    }
  });

export const adminDashboard = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const today = rigaDate(new Date());
      const rows = await sql<BookingRow>`
        select * from bookings
        where booking_date >= ${today}::date
        order by booking_date, booking_time
        limit 200
      `;
      const list = rows.map((r) => mapRow(r, true));
      const revenue = list
        .filter((b) => b.status !== "cancelled" && b.status !== "no-show")
        .reduce((s, b) => s + b.price, 0);
      return {
        ok: true as const,
        today,
        bookings: list,
        revenue,
        count: list.length,
      };
    } catch (err) {
      console.error("adminDashboard", err);
      return { ok: false as const };
    }
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ pin: z.string(), id: z.number(), status: StatusZ }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await sql`
        update bookings set status = ${data.status}, updated_at = now()
        where id = ${data.id}
      `;
      return { ok: true as const };
    } catch (err) {
      console.error("adminSetStatus", err);
      return { ok: false as const };
    }
  });

export const adminCreateBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        pin: z.string(),
        vehicleType: VehicleZ,
        extras: z.array(ExtraZ).default([]),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        name: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(8).max(24),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, error: "generic" as const };
    const phone = normalizePhone(data.phone) ?? data.phone.replace(/\s/g, "");
    const extras = Array.from(new Set(data.extras));
    const price = calcPrice(data.vehicleType, extras);
    try {
      const taken = await occupiedTimes(data.date);
      if (taken.has(data.time)) return { ok: false as const, error: "slot_taken" as const };
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const inserted = await sql<BookingRow>`
        insert into bookings (
          booking_date, booking_time, customer_name, customer_phone,
          vehicle_type, service_id, extras, price, status
        ) values (
          ${data.date}::date, ${data.time}, ${data.name}, ${phone},
          ${data.vehicleType}, 'komplekss', ${JSON.stringify(extras)}, ${price}, 'confirmed'
        )
        returning *
      `;
      const row = inserted[0];
      if (!row) return { ok: false as const, error: "generic" as const };
      const booking = mapRow(row, true);
      try {
        const { syncBookingToGoogleCalendar } = await import("@/lib/google-calendar");
        syncBookingToGoogleCalendar({
          id: booking.id,
          date: booking.date,
          time: booking.time,
          name: booking.name,
          phone: booking.phone,
          email: booking.email,
          vehicleType: booking.vehicleType,
          price: booking.price,
          comment: booking.comment,
          extras: booking.extras,
        });
      } catch (calErr) {
        console.error("google-calendar admin hook", calErr);
      }
      return { ok: true as const, booking };
    } catch (err) {
      if (isUniqueSlotError(err)) return { ok: false as const, error: "slot_taken" as const };
      console.error("adminCreateBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const adminEraseByPhone = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string(), phone: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, count: 0 };
    const phone = normalizePhone(data.phone) ?? data.phone.replace(/\s/g, "");
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<{ id: number }>`
        update bookings
        set customer_name = '—',
            customer_phone = '—',
            customer_email = null,
            comment = null,
            updated_at = now()
        where customer_phone = ${phone}
        returning id
      `;
      return { ok: true as const, count: rows.length };
    } catch (err) {
      console.error("adminEraseByPhone", err);
      return { ok: false as const, count: 0 };
    }
  });

void seedIfEmpty;
