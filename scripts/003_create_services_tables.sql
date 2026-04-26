-- Create services table for managing available services
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text not null,
  icon text,
  price decimal(10, 2),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_services table to track which user has which services
create table if not exists public.user_services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  reference_number text,
  account_name text,
  monthly_amount decimal(10, 2),
  due_date integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, service_id, reference_number)
);

-- Enable RLS on services table
alter table public.services enable row level security;

-- Enable RLS on user_services table
alter table public.user_services enable row level security;

-- RLS Policies for services (all users can read, only admins can manage)
create policy "services_select_all" on public.services for select using (true);
create policy "services_insert_admin" on public.services for insert with check (false);
create policy "services_update_admin" on public.services for update using (false);
create policy "services_delete_admin" on public.services for delete using (false);

-- RLS Policies for user_services (users see their own)
create policy "user_services_select_own" on public.user_services for select using (auth.uid() = user_id);
create policy "user_services_insert_own" on public.user_services for insert with check (auth.uid() = user_id);
create policy "user_services_update_own" on public.user_services for update using (auth.uid() = user_id);
create policy "user_services_delete_own" on public.user_services for delete using (auth.uid() = user_id);

-- Insert default services
insert into public.services (name, description, category, icon, price, is_active) values
  ('Electricidad', 'Suministro de energía eléctrica', 'Servicios Básicos', '⚡', 2500.00, true),
-- Insert 10 servicios reales que se pagan en México
insert into public.services (name, description, category, icon, price, is_active) values
  ('CFE - Electricidad', 'Comisión Federal de Electricidad - Suministro de energía', 'Servicios Básicos', '⚡', 2500.00, true),
  ('CONAGUA - Agua', 'Comisión Nacional del Agua - Suministro de agua potable', 'Servicios Básicos', '💧', 1200.00, true),
  ('PEMEX - Gas', 'Gas Licuado de Petróleo para cocina y calefacción', 'Servicios Básicos', '🔥', 1500.00, true),
  ('TELMEX - Internet', 'Teléfonos de México - Servicio de internet y teléfono fijo', 'Telecomunicaciones', '📡', 2000.00, true),
  ('Telefonía Celular', 'Telcel, Movistar, Vodafone - Servicio de telefonía móvil', 'Telecomunicaciones', '📱', 1500.00, true),
  ('Televisión por Cable', 'Izzi, Totalplay, Sky - Servicio de TV e internet', 'Entretenimiento', '📺', 1800.00, true),
  ('Streaming y Suscripciones', 'Netflix, Spotify, Prime Video - Servicios de streaming', 'Entretenimiento', '🎬', 500.00, true),
  ('Seguros', 'Seguros de Auto, Hogar y Vida - Protección y coberturas', 'Seguros', '🛡️', 3000.00, true),
  ('Tenencia Vehicular', 'Tenencia de Vehículos - Trámite anual estatal', 'Impuestos', '🚗', 2000.00, true),
  ('Impuestos Prediales', 'Predial Municipal - Impuesto sobre propiedad inmueble', 'Impuestos', '🏠', 1200.00, true)
on conflict do nothing;
