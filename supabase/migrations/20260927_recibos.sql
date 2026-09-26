-- Sprint 4 · Escaneo de recibos
-- Cada recibo escaneado entra como pending_review; nada se paga hasta que el usuario confirma.

create table if not exists public.receipts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  storage_path          text not null,
  service_type          text,
  provider              text,
  service_number_last4  text,            -- nunca el número completo
  period_start          date,
  period_end            date,
  due_date              date,
  amount                numeric(10,2),
  consumption           numeric(12,2),
  consumption_unit      text,            -- kWh, m³
  extracted             jsonb,
  confidence            numeric(4,3),
  status                text not null default 'pending_review'
                          check (status in ('pending_review','confirmed','rejected')),
  confirmed_at          timestamptz,
  created_at            timestamptz default now()
);
create index if not exists idx_receipts_user on public.receipts(user_id, created_at desc);

alter table public.receipts enable row level security;
drop policy if exists "receipts_own" on public.receipts;
create policy "receipts_own" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket privado: cada usuario solo ve su carpeta receipts/{uid}/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "receipt_files_own" on storage.objects;
create policy "receipt_files_own" on storage.objects for all
  using      (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Pagos por hacer. Al confirmar un recibo se crea uno aquí. Si tu base se creó sin
-- 20260430_complete_schema.sql, la tabla no existe todavía.
create table if not exists public.pending_payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  service_type  text not null,
  provider      text,
  amount        numeric(10,2) not null default 0,
  due_date      date,
  status        text not null default 'pending',
  created_at    timestamptz default now()
);
create index if not exists idx_pending_user_id on public.pending_payments(user_id);
alter table public.pending_payments enable row level security;
drop policy if exists "pending_payments_own" on public.pending_payments;
create policy "pending_payments_own" on public.pending_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
