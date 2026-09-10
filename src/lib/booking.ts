import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calcPrice, EXTRAS, type ExtraId, type VehicleId } from "./catalog";
import { generateSlots, isSlotInPast, isWorkingDate } from "./slots";
import { normalizePhone, rigaDate } from "./utils";

const ADMIN_PIN = "090021";

const ExtraZ = z.enum(["tyres", "leather", "antirain", "engine", "fragrance"]);
const VehicleZ = z.enum(["car", "suv"]);
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
    vehicleType: row.vehicle_type as VehicleId,
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
  const msg = err instanceof Error ? err.message : String(err);
  return /unique|23505|bookings_slot/i.test(msg);
}

const hits = new Map<string, number[]>();
function allowRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= max) {
    hits.set(key, prev);
    return false;
  }
  prev.push(now);
  hits.set(key, prev);
  return true;
}

function pinOk(pin: string): boolean {
  return pin === ADMIN_PIN;
}

async function occupiedTimes(date: string): Promise<Set<string>> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ booking_time: string }>`
    select booking_time from bookings
    where booking_date = ${date}::date
      and status not in ('cancelled', 'no-show')
  `;
  return new Set(rows.map((r) => r.booking_time));
}

async function seedIfEmpty() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const count = await sql<{ n: number }>`select count(*)::int as n from bookings`;
  if ((count[0]?.n ?? 0) > 0) return;
  const today = rigaDate();
  const samples: [string, string, string, string, number, string][] = [
    ["11:00", "Jānis Bērziņš", "+37126111000", "car", 25, "completed"],
    ["14:00", "Anna Kalniņa", "+37126222000", "suv", 34, "completed"],
    ["18:00", "Mārtiņš Ozols", "+37126333000", "car", 29, "confirmed"],
  ];
  for (const [time, name, phone, vehicle, price, status] of samples) {
    const extras = vehicle === "suv" ? '["tyres"]' : time === "18:00" ? '["tyres"]' : "[]";
    await sql`
      insert into bookings (
        booking_date, booking_time, customer_name, customer_phone,
        vehicle_type, service_id, extras, price, status
      ) values (
        ${today}::date, ${time}, ${name}, ${phone},
        ${vehicle}, 'komplekss', ${extras}, ${price}, ${status}
      )
    `;
  }
}

export const getAvailableSlots = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input))
  .handler(async ({ data }) => {
    await seedIfEmpty();
    if (!isWorkingDate(data.date)) {
      return { date: data.date, slots: [] as { time: string; free: boolean }[] };
    }
    const taken = await occupiedTimes(data.date);
    const slots = generateSlots().map((time) => ({
      time,
      free: !taken.has(time) && !isSlotInPast(data.date, time),
    }));
    return { date: data.date, slots };
  });

const CreateZ = z.object({
  vehicleType: VehicleZ,
  serviceId: z.literal("komplekss"),
  extras: z.array(ExtraZ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().max(120).optional().default(""),
  comment: z.string().trim().max(500).optional().default(""),
  privacy: z.literal(true),
  honeypot: z.string().optional().default(""),
});

export const createBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => CreateZ.parse(input))
  .handler(async ({ data }) => {
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
    const price = calcPrice(data.vehicleType, extras);
    const email = data.email && /.+@.+\..+/.test(data.email) ? data.email : null;

    const taken = await occupiedTimes(data.date);
    if (taken.has(data.time)) {
      return { ok: false as const, error: "slot_taken" as const };
    }

    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const inserted = await sql<BookingRow>`
        insert into bookings (
          booking_date, booking_time, customer_name, customer_phone, customer_email,
          vehicle_type, service_id, extras, price, comment, status
        ) values (
          ${data.date}::date, ${data.time}, ${data.name}, ${phone}, ${email},
          ${data.vehicleType}, 'komplekss', ${JSON.stringify(extras)}, ${price},
          ${data.comment || null}, 'confirmed'
        )
        returning *
      `;
      const row = inserted[0];
      if (!row) return { ok: false as const, error: "generic" as const };
      return { ok: true as const, booking: mapRow(row, true) };
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
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        q: z.string().optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, bookings: [] as BookingPublic[] };
    await seedIfEmpty();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const q = data.q.trim();
    const rows = q
      ? await sql<BookingRow>`
          select * from bookings
          where booking_date between ${data.from}::date and ${data.to}::date
            and (customer_name ilike ${"%" + q + "%"} or customer_phone ilike ${"%" + q + "%"})
          order by booking_date asc, booking_time asc
        `
      : await sql<BookingRow>`
          select * from bookings
          where booking_date between ${data.from}::date and ${data.to}::date
          order by booking_date asc, booking_time asc
        `;
    return { ok: true as const, bookings: rows.map((r) => mapRow(r, true)) };
  });

export const adminDashboard = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const };
    await seedIfEmpty();
    const today = rigaDate();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<BookingRow>`
      select * from bookings
      where booking_date = ${today}::date
      order by booking_time asc
    `;
    const active = rows.filter((r) => r.status !== "cancelled" && r.status !== "no-show");
    const revenue = active.reduce((s, r) => s + Number(r.price), 0);
    const taken = new Set(active.map((r) => r.booking_time));
    const allSlots = generateSlots();
    const free = allSlots.filter((t) => !taken.has(t) && !isSlotInPast(today, t)).length;
    const next = active.find((r) => r.status !== "completed" && !isSlotInPast(today, r.booking_time));
    return {
      ok: true as const,
      today,
      count: active.length,
      revenue,
      free,
      next: next ? mapRow(next, true) : null,
      timeline: allSlots.map((time) => {
        const row = active.find((r) => r.booking_time === time);
        return {
          time,
          free: !row,
          past: isSlotInPast(today, time),
          booking: row ? mapRow(row, true) : null,
        };
      }),
    };
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ pin: z.string(), id: z.number().int(), status: StatusZ }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<BookingRow>`
      update bookings
      set status = ${data.status}, updated_at = now()
      where id = ${data.id}
      returning *
    `;
    const row = rows[0];
    if (!row) return { ok: false as const };
    return { ok: true as const, booking: mapRow(row, true) };
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
    const taken = await occupiedTimes(data.date);
    if (taken.has(data.time)) return { ok: false as const, error: "slot_taken" as const };
    try {
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
      return { ok: true as const, booking: mapRow(row, true) };
    } catch (err) {
      if (isUniqueSlotError(err)) return { ok: false as const, error: "slot_taken" as const };
      console.error("adminCreateBooking", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const adminEraseByPhone = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ pin: z.string(), phone: z.string().trim().min(8) }).parse(input))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) return { ok: false as const, count: 0 };
    const phone = normalizePhone(data.phone) ?? data.phone.replace(/\s/g, "");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      update bookings
      set customer_name = 'deleted',
          customer_phone = 'deleted',
          customer_email = null,
          comment = null,
          updated_at = now()
      where customer_phone = ${phone}
         or customer_phone = ${data.phone}
      returning id
    `;
    return { ok: true as const, count: rows.length };
  });
