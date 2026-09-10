create table if not exists bookings (
  id serial primary key,
  booking_date date not null,
  booking_time text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  vehicle_type text not null,
  service_id text not null,
  extras text not null default '[]',
  price integer not null,
  comment text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_slot_unique
  on bookings (booking_date, booking_time)
  where status not in ('cancelled', 'no-show');

create index if not exists bookings_date_idx on bookings (booking_date);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_phone_idx on bookings (customer_phone);
