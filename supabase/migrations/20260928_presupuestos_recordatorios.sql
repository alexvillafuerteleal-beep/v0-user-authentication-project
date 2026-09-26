-- Sprint 5 · Predicción con intervalo, presupuestos y recordatorios

-- Predicciones: intervalo, periodo de facturación y versión del modelo.
alter table public.predictions
  add column if not exists model_version  text,
  add column if not exists lower_bound    numeric(10,2),
  add column if not exists upper_bound    numeric(10,2),
  add column if not exists billing_period text;
create unique index if not exists idx_predictions_period
  on public.predictions(user_id, service_type, billing_period);

-- Alertas: severidad y origen (evita duplicar la misma alerta en cada corrida del cron).
alter table public.alerts
  add column if not exists severity text default 'info',
  add column if not exists source   text;
create index if not exists idx_alerts_source on public.alerts(user_id, source);

create table if not exists public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  service_type  text not null,
  period_limit  numeric(10,2) not null check (period_limit > 0),
  alert_at_pct  int not null default 80 check (alert_at_pct between 10 and 100),
  created_at    timestamptz default now(),
  unique (user_id, service_type)
);

create table if not exists public.reminders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  user_service_id  uuid not null references public.user_services(id) on delete cascade,
  channel          text not null check (channel in ('push','email')),
  days_before      int not null default 3 check (days_before between 0 and 15),
  last_sent_at     timestamptz,
  unique (user_service_id, channel)
);

alter table public.budgets   enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "budgets_own" on public.budgets;
create policy "budgets_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reminders_own" on public.reminders;
create policy "reminders_own" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
