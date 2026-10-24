-- Booking, stylist profile and messaging rules.
-- Requests from the app always carry a user id; the SQL Editor does not,
-- so these checks can still be skipped by hand there.

-- ───────────────────────────────────────────
-- 1. Stylist profiles: stylist accounts only, one each
-- ───────────────────────────────────────────

drop policy if exists "Providers can insert own profile" on public.provider_profiles;
create policy "Providers can insert own profile" on public.provider_profiles for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'provider')
);

-- Skipped if old data already has doubles.
do $$
begin
  if not exists (
    select user_id from public.provider_profiles group by user_id having count(*) > 1
  ) then
    create unique index if not exists provider_profiles_one_per_user on public.provider_profiles (user_id);
  end if;
end $$;

-- ───────────────────────────────────────────
-- 2. New bookings: real service, future time, opening hours, no overlap
-- ───────────────────────────────────────────

create or replace function public.check_new_booking()
returns trigger as $$
declare
  svc public.services%rowtype;
  starts timestamp;
  ends timestamp;
  day text;
begin
  if auth.uid() is null then
    return new;
  end if;

  if not exists (select 1 from public.profiles where id = new.student_id and role = 'student') then
    raise exception 'Only student accounts can book';
  end if;

  select * into svc from public.services where id = new.service_id;
  if not found or svc.provider_id <> new.provider_id then
    raise exception 'Pick a service this stylist offers';
  end if;

  starts := new.date + new.time;
  ends := starts + make_interval(mins => svc.duration_minutes);

  if starts <= (now() at time zone 'America/Chicago') then
    raise exception 'Pick a time in the future';
  end if;

  day := (array['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])[extract(dow from new.date)::int + 1];
  if not exists (
    select 1 from public.availability a
    where a.provider_id = new.provider_id
      and a.day_of_week = day
      and new.time >= a.open_time
      and new.date + a.close_time >= ends
  ) then
    raise exception 'That time is outside the stylist''s opening hours';
  end if;

  -- One booking at a time per stylist, so two students cannot grab the same slot.
  perform pg_advisory_xact_lock(hashtext(new.provider_id::text));

  if exists (
    select 1 from public.bookings b
    left join public.services s on s.id = b.service_id
    where b.provider_id = new.provider_id
      and b.status in ('pending', 'confirmed')
      and b.date + b.time < ends
      and b.date + b.time + make_interval(mins => coalesce(s.duration_minutes, 60)) > starts
  ) then
    raise exception 'That time was just booked. Please pick another time.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists check_new_booking on public.bookings;
create trigger check_new_booking
  before insert on public.bookings
  for each row execute function public.check_new_booking();

-- The booking page uses this to grey out taken times.
-- It returns only times, never who booked them.
create or replace function public.taken_times(p_provider_id uuid, p_date date)
returns table (start_time time, duration_minutes int)
as $$
  select b.time, coalesce(s.duration_minutes, 60)
  from public.bookings b
  left join public.services s on s.id = b.service_id
  where b.provider_id = p_provider_id
    and b.date = p_date
    and b.status in ('pending', 'confirmed')
$$ language sql stable security definer set search_path = public;

revoke all on function public.taken_times(uuid, date) from public;
grant execute on function public.taken_times(uuid, date) to anon, authenticated;

-- ───────────────────────────────────────────
-- 3. Booking status only moves forward
-- ───────────────────────────────────────────

-- pending   -> confirmed or cancelled
-- confirmed -> completed or cancelled
create or replace function public.guard_booking_changes()
returns trigger as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.student_id is distinct from old.student_id
    or new.provider_id is distinct from old.provider_id
    or new.service_id is distinct from old.service_id
    or new.date is distinct from old.date
    or new.time is distinct from old.time
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the booking status can be changed';
  end if;

  if new.status is distinct from old.status and not (
       (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'A % booking cannot be changed to %', old.status, new.status;
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

-- ───────────────────────────────────────────
-- 4. Messages: only between a student and a stylist they booked
-- ───────────────────────────────────────────

create or replace function public.have_booking_together(a uuid, b uuid)
returns boolean as $$
  select exists (
    select 1 from public.bookings bk
    join public.provider_profiles pp on pp.id = bk.provider_id
    where (bk.student_id = a and pp.user_id = b)
       or (bk.student_id = b and pp.user_id = a)
  )
$$ language sql stable security definer set search_path = public;

revoke all on function public.have_booking_together(uuid, uuid) from public;
grant execute on function public.have_booking_together(uuid, uuid) to authenticated;

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages" on public.messages for insert with check (
  auth.uid() = sender_id and public.have_booking_together(sender_id, receiver_id)
);
