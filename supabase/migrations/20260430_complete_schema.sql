-- ============================================================
-- PagoIA — Esquema completo de base de datos (producción)
-- Ejecutar en Supabase SQL Editor UNA sola vez
-- ============================================================

-- 1. Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. Tabla profiles
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  country       text default 'México',
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. Tabla transactions
-- ============================================================
create table if not exists public.transactions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  service_type        text,
  provider            text,
  amount              numeric(10,2) not null default 0,
  currency            text not null default 'MXN',
  status              text not null default 'pending',
  transaction_date    timestamptz not null default now(),
  receipt_number      text,
  stripe_session_id   text,
  stripe_payment_intent text,
  metadata            jsonb,
  created_at          timestamptz default now()
);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date desc);
alter table public.transactions enable row level security;
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_service_insert" on public.transactions for insert with check (true);  -- webhook usa service role

-- ============================================================
-- 4. Tabla user_services
-- ============================================================
create table if not exists public.user_services (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  service_type  text not null,
  provider      text,
  status        text not null default 'active',
  due_date      date,
  last_amount   numeric(10,2),
  auto_pay      boolean default false,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_user_services_user_id on public.user_services(user_id);
alter table public.user_services enable row level security;
create policy "user_services_select_own" on public.user_services for select using (auth.uid() = user_id);
create policy "user_services_insert_own" on public.user_services for insert with check (auth.uid() = user_id);
create policy "user_services_update_own" on public.user_services for update using (auth.uid() = user_id);
create policy "user_services_delete_own" on public.user_services for delete using (auth.uid() = user_id);
create policy "user_services_service_update" on public.user_services for update with check (true);  -- webhook usa service role

-- ============================================================
-- 5. Tabla alerts
-- ============================================================
create table if not exists public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  alert_type  text not null default 'info',
  title       text not null,
  message     text,
  url         text,
  is_read     boolean not null default false,
  created_at  timestamptz default now()
);
create index if not exists idx_alerts_user_id on public.alerts(user_id);
create index if not exists idx_alerts_created on public.alerts(created_at desc);
alter table public.alerts enable row level security;
create policy "alerts_select_own" on public.alerts for select using (auth.uid() = user_id);
create policy "alerts_insert_own" on public.alerts for insert with check (auth.uid() = user_id);
create policy "alerts_update_own" on public.alerts for update using (auth.uid() = user_id);
create policy "alerts_delete_own" on public.alerts for delete using (auth.uid() = user_id);
create policy "alerts_service_insert" on public.alerts for insert with check (true);

-- ============================================================
-- 6. Tabla predictions
-- ============================================================
create table if not exists public.predictions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  service_type      text not null,
  predicted_amount  numeric(10,2) not null,
  actual_amount     numeric(10,2),
  prediction_date   date not null default current_date,
  month_year        text,
  confidence_score  numeric(5,2),
  created_at        timestamptz default now()
);
create index if not exists idx_predictions_user_id on public.predictions(user_id);
alter table public.predictions enable row level security;
create policy "predictions_select_own" on public.predictions for select using (auth.uid() = user_id);
create policy "predictions_insert_own" on public.predictions for insert with check (auth.uid() = user_id);
create policy "predictions_update_own" on public.predictions for update using (auth.uid() = user_id);
create policy "predictions_service_insert" on public.predictions for insert with check (true);

-- ============================================================
-- 7. Tabla user_preferences
-- ============================================================
create table if not exists public.user_preferences (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  email_notifications boolean default true,
  push_notifications  boolean default false,
  sms_notifications   boolean default false,
  alert_notifications boolean default true,
  weekly_report       boolean default false,
  profile_public      boolean default false,
  share_data          boolean default false,
  analytics_enabled   boolean default true,
  theme               text default 'dark',
  zoom                integer default 100,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.user_preferences enable row level security;
create policy "prefs_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "prefs_update_own" on public.user_preferences for update using (auth.uid() = user_id);

-- ============================================================
-- 8. Tabla refunds
-- ============================================================
create table if not exists public.refunds (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  transaction_id            uuid references public.transactions(id),
  stripe_refund_id          text unique,
  stripe_payment_intent_id  text,
  amount                    numeric(10,2) not null,
  currency                  text default 'mxn',
  reason                    text,
  status                    text default 'pending',
  metadata                  jsonb,
  created_at                timestamptz default now()
);
create index if not exists idx_refunds_user_id on public.refunds(user_id);
alter table public.refunds enable row level security;
create policy "refunds_select_own" on public.refunds for select using (auth.uid() = user_id);
create policy "refunds_insert_own" on public.refunds for insert with check (auth.uid() = user_id);
create policy "refunds_service_insert" on public.refunds for insert with check (true);

-- ============================================================
-- 9. Tabla push_subscriptions
-- ============================================================
create table if not exists public.push_subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  expiration_time bigint,
  is_active       boolean default true,
  user_agent      text,
  created_at      timestamptz default now()
);
create index if not exists idx_push_user_id on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy "push_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_update_own" on public.push_subscriptions for update using (auth.uid() = user_id);
create policy "push_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);

-- ============================================================
-- 10. Tabla pending_payments
-- ============================================================
create table if not exists public.pending_payments (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  service_type    text not null,
  provider        text,
  amount          numeric(10,2) not null default 0,
  due_date        date,
  status          text not null default 'pending',
  created_at      timestamptz default now()
);
create index if not exists idx_pending_user_id on public.pending_payments(user_id);
alter table public.pending_payments enable row level security;
create policy "pending_select_own" on public.pending_payments for select using (auth.uid() = user_id);
create policy "pending_insert_own" on public.pending_payments for insert with check (auth.uid() = user_id);
create policy "pending_update_own" on public.pending_payments for update using (auth.uid() = user_id);
create policy "pending_delete_own" on public.pending_payments for delete using (auth.uid() = user_id);
create policy "pending_service_upsert" on public.pending_payments for insert with check (true);

-- ============================================================
-- Fin del esquema
-- ============================================================
