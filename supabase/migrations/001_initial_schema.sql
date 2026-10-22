-- profiles (our custom user data, separate from Supabase's built-in auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student', 'provider', 'admin')),
  created_at timestamp with time zone default now()
);

-- Provider profiles
create table if not exists public.provider_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  bio text,
  category text not null check (category in ('braider', 'nail-tech', 'lash-tech', 'seamstress')),
  avatar_url text,
  portfolio_urls text[] default '{}',
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

-- Services
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references public.provider_profiles(id) on delete cascade not null,
  name text not null,
  price numeric(10, 2) not null,
  duration_minutes int not null,
  created_at timestamp with time zone default now()
);

-- Availability
create table if not exists public.availability (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references public.provider_profiles(id) on delete cascade not null,
  day_of_week text not null check (day_of_week in ('mon','tue','wed','thu','fri','sat','sun')),
  open_time time not null,
  close_time time not null
);

-- Bookings
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  provider_id uuid references public.provider_profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  date date not null,
  time time not null,
  status text default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamp with time zone default now()
);

-- Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  provider_id uuid references public.provider_profiles(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default now()
);

-- ───────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Provider profiles
drop policy if exists "Approved profiles are public" on public.provider_profiles;
create policy "Approved profiles are public" on public.provider_profiles for select using (is_approved = true);
drop policy if exists "Providers can view own profile" on public.provider_profiles;
create policy "Providers can view own profile" on public.provider_profiles for select using (auth.uid() = user_id);
drop policy if exists "Providers can insert own profile" on public.provider_profiles;
create policy "Providers can insert own profile" on public.provider_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "Providers can update own profile" on public.provider_profiles;
create policy "Providers can update own profile" on public.provider_profiles for update using (auth.uid() = user_id);

-- Services
drop policy if exists "Services are public" on public.services;
create policy "Services are public" on public.services for select using (true);
drop policy if exists "Providers manage own services" on public.services;
create policy "Providers manage own services" on public.services for all using (
  auth.uid() = (select user_id from public.provider_profiles where id = provider_id)
);

-- Availability
drop policy if exists "Availability is public" on public.availability;
create policy "Availability is public" on public.availability for select using (true);
drop policy if exists "Providers manage own availability" on public.availability;
create policy "Providers manage own availability" on public.availability for all using (
  auth.uid() = (select user_id from public.provider_profiles where id = provider_id)
);

-- Bookings
drop policy if exists "Students see own bookings" on public.bookings;
create policy "Students see own bookings" on public.bookings for select using (auth.uid() = student_id);
drop policy if exists "Providers see their bookings" on public.bookings;
create policy "Providers see their bookings" on public.bookings for select using (
  auth.uid() = (select user_id from public.provider_profiles where id = provider_id)
);
drop policy if exists "Students can create bookings" on public.bookings;
create policy "Students can create bookings" on public.bookings for insert with check (auth.uid() = student_id);
drop policy if exists "Providers can update booking status" on public.bookings;
create policy "Providers can update booking status" on public.bookings for update using (
  auth.uid() = (select user_id from public.provider_profiles where id = provider_id)
);

-- Messages
drop policy if exists "Users see own messages" on public.messages;
create policy "Users see own messages" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Reviews
drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);
drop policy if exists "Students write own reviews" on public.reviews;
create policy "Students write own reviews" on public.reviews for insert with check (auth.uid() = student_id);

-- ───────────────────────────────────────────
-- Storage buckets
-- ───────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict (id) do nothing;

drop policy if exists "Avatar uploads" on storage.objects;
create policy "Avatar uploads" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
drop policy if exists "Avatars are public" on storage.objects;
create policy "Avatars are public" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Portfolio uploads" on storage.objects;
create policy "Portfolio uploads" on storage.objects for insert with check (bucket_id = 'portfolio' and auth.uid() is not null);
drop policy if exists "Portfolio is public" on storage.objects;
create policy "Portfolio is public" on storage.objects for select using (bucket_id = 'portfolio');
