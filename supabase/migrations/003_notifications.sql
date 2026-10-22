-- Notifications: in-app inbox for each user.
-- A row is created automatically by triggers whenever a booking changes hands so
-- that providers learn about new bookings and students learn about confirmations.

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('booking_pending', 'booking_confirmed', 'booking_cancelled', 'booking_completed')),
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamp with time zone default now()
);

create index if not exists idx_notifications_user_id_created_at
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_id_unread
  on public.notifications (user_id) where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "Users see own notifications" on public.notifications;
create policy "Users see own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users mark own notifications" on public.notifications;
create policy "Users mark own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ───────────────────────────────────────────
-- Triggers that fan booking activity into notifications
-- ───────────────────────────────────────────

create or replace function public.notify_provider_on_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_user_id uuid;
  service_name text;
  student_name text;
begin
  select user_id into provider_user_id
    from public.provider_profiles where id = new.provider_id;

  if provider_user_id is null then
    return new;
  end if;

  select name into service_name from public.services where id = new.service_id;
  select full_name into student_name from public.profiles where id = new.student_id;

  insert into public.notifications (user_id, type, payload)
  values (
    provider_user_id,
    'booking_pending',
    jsonb_build_object(
      'booking_id', new.id,
      'service_name', coalesce(service_name, ''),
      'student_name', coalesce(student_name, ''),
      'date', new.date,
      'time', new.time
    )
  );

  return new;
end;
$$;

drop trigger if exists notify_provider_on_booking_insert on public.bookings;
create trigger notify_provider_on_booking_insert
  after insert on public.bookings
  for each row execute function public.notify_provider_on_booking_insert();

create or replace function public.notify_student_on_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_name text;
  provider_name text;
  notif_type text;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status not in ('confirmed', 'cancelled', 'completed') then
    return new;
  end if;

  notif_type := 'booking_' || new.status;

  select name into service_name from public.services where id = new.service_id;

  select p.full_name into provider_name
    from public.provider_profiles pp
    join public.profiles p on p.id = pp.user_id
    where pp.id = new.provider_id;

  insert into public.notifications (user_id, type, payload)
  values (
    new.student_id,
    notif_type,
    jsonb_build_object(
      'booking_id', new.id,
      'service_name', coalesce(service_name, ''),
      'provider_name', coalesce(provider_name, ''),
      'date', new.date,
      'time', new.time
    )
  );

  return new;
end;
$$;

drop trigger if exists notify_student_on_booking_status_change on public.bookings;
create trigger notify_student_on_booking_status_change
  after update of status on public.bookings
  for each row execute function public.notify_student_on_booking_status_change();

-- Make the notifications table broadcast inserts so the frontend can subscribe.
alter publication supabase_realtime add table public.notifications;
