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

-- ───────────────────────────────────────────
-- 4. Only change what you are meant to change
-- ───────────────────────────────────────────

-- New bookings always start as pending.
drop policy if exists "Students can create bookings" on public.bookings;
create policy "Students can create bookings" on public.bookings for insert with check (
  auth.uid() = student_id and status = 'pending'
);

-- Stylists can change a booking's status, nothing else.
create or replace function public.guard_booking_changes()
returns trigger as $$
begin
  if auth.uid() is not null and (
       new.student_id is distinct from old.student_id
    or new.provider_id is distinct from old.provider_id
    or new.service_id is distinct from old.service_id
    or new.date is distinct from old.date
    or new.time is distinct from old.time
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Only the booking status can be changed';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists guard_booking_changes on public.bookings;
create trigger guard_booking_changes
  before update on public.bookings
  for each row execute function public.guard_booking_changes();

-- People can mark messages they received as read, but not rewrite them.
create or replace function public.guard_message_changes()
returns trigger as $$
begin
  if auth.uid() is not null and (
       new.content is distinct from old.content
    or new.sender_id is distinct from old.sender_id
    or new.receiver_id is distinct from old.receiver_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Messages cannot be edited';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists guard_message_changes on public.messages;
create trigger guard_message_changes
  before update on public.messages
  for each row execute function public.guard_message_changes();

-- Keep messages a sensible length.
alter table public.messages drop constraint if exists messages_content_length;
alter table public.messages add constraint messages_content_length
  check (char_length(content) between 1 and 2000) not valid;

-- People can mark their notifications as read, but not rewrite them.
create or replace function public.guard_notification_changes()
returns trigger as $$
begin
  if auth.uid() is not null and (
       new.user_id is distinct from old.user_id
    or new.type is distinct from old.type
    or new.payload is distinct from old.payload
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Notifications cannot be edited';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists guard_notification_changes on public.notifications;
create trigger guard_notification_changes
  before update on public.notifications
  for each row execute function public.guard_notification_changes();
