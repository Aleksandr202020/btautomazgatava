-- Link bookings to authenticated users (nullable for legacy / guest rows)
alter table bookings
  add column if not exists user_id text;

create index if not exists bookings_user_id_idx on bookings (user_id);
