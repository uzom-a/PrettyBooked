-- Link tables to public.profiles so the app can show names next to
-- stylists, bookings, messages and reviews.
-- Before this, these columns pointed at auth.users, which the app cannot
-- join through, so stylist lists came back empty.

-- Every account needs a profile row before the links can be added.
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(coalesce(u.email, 'user'), '@', 1)),
  case
    when u.raw_user_meta_data->>'role' in ('student', 'provider')
      then u.raw_user_meta_data->>'role'
    else 'student'
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

alter table public.provider_profiles
  drop constraint if exists provider_profiles_user_id_fkey,
  add constraint provider_profiles_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.bookings
  drop constraint if exists bookings_student_id_fkey,
  add constraint bookings_student_id_fkey
    foreign key (student_id) references public.profiles(id) on delete cascade;

alter table public.messages
  drop constraint if exists messages_sender_id_fkey,
  add constraint messages_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete cascade;

alter table public.messages
  drop constraint if exists messages_receiver_id_fkey,
  add constraint messages_receiver_id_fkey
    foreign key (receiver_id) references public.profiles(id) on delete cascade;

alter table public.reviews
  drop constraint if exists reviews_student_id_fkey,
  add constraint reviews_student_id_fkey
    foreign key (student_id) references public.profiles(id) on delete cascade;

-- Tell the API about the new links straight away.
notify pgrst, 'reload schema';
