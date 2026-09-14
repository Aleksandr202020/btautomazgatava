import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
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
  id: number; date: string; time: string; vehicleType: VehicleId; serviceId: string;
  extras: ExtraId[]; price: number; status: string;
  name?: string; phone?: string; email?: string | null; comment?: string | null;
};

type BookingRow = {
  id: number; booking_date: string; booking_time: string; customer_name: string;
  customer_phone: string; customer_email: string | null; vehicle_type: string;
  service_id: string; extras: string; price: number | string; comment: string | null;
  status: string; user_id: string | null; created_at: string; updated_at: string;
};

function mapRow(row: BookingRow, admin = false): BookingPublic {
  let extras: ExtraId[] = [];
  try { extras = JSON.parse(row.extras) as ExtraId[]; } catch { extras = []; }
  const base: BookingPublic = {
    id: Number(row.id), date: String(row.booking_date).slice(0, 10), time: row.booking_time,
    vehicleType: normalizeVehicleId(row.vehicle_type), serviceId: row.service_id, extras,
    price: Number(row.price), status: row.status,
  };
  if (admin) {
    base.name = row.customer_name; base.phone = row.customer_phone;
    base.email = row.customer_email; base.comment = row.comment;
  }
  return base;
}

function pinOk(pin: string): boolean { return pin === ADMIN_PIN; }
function isUniqueSlotError(err: unknown): boolean {
  return /unique|duplicate|bookings_date_time/i.test(String((err as { message?: string })?.message ?? err ?? ""));
}

async function occupiedTimes(date: string): Promise<Set<string>> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ booking_time: string }>`
      select booking_time from bookings
      where booking_date = ${date}::date and status not in ('cancelled', 'no-show')`;
    return new Set(rows.map((r) => r.booking_time));
  } catch { return new Set(); }
}

export const getAvailableSlots = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input))
  .handler(async ({ data }) => {
    if (!isWorkingDate(data.date)) return { date: data.date, slots: [] as { time: string; free: boolean }[] };
    let taken = new Set<string>();
    try { taken = await occupiedTimes(data.date); } catch { taken = new Set(); }
    return {
      date: data.date,
      slots: generateSlots().map((time) => ({
        time, free: !taken.has(time) && !isSlotInPast(data.date, time),
      })),
    };
  });

const CreateZ = z.object({
  vehicleType: VehicleZ, serviceId: z.string().default("komplekss"), extras: z.array(ExtraZ).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(80), phone: z.string().trim().min(8).max(24),
  email: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
  privacy: z.boolean(), honeypot: z.string().optional().default(""),
  carBrand: z.string().optional(), carModel: z.string().optional(), carPriceCategory: PriceCategoryZ.optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CreateZ.parse(input))
  .handler(async ({ data, context }) => {
    if (data.honeypot && data.honeypot.length > 0) return { ok: false as const, error: "generic" as const };
    const phone = normalizePhone(data.phone);
    if (!phone) return { ok: false as const, error: "phone" as const };
    if (!isWorkingDate(data.date) || isSlotInPast(data.date, data.time) || !generateSlots().includes(data.time))
      return { ok: false as const, error: "slot_taken" as const };
    const extras = Array.from(new Set(data.extras)).filter((id) => EXTRAS.some((e) => e.id === id));
    const resolved = getVehiclePrice(data.carBrand || "", data.carModel || "",
      (data.carPriceCategory as PriceCategory | undefined) ?? (normalizeVehicleId(data.vehicleType) as PriceCategory));
    const vehicleType = resolved.priceCategory;
    const price = calcPrice(vehicleType, extras);
    const vehicleNote = data.carBrand || data.carModel ? `${data.carBrand} ${data.carModel}`.trim() : "";
    const commentParts = [data.comment?.trim(), vehicleNote ? `Auto: ${vehicleNote}` : ""].filter(Boolean).join(" · ");

    let sessionEmail: string | null = null;
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const su = await getSessionUser();
      sessionEmail = su?.email?.trim() || null;
    } catch {
      sessionEmail = null;
    }
    const formEmail = data.email && /.+@.+\..+/.test(data.email) ? data.email.trim() : null;
    const email = formEmail || sessionEmail;

    try {
      const taken = await occupiedTimes(data.date);
      if (taken.has(data.time)) return { ok: false as const, error: "slot_taken" as const };
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      try {
        await sql.query(`alter table bookings add column if not exists user_id text`);
      } catch {
        /* ignore */
      }
      const inserted = await sql<BookingRow>`
        insert into bookings (
          booking_date, booking_time, customer_name, customer_phone, customer_email,
          vehicle_type, service_id, extras, price, comment, status, user_id
        ) values (
          ${data.date}::date, ${data.time}, ${data.name}, ${phone}, ${email},
          ${vehicleType}, 'komplekss', ${JSON.stringify(extras)}, ${price},
          ${commentParts || null}, 'confirmed', ${context.userId}
        ) returning *`;
      if (!inserted[0]) return { ok: false as const, error: "generic" as const };
      return { ok: true as const, booking: mapRow(inserted[0], true) };
    } catch (err) {
      if (isUniqueSlotError(err)) return { ok: false as const, error: "slot_taken" as const };
      console.error("createBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const adminListBookings = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ pin: z.string(), from: z.string().optional(), to: z.string().optional(), status: z.string().optional(), q: z.string().optional() }).parse(input))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, bookings: [] as BookingPublic[], dbOk: false as const };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<BookingRow>`select * from bookings order by booking_date desc, booking_time desc limit 500`;
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
    const today = rigaDate(new Date());
    const allSlots = generateSlots();
    const emptyTimeline = allSlots.map((time) => ({
      time, free: !isSlotInPast(today, time), past: isSlotInPast(today, time), booking: null as BookingPublic | null,
    }));
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<BookingRow>`
        select * from bookings where booking_date = ${today}::date order by booking_time asc`;
      const active = rows.filter((r) => r.status !== "cancelled" && r.status !== "no-show");
      const revenue = active.reduce((s, r) => s + Number(r.price), 0);
      const taken = new Set(active.map((r) => r.booking_time));
      const free = allSlots.filter((t) => !taken.has(t) && !isSlotInPast(today, t)).length;
      const next = active.find((r) => r.status !== "completed" && !isSlotInPast(today, r.booking_time));
      return {
        ok: true as const, dbOk: true as const, today, count: active.length, revenue, free,
        next: next ? mapRow(next, true) : null,
        timeline: allSlots.map((time) => {
          const row = active.find((r) => r.booking_time === time);
          return { time, free: !row, past: isSlotInPast(today, time), booking: row ? mapRow(row, true) : null };
        }),
      };
    } catch (err) {
      console.error("adminDashboard: DB unavailable", err);
      return {
        ok: true as const, dbOk: false as const, today, count: 0, revenue: 0,
        free: emptyTimeline.filter((s) => s.free).length, next: null, timeline: emptyTimeline,
      };
    }
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string(), id: z.number(), status: StatusZ }).parse(input))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await sql`update bookings set status = ${data.status}, updated_at = now() where id = ${data.id}`;
      return { ok: true as const };
    } catch (err) {
      console.error("adminSetStatus", err);
      return { ok: false as const };
    }
  });

export const adminCreateBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({
    pin: z.string(), vehicleType: VehicleZ, extras: z.array(ExtraZ).default([]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/),
    name: z.string().trim().min(2).max(80), phone: z.string().trim().min(8).max(24),
  }).parse(input))
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
        ) returning *`;
      if (!inserted[0]) return { ok: false as const, error: "generic" as const };
      return { ok: true as const, booking: mapRow(inserted[0], true) };
    } catch (err) {
      if (isUniqueSlotError(err)) return { ok: false as const, error: "slot_taken" as const };
      console.error("adminCreateBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const sql = await getSql();
      try {
        await sql.query(`alter table bookings add column if not exists user_id text`);
      } catch {
        /* ignore */
      }
      const session = await getSessionUser();
      const email = session?.email?.toLowerCase() ?? null;
      const rows = await sql<BookingRow>`
        select * from bookings
        where user_id = ${context.userId}
           or (${email} is not null and lower(coalesce(customer_email, '')) = ${email})
        order by booking_date desc, booking_time desc
        limit 50
      `;
      if (email) {
        try {
          await sql`
            update bookings
            set user_id = ${context.userId}, updated_at = now()
            where user_id is null
              and lower(coalesce(customer_email, '')) = ${email}
          `;
        } catch {
          /* ignore */
        }
      }
      return { ok: true as const, bookings: rows.map((r) => mapRow(r, true)) };
    } catch (err) {
      console.error("listMyBookings", err);
      return { ok: false as const, bookings: [] as BookingPublic[] };
    }
  });

export const cancelMyBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const sql = await getSql();
      const session = await getSessionUser();
      const email = session?.email?.toLowerCase() ?? null;
      const rows = await sql<BookingRow>`
        update bookings set status = 'cancelled', updated_at = now()
        where id = ${data.id} and status not in ('cancelled', 'completed', 'no-show')
          and (user_id = ${context.userId} or (user_id is null and ${email} is not null and lower(coalesce(customer_email, '')) = ${email}))
        returning *`;
      if (!rows[0]) return { ok: false as const, error: "not_found" as const };
      return { ok: true as const, booking: mapRow(rows[0], true) };
    } catch (err) {
      console.error("cancelMyBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const updateMyBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    id: z.number().int(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    vehicleType: VehicleZ.optional(),
    carBrand: z.string().optional(), carModel: z.string().optional(), carPriceCategory: PriceCategoryZ.optional(),
  }).parse(input))
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const sql = await getSql();
      const session = await getSessionUser();
      const email = session?.email?.toLowerCase() ?? null;
      const existing = await sql<BookingRow>`
        select * from bookings where id = ${data.id}
          and status not in ('cancelled', 'completed', 'no-show')
          and (user_id = ${context.userId} or (user_id is null and ${email} is not null and lower(coalesce(customer_email, '')) = ${email}))
        limit 1`;
      const row = existing[0];
      if (!row) return { ok: false as const, error: "not_found" as const };
      const nextDate = data.date ?? String(row.booking_date).slice(0, 10);
      const nextTime = data.time ?? row.booking_time;
      if (!isWorkingDate(nextDate) || isSlotInPast(nextDate, nextTime) || !generateSlots().includes(nextTime))
        return { ok: false as const, error: "slot_taken" as const };
      if (nextDate !== String(row.booking_date).slice(0, 10) || nextTime !== row.booking_time) {
        const clash = await sql<{ id: number }>`
          select id from bookings where booking_date = ${nextDate}::date and booking_time = ${nextTime}
            and status not in ('cancelled', 'no-show') and id <> ${data.id} limit 1`;
        if (clash[0]) return { ok: false as const, error: "slot_taken" as const };
      }
      let vehicleType = normalizeVehicleId(row.vehicle_type);
      let price = Number(row.price);
      let comment = row.comment;
      if (data.vehicleType || data.carBrand || data.carModel || data.carPriceCategory) {
        const resolved = getVehiclePrice(data.carBrand || "", data.carModel || "",
          (data.carPriceCategory as PriceCategory | undefined) ?? (normalizeVehicleId(data.vehicleType ?? row.vehicle_type) as PriceCategory));
        vehicleType = resolved.priceCategory;
        let extras: ExtraId[] = [];
        try { extras = JSON.parse(row.extras) as ExtraId[]; } catch { extras = []; }
        price = calcPrice(vehicleType, extras);
        const vehicleNote = data.carBrand || data.carModel ? `${data.carBrand ?? ""} ${data.carModel ?? ""}`.trim() : "";
        if (vehicleNote) {
          const withoutAuto = (row.comment || "").replace(/\s*·\s*Auto:.*$/, "").trim();
          comment = [withoutAuto, `Auto: ${vehicleNote}`].filter(Boolean).join(" · ");
        }
      }
      const claimUserId = row.user_id ?? context.userId;
      const updated = await sql<BookingRow>`
        update bookings set booking_date = ${nextDate}::date, booking_time = ${nextTime},
          vehicle_type = ${vehicleType}, price = ${price}, comment = ${comment},
          user_id = ${claimUserId}, updated_at = now()
        where id = ${data.id} returning *`;
      if (!updated[0]) return { ok: false as const, error: "generic" as const };
      return { ok: true as const, booking: mapRow(updated[0], true) };
    } catch (err) {
      if (isUniqueSlotError(err)) return { ok: false as const, error: "slot_taken" as const };
      console.error("updateMyBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });
