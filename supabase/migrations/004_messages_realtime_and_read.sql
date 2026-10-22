-- Realtime messaging + unread tracking.
-- - Adds an is_read flag on messages so we can show unread counts and badges.
-- - Lets the receiver update is_read on messages they received.
-- - Publishes the messages table to the realtime feed so the frontend
--   subscriptions in Conversation/Messages fire on inserts.

alter table public.messages
  add column if not exists is_read boolean not null default false;

create index if not exists idx_messages_receiver_unread
  on public.messages (receiver_id) where is_read = false;

drop policy if exists "Receivers can mark messages read" on public.messages;
create policy "Receivers can mark messages read" on public.messages
  for update using (auth.uid() = receiver_id);

alter publication supabase_realtime add table public.messages;
