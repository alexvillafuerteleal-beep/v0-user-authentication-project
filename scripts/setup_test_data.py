#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

try:
    from supabase import create_client
except:
    os.system("pip install supabase > /dev/null 2>&1")
    from supabase import create_client

def load_env():
    env_vars = {}
    env_path = Path(".env.local")
    if env_path.exists():
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

env = load_env()
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
TEST_EMAIL = "test@pago-ia.local"
TEST_PASSWORD = "Test123456!"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Variables no encontradas")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*60)
print("  SETUP: Datos de Prueba - PagoIA")
print("="*60 + "\n")

# PASO 0: Aplicar políticas RLS
print("PASO 0: Corrigiendo políticas RLS...")
try:
    import requests
    from requests.auth import HTTPBasicAuth
    
    # Usar la API de Supabase para ejecutar SQL
    # Primero obtener el service role key si existe
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    # Intentar ejecutar SQL directamente
    sql_fixes = [
        """
        DROP POLICY IF EXISTS "Users can only view their own predictions" ON predictions;
        DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
        DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
        CREATE POLICY "Users can view their own predictions" ON predictions
          FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own predictions" ON predictions
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own predictions" ON predictions
          FOR UPDATE USING (auth.uid() = user_id);
        """,
        """
        DROP POLICY IF EXISTS "Users can only view their own alerts" ON alerts;
        DROP POLICY IF EXISTS "Users can update their own alerts" ON alerts;
        DROP POLICY IF EXISTS "Users can insert their own alerts" ON alerts;
        DROP POLICY IF EXISTS "Users can delete their own alerts" ON alerts;
        CREATE POLICY "Users can view their own alerts" ON alerts
          FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own alerts" ON alerts
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own alerts" ON alerts
          FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete their own alerts" ON alerts
          FOR DELETE USING (auth.uid() = user_id);
        """
    ]
    
    # Nota: Estas políticas deberían ejecutarse manualmente en Supabase SQL Editor
    # o a través de Supabase migrations
    print("⚠️  Políticas RLS deben aplicarse manualmente en Supabase")
    print("   Abre: https://supabase.com/dashboard/project/*/sql/new")
    print("   Ejecuta scripts/004_fix_rls_policies.sql")
    print("   Luego ejecuta este script de nuevo\n")
    
except Exception as e:
    print(f"⚠️  No se pudieron aplicar políticas RLS automáticamente: {e}\n")

print("PASO 1: Creando/Autenticando usuario...")
user_id = None
try:
    response = supabase.auth.sign_up({
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "options": {"data": {"full_name": "Test User", "phone": "+51 999 9971", "country": "Peru"}}
    })
    user_id = response.user.id
    print(f"Usuario NEW")
except Exception as e:
    if "already registered" in str(e).lower():
        print(f"Usuario EXISTS")
    else:
        pass

try:
    auth_response = supabase.auth.sign_in_with_password({"email": TEST_EMAIL, "password": TEST_PASSWORD})
    user_id = auth_response.user.id
    print(f"Autenticado OK")
except Exception as e:
    print(f"ERROR Auth: {e}")
    sys.exit(1)

print(f"UUID: {user_id}\n")

base_date = datetime.now()

print("PASO 2: Insertando datos de prueba...\n")

try:
    transactions = [
        {"user_id": user_id, "service_type": "electricity", "amount": 50.0, "status": "completed", "transaction_date": (base_date - timedelta(days=7)).isoformat(), "provider": "Enel"},
        {"user_id": user_id, "service_type": "water", "amount": 25.0, "status": "completed", "transaction_date": (base_date - timedelta(days=5)).isoformat(), "provider": "SEDAPAL"},
        {"user_id": user_id, "service_type": "internet", "amount": 45.0, "status": "completed", "transaction_date": (base_date - timedelta(days=3)).isoformat(), "provider": "Claro"},
        {"user_id": user_id, "service_type": "gas", "amount": 35.0, "status": "completed", "transaction_date": (base_date - timedelta(days=1)).isoformat(), "provider": "Calidda"},
        {"user_id": user_id, "service_type": "electricity", "amount": 52.5, "status": "pending", "transaction_date": base_date.isoformat(), "provider": "Enel"},
    ]
    supabase.table("transactions").insert(transactions).execute()
    print(f"OK: {len(transactions)} transacciones")
except Exception as e:
    print(f"WARN: Transacciones - {str(e)[:80]}")

try:
    user_services_data = [
        {"user_id": user_id, "service_type": "electricity", "account_number": "123456789", "provider": "Enel Peru", "status": "active", "due_date": 15, "last_amount": 50.0},
        {"user_id": user_id, "service_type": "water", "account_number": "WAT-987654", "provider": "SEDAPAL", "status": "active", "due_date": 20, "last_amount": 25.0},
        {"user_id": user_id, "service_type": "internet", "account_number": "INT-456789", "provider": "Claro Peru", "status": "active", "due_date": 25, "last_amount": 45.0},
        {"user_id": user_id, "service_type": "gas", "account_number": "GAS-123123", "provider": "Calidda", "status": "active", "due_date": 10, "last_amount": 35.0},
    ]
    supabase.table("user_services").insert(user_services_data).execute()
    print(f"OK: {len(user_services_data)} servicios")
except Exception as e:
    print(f"WARN: Servicios - {str(e)[:80]}")

try:
    predictions_data = [
        {"user_id": user_id, "service_type": "electricity", "predicted_amount": 52.5, "actual_amount": 50.0, "confidence_score": 0.95, "prediction_date": (base_date - timedelta(days=30)).isoformat(), "month_year": "2026-02"},
        {"user_id": user_id, "service_type": "water", "predicted_amount": 24.0, "actual_amount": 25.0, "confidence_score": 0.96, "prediction_date": (base_date - timedelta(days=25)).isoformat(), "month_year": "2026-02"},
        {"user_id": user_id, "service_type": "internet", "predicted_amount": 44.99, "actual_amount": 45.0, "confidence_score": 0.99, "prediction_date": (base_date - timedelta(days=20)).isoformat(), "month_year": "2026-02"},
        {"user_id": user_id, "service_type": "gas", "predicted_amount": 36.0, "actual_amount": 35.0, "confidence_score": 0.97, "prediction_date": (base_date - timedelta(days=15)).isoformat(), "month_year": "2026-02"},
    ]
    supabase.table("predictions").insert(predictions_data).execute()
    print(f"OK: {len(predictions_data)} predicciones")
except Exception as e:
    print(f"WARN: Predicciones - {str(e)[:80]}")

try:
    alerts_data = [
        {"user_id": user_id, "title": "Consumo anormal", "message": "Tu consumo de electricidad es 15% superior", "alert_type": "warning", "is_read": False},
        {"user_id": user_id, "title": "Pago proceso", "message": "Tu pago de agua por $25.00 se proceso", "alert_type": "success", "is_read": True},
        {"user_id": user_id, "title": "Recordatorio vencimiento", "message": "Tu factura vence en 3 dias", "alert_type": "info", "is_read": False},
    ]
    supabase.table("alerts").insert(alerts_data).execute()
    print(f"OK: {len(alerts_data)} alertas")
except Exception as e:
    print(f"WARN: Alertas - {str(e)[:80]}")

print("\nPASO 3: Datos insertados correctamente")
print("\n" + "="*60)
print("  CREDENCIALES")
print("="*60)
print(f"Email: {TEST_EMAIL}")
print(f"Password: {TEST_PASSWORD}")
print(f"User ID: {user_id}")
print("\nProximos: npm run dev")
print("="*60 + "\n")
