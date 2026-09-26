-- Recordatorios por WhatsApp y pagos automáticos con tarjeta guardada.
-- Requiere 20260927_recibos.sql (pending_payments) y 20260928_presupuestos_recordatorios.sql (reminders).

-- WhatsApp como tercer canal de recordatorio.
alter table public.reminders drop constraint if exists reminders_channel_check;
alter table public.reminders
  add constraint reminders_channel_check check (channel in ('push','email','whatsapp'));

-- Cliente de Stripe y tarjeta guardada de cada usuario. Solo el servidor escribe aquí
-- (service role); el usuario puede ver su marca y últimos 4 dígitos.
create table if not exists public.payment_profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id  text not null unique,
  payment_method_id   text,
  card_brand          text,
  card_last4          text,
  card_exp            text,
  updated_at          timestamptz default now()
);
alter table public.payment_profiles enable row level security;
drop policy if exists "payment_profiles_select_own" on public.payment_profiles;
create policy "payment_profiles_select_own" on public.payment_profiles
  for select using (auth.uid() = user_id);

-- Un pago automático por servicio: se cobra el recibo pendiente si no pasa del tope.
create table if not exists public.scheduled_payments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  user_service_id  uuid not null references public.user_services(id) on delete cascade,
  max_amount       numeric(10,2) not null check (max_amount > 0 and max_amount <= 20000),
  days_before      int not null default 1 check (days_before between 0 and 10),
  active           boolean not null default true,
  created_at       timestamptz default now(),
  unique (user_service_id)
);
create index if not exists idx_scheduled_payments_user on public.scheduled_payments(user_id);
alter table public.scheduled_payments enable row level security;
drop policy if exists "scheduled_payments_own" on public.scheduled_payments;
create policy "scheduled_payments_own" on public.scheduled_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bitácora: un intento por recibo pendiente (unique), así el cron nunca cobra dos veces.
create table if not exists public.autopay_runs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  scheduled_payment_id   uuid references public.scheduled_payments(id) on delete set null,
  pending_payment_id     uuid not null unique references public.pending_payments(id) on delete cascade,
  amount                 numeric(10,2) not null,
  status                 text not null check (status in ('processing','succeeded','failed')),
  reason                 text,
  stripe_payment_intent  text,
  created_at             timestamptz default now()
);
create index if not exists idx_autopay_runs_user on public.autopay_runs(user_id, created_at desc);
alter table public.autopay_runs enable row level security;
drop policy if exists "autopay_runs_select_own" on public.autopay_runs;
create policy "autopay_runs_select_own" on public.autopay_runs
  for select using (auth.uid() = user_id);
