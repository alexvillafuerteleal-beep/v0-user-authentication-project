import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_KEY or SUPABASE_URL")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
-- Create pending_payments table for tracking deferred payments
create table if not exists public.pending_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  service_type text not null,
  amount numeric(10, 2) not null,
  payment_method text not null,
  status text not null default 'requires_action',
  
  -- OXXO specific fields
  oxxo_reference_number text,
  oxxo_expires_at timestamp with time zone,
  
  -- Bank transfer specific fields
  bank_account_last4 text,
  bank_transfer_expires_at timestamp with time zone,
  
  -- General timestamp fields
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.pending_payments enable row level security;

-- RLS Policies
create policy "pending_payments_select_own" on public.pending_payments for select using (auth.uid() = user_id);
create policy "pending_payments_insert_own" on public.pending_payments for insert with check (auth.uid() = user_id);
create policy "pending_payments_update_own" on public.pending_payments for update using (auth.uid() = user_id);
create policy "pending_payments_delete_own" on public.pending_payments for delete using (auth.uid() = user_id);

-- Create indices for performance
create index if not exists pending_payments_user_id_idx on public.pending_payments(user_id);
create index if not exists pending_payments_status_idx on public.pending_payments(status);
create index if not exists pending_payments_stripe_id_idx on public.pending_payments(stripe_payment_intent_id);
create index if not exists pending_payments_expires_at_idx on public.pending_payments(expires_at);
`

async function setupDatabase() {
  try {
    console.log("🔧 Setting up pending_payments table in Supabase...")

    const { error } = await supabase.rpc("query", { query: sql })

    if (error) {
      console.error("❌ Error:", error)
      process.exit(1)
    }

    console.log("✅ Database setup complete!")
  } catch (err) {
    console.error("❌ Setup failed:", err)
    process.exit(1)
  }
}

setupDatabase()
