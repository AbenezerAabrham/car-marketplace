-- =============================================
-- FULL SUPABASE SCHEMA FOR CAR MARKETPLACE
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique not null references auth.users(id) on delete cascade,
  email text unique not null,
  phone text,
  display_name text not null default '',
  email_verified_at timestamptz,
  report_count int not null default 0,
  created_at timestamptz default now()
);
alter table users enable row level security;

drop policy if exists "users can read own profile" on users;
create policy "users can read own profile" on users for select using (auth.uid() = auth_id);

drop policy if exists "users can insert own profile" on users;
create policy "users can insert own profile" on users for insert with check (auth.uid() = auth_id);

drop policy if exists "public read users for listings" on users;
create policy "public read users for listings" on users for select using (true);

-- 2. Listings table
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  price_etb numeric not null,
  mileage_km int not null,
  location_region text not null,
  location_city text not null,
  condition text not null check (condition in ('new','used_excellent','used_good','used_fair')),
  description text,
  vin text,
  attribute_fingerprint text not null,
  status text not null default 'active' check (status in ('active','flagged','removed')),
  created_at timestamptz default now()
);
alter table listings enable row level security;

drop policy if exists "anyone can read active listings" on listings;
create policy "anyone can read active listings" on listings for select using (status = 'active');

drop policy if exists "owners can read own listings" on listings;
create policy "owners can read own listings" on listings for select using (user_id in (select id from users where auth_id = auth.uid()));

drop policy if exists "owners can insert listings" on listings;
create policy "owners can insert listings" on listings for insert with check (user_id in (select id from users where auth_id = auth.uid()));

drop policy if exists "owners can update own listings" on listings;
create policy "owners can update own listings" on listings for update using (user_id in (select id from users where auth_id = auth.uid()));

-- 3. Listing photos
create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  perceptual_hash text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table listing_photos enable row level security;

drop policy if exists "anyone can read listing photos" on listing_photos;
create policy "anyone can read listing photos" on listing_photos for select using (true);

drop policy if exists "owners can insert photos" on listing_photos;
create policy "owners can insert photos" on listing_photos for insert with check (
  listing_id in (select id from listings where user_id in (select id from users where auth_id = auth.uid()))
);

-- 4. Duplicate flags
create table if not exists duplicate_flags (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  matched_listing_id uuid references listings(id),
  match_type text check (match_type in ('image','attribute','vin')),
  created_at timestamptz default now()
);
alter table duplicate_flags enable row level security;

drop policy if exists "no public access to duplicate flags" on duplicate_flags;
create policy "no public access to duplicate flags" on duplicate_flags for select using (false);

-- 5. Reports
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  reported_user_id uuid references users(id),
  reporter_id uuid references users(id),
  reason text not null,
  created_at timestamptz default now()
);
alter table reports enable row level security;

drop policy if exists "users can insert reports" on reports;
create policy "users can insert reports" on reports for insert with check (
  reporter_id in (select id from users where auth_id = auth.uid())
);

-- 6. Helper function for incrementing report count
create or replace function increment_report_count(target_user_id uuid)
returns void as $$
  update users set report_count = report_count + 1 where id = target_user_id;
$$ language sql;

-- 7. Storage bucket and policies setup
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read listing photos" on storage.objects;
create policy "public read listing photos" on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "owner upload to own folder" on storage.objects;
create policy "owner upload to own folder" on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select id::text from users where auth_id = auth.uid())
  );

-- 8. Indexes for performance
create index if not exists idx_listings_fingerprint on listings(attribute_fingerprint);
create index if not exists idx_listings_status on listings(status);
create index if not exists idx_listings_make on listings(make);
create index if not exists idx_listings_region on listings(location_region);
create index if not exists idx_listing_photos_listing_id on listing_photos(listing_id);
create index if not exists idx_listing_photos_phash on listing_photos(perceptual_hash);
