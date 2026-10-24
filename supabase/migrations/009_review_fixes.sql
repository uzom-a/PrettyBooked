-- Fixes from the second review: removing services, completing bookings,
-- saving hours and who can message whom.
-- Runs as one transaction, so it either fully applies or not at all.

begin;

-- ───────────────────────────────────────────
-- 1. Booking changes
-- ───────────────────────────────────────────

-- Removing a service clears service_id on its bookings, which the old
-- guard refused. A booking can also only be completed once it has started,
-- so nobody can review an appointment that has not happened yet.
create or replace function public.guard_booking_changes()
returns trigger as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.service_id is distinct from old.service_id and not (
    new.service_id is null
    and not exists (select 1 from public.services where id = old.service_id)
  ) then
    raise exception 'Only the booking status can be changed';
  end if;

  if new.student_id is distinct from old.student_id
    or new.provider_id is distinct from old.provider_id
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

  if new.status = 'completed' and old.status <> 'completed'
    and new.date + new.time > (now() at time zone 'America/Chicago')
  then
    raise exception 'You can mark a booking completed once the appointment has started';
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

-- ───────────────────────────────────────────
-- 2. Save opening hours in one step
-- ───────────────────────────────────────────

-- Replaces all of a stylist's hours at once. If anything fails, the old
-- hours stay. Runs as the signed-in user, so the usual rules still apply.
create or replace function public.save_availability(p_provider_id uuid, p_hours jsonb)
returns void as $$
begin
  if not exists (
    select 1 from public.provider_profiles where id = p_provider_id and user_id = auth.uid()
  ) then
    raise exception 'You can only change your own hours';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_hours) h
    where (h->>'close_time')::time <= (h->>'open_time')::time
  ) then
    raise exception 'Closing time must be after opening time';
  end if;

  delete from public.availability where provider_id = p_provider_id;

  insert into public.availability (provider_id, day_of_week, open_time, close_time)
  select p_provider_id, h->>'day_of_week', (h->>'open_time')::time, (h->>'close_time')::time
  from jsonb_array_elements(p_hours) h;
end;
$$ language plpgsql set search_path = public;

revoke all on function public.save_availability(uuid, jsonb) from public;
grant execute on function public.save_availability(uuid, jsonb) to authenticated;

-- ───────────────────────────────────────────
-- 3. Messages: anyone signed in can message a stylist
-- ───────────────────────────────────────────

-- Allowed: message any stylist, reply to someone who messaged you, and
-- stylists can message students who booked them. Students cannot be
-- cold-messaged by strangers.
create or replace function public.can_message(p_sender uuid, p_receiver uuid)
returns boolean as $$
  select p_sender <> p_receiver and (
    exists (select 1 from public.provider_profiles where user_id = p_receiver)
    or exists (
      select 1 from public.messages
      where sender_id = p_receiver and receiver_id = p_sender
    )
    or public.have_booking_together(p_sender, p_receiver)
  )
$$ language sql stable security definer set search_path = public;

revoke all on function public.can_message(uuid, uuid) from public;
grant execute on function public.can_message(uuid, uuid) to authenticated;

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages" on public.messages for insert with check (
  auth.uid() = sender_id and public.can_message(sender_id, receiver_id)
);

commit;
