-- Sprint 3 · Asistente con IA
-- Conversaciones, mensajes y un tope diario de tokens por usuario.

create table if not exists public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz default now()
);
create index if not exists idx_ai_conversations_user on public.ai_conversations(user_id, created_at desc);

create table if not exists public.ai_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.ai_conversations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null check (role in ('user','assistant')),
  content          jsonb not null,
  input_tokens     int,
  output_tokens    int,
  created_at       timestamptz default now()
);
create index if not exists idx_ai_messages_conversation on public.ai_messages(conversation_id, created_at);

-- Tope diario: el usuario puede leer su consumo pero solo el servidor (service role) lo escribe.
create table if not exists public.ai_usage (
  user_id        uuid references auth.users(id) on delete cascade,
  day            date default current_date,
  input_tokens   int default 0,
  output_tokens  int default 0,
  primary key (user_id, day)
);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages      enable row level security;
alter table public.ai_usage         enable row level security;

drop policy if exists "ai_conv_own" on public.ai_conversations;
create policy "ai_conv_own" on public.ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_msg_own" on public.ai_messages;
create policy "ai_msg_own" on public.ai_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_usage_read_own" on public.ai_usage;
create policy "ai_usage_read_own" on public.ai_usage
  for select using (auth.uid() = user_id);
