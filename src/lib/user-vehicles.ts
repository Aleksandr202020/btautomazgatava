import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getVehiclePrice, type BodyType, type PriceCategory } from "@/lib/vehicles";

const PriceCategoryZ = z.enum(["car", "large_car", "commercial"]);

export type UserVehicle = {
  id: number;
  brand: string;
  model: string;
  bodyType: BodyType | null;
  priceCategory: PriceCategory;
  label: string | null;
  isDefault: boolean;
  price: number;
};

type Row = {
  id: number;
  user_id: string;
  brand: string;
  model: string;
  body_type: string | null;
  price_category: string;
  label: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Row): UserVehicle {
  const resolved = getVehiclePrice(
    row.brand,
    row.model,
    row.price_category as PriceCategory,
  );
  return {
    id: Number(row.id),
    brand: row.brand,
    model: row.model,
    bodyType: (row.body_type as BodyType) || resolved.bodyType,
    priceCategory: resolved.priceCategory,
    label: row.label,
    isDefault: Boolean(row.is_default),
    price: resolved.price,
  };
}

export const listUserVehicles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<Row>`
      select * from user_vehicles
      where user_id = ${context.userId}
      order by is_default desc, created_at asc
    `;
    return { ok: true as const, vehicles: rows.map(mapRow) };
  });

const AddZ = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  bodyType: z.string().max(40).optional().nullable(),
  priceCategory: PriceCategoryZ,
  label: z.string().trim().max(80).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

export const addUserVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => AddZ.parse(input))
  .handler(async ({ context, data }) => {
    const resolved = getVehiclePrice(data.brand, data.model, data.priceCategory);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    // Cap at 8 vehicles per user
    const count = await sql<{ n: number }>`
      select count(*)::int as n from user_vehicles where user_id = ${context.userId}
    `;
    if ((count[0]?.n ?? 0) >= 8) {
      return { ok: false as const, error: "limit" as const };
    }

    if (data.isDefault) {
      await sql`
        update user_vehicles set is_default = false, updated_at = now()
        where user_id = ${context.userId} and is_default = true
      `;
    }

    // First vehicle becomes default automatically
    const makeDefault = data.isDefault || (count[0]?.n ?? 0) === 0;

    const inserted = await sql<Row>`
      insert into user_vehicles (
        user_id, brand, model, body_type, price_category, label, is_default
      ) values (
        ${context.userId},
        ${resolved.brand},
        ${resolved.model},
        ${resolved.bodyType},
        ${resolved.priceCategory},
        ${data.label?.trim() || null},
        ${makeDefault}
      )
      returning *
    `;
    const row = inserted[0];
    if (!row) return { ok: false as const, error: "generic" as const };
    return { ok: true as const, vehicle: mapRow(row) };
  });

export const setDefaultUserVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update user_vehicles set is_default = false, updated_at = now()
      where user_id = ${context.userId} and is_default = true
    `;
    const rows = await sql<Row>`
      update user_vehicles
      set is_default = true, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
      returning *
    `;
    const row = rows[0];
    if (!row) return { ok: false as const };
    return { ok: true as const, vehicle: mapRow(row) };
  });

export const deleteUserVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const deleted = await sql<{ id: number; is_default: boolean }>`
      delete from user_vehicles
      where id = ${data.id} and user_id = ${context.userId}
      returning id, is_default
    `;
    if (!deleted[0]) return { ok: false as const };

    // If we removed the default, promote the oldest remaining car
    if (deleted[0].is_default) {
      const next = await sql<Row>`
        select * from user_vehicles
        where user_id = ${context.userId}
        order by created_at asc
        limit 1
      `;
      if (next[0]) {
        await sql`
          update user_vehicles set is_default = true, updated_at = now()
          where id = ${next[0].id}
        `;
      }
    }
    return { ok: true as const };
  });
