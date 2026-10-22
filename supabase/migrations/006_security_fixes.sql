-- Security fixes.
-- Run this whole file once in the Supabase SQL Editor.

-- ───────────────────────────────────────────
-- 1. Roles: nobody can make themselves an admin
-- ───────────────────────────────────────────

-- Sign-up can only pick student or provider. Anything else becomes student.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case
      when new.raw_user_meta_data->>'role' in ('student', 'provider')
        then new.raw_user_meta_data->>'role'
      else 'student'
    end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Users can still change their name, but not their role or email.
-- Requests from the app always carry a user id; the SQL Editor does not,
-- so an admin can still be made by hand there.
create or replace function public.guard_profile_changes()
returns trigger as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role not in ('student', 'provider') then
    raise exception 'You cannot give yourself this role';
  end if;

  if tg_op = 'UPDATE' and (new.role is distinct from old.role
                           or new.email is distinct from old.email
                           or new.id is distinct from old.id) then
    raise exception 'You can only change your name';
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists guard_profile_changes on public.profiles;
create trigger guard_profile_changes
  before insert or update on public.profiles
  for each row execute function public.guard_profile_changes();

-- ───────────────────────────────────────────
-- 2. Emails: nobody can read other people's email
-- ───────────────────────────────────────────

-- The app can read every profile column except email.
-- Your own email still comes from your login.
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, role, created_at) on public.profiles to anon, authenticated;

-- ───────────────────────────────────────────
-- 3. Reviews: only after a completed booking
-- ───────────────────────────────────────────

-- A student can only review a stylist they had a completed booking with.
drop policy if exists "Students write own reviews" on public.reviews;
create policy "Students write own reviews" on public.reviews for insert with check (
  auth.uid() = student_id
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.student_id = auth.uid()
      and b.provider_id = reviews.provider_id
      and b.status = 'completed'
  )
);

-- One review per booking. Skipped if old data already has doubles.
do $$
begin
  if not exists (
    select booking_id from public.reviews
    where booking_id is not null
    group by booking_id having count(*) > 1
  ) then
    create unique index if not exists reviews_one_per_booking on public.reviews (booking_id);
  end if;
end $$;

-- Keep review comments a sensible length.
alter table public.reviews drop constraint if exists reviews_comment_length;
alter table public.reviews add constraint reviews_comment_length
  check (comment is null or char_length(comment) <= 1000) not valid;
