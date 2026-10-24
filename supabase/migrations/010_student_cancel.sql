-- Students can cancel their own bookings, and the stylist is told.
-- Also stops the same day being saved twice in opening hours.
-- Runs as one transaction, so it either fully applies or not at all.

begin;

-- ───────────────────────────────────────────
-- 1. Students can cancel their own bookings
-- ───────────────────────────────────────────

-- Cancelling is the only change a student can make.
drop policy if exists "Students can cancel own bookings" on public.bookings;
create policy "Students can cancel own bookings" on public.bookings for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id and status = 'cancelled');

-- Same rules as before, plus: a student can only cancel before the
-- appointment starts.
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

  if auth.uid() = old.student_id
    and new.status = 'cancelled' and old.status <> 'cancelled'
    and old.date + old.time <= (now() at time zone 'America/Chicago')
  then
    raise exception 'You can only cancel before the appointment starts';
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

-- ───────────────────────────────────────────
-- 2. Tell the right person about a change
-- ───────────────────────────────────────────

-- When the student cancels, the stylist is told. Every other change
-- is made by the stylist, so the student is told.
create or replace function public.notify_student_on_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_name text;
  provider_name text;
  provider_user_id uuid;
  student_name text;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status not in ('confirmed', 'cancelled', 'completed') then
    return new;
  end if;

  select name into service_name from public.services where id = new.service_id;

  select pp.user_id, p.full_name into provider_user_id, provider_name
    from public.provider_profiles pp
    join public.profiles p on p.id = pp.user_id
    where pp.id = new.provider_id;

  if new.status = 'cancelled' and auth.uid() = new.student_id then
    if provider_user_id is null then
      return new;
    end if;

    select full_name into student_name from public.profiles where id = new.student_id;

    insert into public.notifications (user_id, type, payload)
    values (
      provider_user_id,
      'booking_cancelled',
      jsonb_build_object(
        'booking_id', new.id,
        'service_name', coalesce(service_name, ''),
        'student_name', coalesce(student_name, ''),
        'cancelled_by', 'student',
        'date', new.date,
        'time', new.time
      )
    );
    return new;
  end if;

  insert into public.notifications (user_id, type, payload)
  values (
    new.student_id,
    'booking_' || new.status,
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

-- ───────────────────────────────────────────
-- 3. Opening hours: each day only once
-- ───────────────────────────────────────────

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

  if (select count(*) <> count(distinct h->>'day_of_week') from jsonb_array_elements(p_hours) h) then
    raise exception 'Each day can only be listed once';
  end if;

  delete from public.availability where provider_id = p_provider_id;

  insert into public.availability (provider_id, day_of_week, open_time, close_time)
  select p_provider_id, h->>'day_of_week', (h->>'open_time')::time, (h->>'close_time')::time
  from jsonb_array_elements(p_hours) h;
end;
$$ language plpgsql set search_path = public;

commit;
