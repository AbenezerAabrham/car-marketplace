-- Run in Supabase SQL Editor if you already deployed the base schema

alter table users add column if not exists phone_verified_at timestamptz;

create unique index if not exists idx_users_verified_phone
  on users (phone) where phone_verified_at is not null and phone is not null;

alter table listings add column if not exists plate_number text;
alter table listings add column if not exists plate_verified boolean not null default false;
alter table listings add column if not exists plate_ocr_confidence float;
alter table listings add column if not exists plate_verification_status text not null default 'pending';

alter table listing_photos add column if not exists is_plate_photo boolean not null default false;

create unique index if not exists idx_listings_active_plate
  on listings (plate_number) where status = 'active' and plate_verified = true;

create index if not exists idx_listings_plate on listings(plate_number);

-- Widen duplicate_flags match_type if needed (drop/recreate check is DB-specific; safe on fresh installs)
alter table duplicate_flags drop constraint if exists duplicate_flags_match_type_check;
alter table duplicate_flags add constraint duplicate_flags_match_type_check
  check (match_type in ('image','attribute','vin','plate'));
