-- Per-user saved vehicles for the client cabinet.
-- user_id is TEXT (Better Auth / dev-user id), not UUID.

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
);

create index if not exists user_vehicles_user_id_idx on user_vehicles (user_id);

-- At most one default per user
create unique index if not exists user_vehicles_one_default
  on user_vehicles (user_id)
  where is_default = true;
