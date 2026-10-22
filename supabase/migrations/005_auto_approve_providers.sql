-- New stylists start out approved
alter table public.provider_profiles alter column is_approved set default true;

-- Approve any stylists who were stuck waiting
update public.provider_profiles set is_approved = true where is_approved = false;
