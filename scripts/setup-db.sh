#!/bin/bash

# Script para crear la tabla pending_payments en Supabase
SUPABASE_URL="https://wweoeziquaofporasczt.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZW9lemlxdWFvZnBvcmFzY3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTU1MjksImV4cCI6MjA4OTg5MTUyOX0.q3gg-cZpBkiIHOnJpISplZqrrxhLw4xn3-5oA6ittlE"

# Este script necesita ejecutarse con pnpm desde Node
node << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  try {
    console.log('🔧 Setting up pending_payments table...')

    // Crear tabla
    const { data, error } = await supabase.from('_').raw(`
      CREATE TABLE IF NOT EXISTS public.pending_payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        stripe_payment_intent_id text NOT NULL UNIQUE,
        service_type text NOT NULL,
        amount numeric(10, 2) NOT NULL,
        payment_method text NOT NULL,
        status text NOT NULL DEFAULT 'requires_action',
        oxxo_reference_number text,
        oxxo_expires_at timestamp with time zone,
        bank_account_last4 text,
        bank_transfer_expires_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        expires_at timestamp with time zone,
        completed_at timestamp with time zone,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      )
    `)

    if (error) {
      console.error('❌ Error creating table:', error)
      process.exit(1)
    }

    console.log('✅ Table created successfully!')
  } catch (err) {
    console.error('❌ Setup failed:', err)
    process.exit(1)
  }
}

setupDatabase()
EOF
