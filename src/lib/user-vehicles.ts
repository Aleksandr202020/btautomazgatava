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

/** Ensure table exists (self-heal if migration lagged behind deploy). */
async function ensureUserVehiclesTable(
  sql: Awaited<ReturnType<typeof import("@/lib/db").getSql>>,
) {
  await sql.query(`
    create table if not exists user_vehicles (
      id serial primary key,
      user_id text not null,
      brand text not null,
      model text not null,
      body_type text,
      price_category text not null check (price_category in ('car', 'large_car', 'commercial')),
      label text,
      is_default boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await sql.query(
    `create index if not exists user_vehicles_user_id_idx on user_vehicles (user_id)`,
  );
  await sql.query(`
    create unique index if not exists user_vehicles_one_default
      on user_vehicles (user_id)
      where is_default = true
  `);
}

export const listUserVehicles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await ensureUserVehiclesTable(sql);
      const rows = await sql<Row>`
        select * from user_vehicles
        where user_id = ${context.userId}
        order by is_default desc, created_at asc
      `;
      return { ok: true as const, vehicles: rows.map(mapRow) };
    } catch (err) {
      console.error("listUserVehicles", err);
      return { ok: false as const, vehicles: [] as UserVehicle[] };
    }
  });

const AddZ = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  bodyType: z.string().max(40).optional().nullable(),
  // Optional — server resolves from catalog when brand/model are known
  priceCategory: PriceCategoryZ.optional().nullable(),
  label: z.string().trim().max(80).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

export const addUserVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => AddZ.parse(input))
  .handler(async ({ context, data }) => {
    try {
      const resolved = getVehiclePrice(
        data.brand,
        data.model,
        data.priceCategory ?? undefined,
      );
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await ensureUserVehiclesTable(sql);

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
    } catch (err) {
      console.error("addUserVehicle", err);
      return { ok: false as const, error: "generic" as const };
    }
  });

export const setDefaultUserVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await ensureUserVehiclesTable(sql);
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
    } catch (err) {
      console.error("setDefaultUserVehicle", err);
      return { ok: false as const };
    }
  });

export const deleteUserVehicle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ context, data }) => {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      await ensureUserVehiclesTable(sql);
      const deleted = await sql<{ id: number; is_default: boolean }>`
        delete from user_vehicles
        where id = ${data.id} and user_id = ${context.userId}
        returning id, is_default
      `;
      if (!deleted[0]) return { ok: false as const };

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
    } catch (err) {
      console.error("deleteUserVehicle", err);
      return { ok: false as const };
    }
  });
