-- Sprint 6 · Hogar compartido
-- Un hogar agrupa a roommates o familia; un pago se puede dividir por porcentajes.

create table if not exists public.households (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null check (length(name) between 1 and 60),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table if not exists public.household_members (
  household_id  uuid references public.households(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner','member')),
  joined_at     timestamptz default now(),
  primary key (household_id, user_id)
);

-- Códigos de invitación que el dueño comparte (no requieren correo).
create table if not exists public.household_invites (
  code          text primary key,
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid not null references auth.users(id) on delete cascade,
  expires_at    timestamptz not null default now() + interval '7 days',
  used_by       uuid references auth.users(id),
  used_at       timestamptz
);

create table if not exists public.bill_splits (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references public.households(id) on delete cascade,
  transaction_id  uuid references public.transactions(id) on delete set null,
  created_by      uuid not null references auth.users(id) on delete cascade,
  description     text not null,
  total_amount    numeric(10,2) not null check (total_amount > 0),
  user_id         uuid not null references auth.users(id) on delete cascade,  -- quien debe esta parte
  share_pct       numeric(5,2) not null check (share_pct > 0 and share_pct <= 100),
  amount_owed     numeric(10,2) not null check (amount_owed >= 0),
  status          text not null default 'pending' check (status in ('pending','paid')),
  paid_at         timestamptz,
  created_at      timestamptz default now()
);
create index if not exists idx_bill_splits_household on public.bill_splits(household_id, created_at desc);

-- security definer evita la recursión de políticas entre households y household_members.
create or replace function public.is_household_member(hid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid())
$$;

-- Miembros con un nombre visible; solo responde si quien pregunta es miembro.
create or replace function public.get_household_members(hid uuid)
  returns table (user_id uuid, role text, display_name text)
  language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1))
  from household_members m
  join auth.users u on u.id = m.user_id
  left join profiles p on p.id = m.user_id
  where m.household_id = hid and public.is_household_member(hid)
$$;

-- Canjea un código de invitación vigente y agrega al usuario actual como miembro.
create or replace function public.join_household(invite_code text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  inv household_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select * into inv from household_invites where code = upper(trim(invite_code)) for update;
  if not found or inv.expires_at < now() or inv.used_by is not null then
    raise exception 'El código no existe o ya venció';
  end if;
  insert into household_members (household_id, user_id, role) values (inv.household_id, auth.uid(), 'member')
    on conflict do nothing;
  update household_invites set used_by = auth.uid(), used_at = now() where code = inv.code;
  return inv.household_id;
end
$$;

alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.bill_splits       enable row level security;

drop policy if exists "hh_read" on public.households;
create policy "hh_read" on public.households for select using (public.is_household_member(id) or owner_id = auth.uid());
drop policy if exists "hh_create" on public.households;
create policy "hh_create" on public.households for insert with check (owner_id = auth.uid());
drop policy if exists "hh_update_owner" on public.households;
create policy "hh_update_owner" on public.households for update using (owner_id = auth.uid());
drop policy if exists "hh_delete_owner" on public.households;
create policy "hh_delete_owner" on public.households for delete using (owner_id = auth.uid());

drop policy if exists "hhm_read" on public.household_members;
create policy "hhm_read" on public.household_members for select using (public.is_household_member(household_id));
drop policy if exists "hhm_owner_insert" on public.household_members;
create policy "hhm_owner_insert" on public.household_members for insert with check (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));
drop policy if exists "hhm_leave_or_remove" on public.household_members;
create policy "hhm_leave_or_remove" on public.household_members for delete using (
  user_id = auth.uid() or exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));

drop policy if exists "inv_owner" on public.household_invites;
create policy "inv_owner" on public.household_invites for all using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()))
  with check (created_by = auth.uid() and exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));

drop policy if exists "split_read" on public.bill_splits;
create policy "split_read" on public.bill_splits for select using (public.is_household_member(household_id));
drop policy if exists "split_create" on public.bill_splits;
create policy "split_create" on public.bill_splits for insert with check (
  created_by = auth.uid()
  and public.is_household_member(household_id)
  -- la parte solo se puede asignar a alguien del mismo hogar
  and exists (select 1 from public.household_members m where m.household_id = bill_splits.household_id and m.user_id = bill_splits.user_id));
drop policy if exists "split_settle" on public.bill_splits;
create policy "split_settle" on public.bill_splits for update using (user_id = auth.uid() or created_by = auth.uid());
drop policy if exists "split_delete_creator" on public.bill_splits;
create policy "split_delete_creator" on public.bill_splits for delete using (created_by = auth.uid());
