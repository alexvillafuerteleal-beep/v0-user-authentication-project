#!/usr/bin/env python3
"""
Script para cargar datos de prueba a Supabase
Uso: python scripts/seed_data.py
"""

import os
import sys
import json
from pathlib import Path
from urllib.request import urlopen, Request, urlopen
from urllib.error import URLError
import time

def load_env():
    """Cargar variables de entorno desde .env.local"""
    env_file = Path(".env.local")
    if not env_file.exists():
        print("❌ Error: .env.local no encontrado")
        sys.exit(1)
    
    env_vars = {}
    with open(env_file, encoding='utf-8') as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                env_vars[key] = value
    
    return env_vars

def get_or_create_user(supabase_url, api_key):
    """Obtener o crear usuario de prueba"""
    print("🔍 Buscando usuarios existentes...")
    
    try:
        req = Request(
            f"{supabase_url}/rest/v1/auth.users",
            headers={
                "apikey": api_key,
                "Authorization": f"Bearer {api_key}",
            }
        )
        
        with urlopen(req) as response:
            data = json.loads(response.read())
            if data:
                user_id = data[0]['id']
                print(f"✅ Usuario encontrado: {user_id}")
                return user_id
    except Exception as e:
        print(f"ℹ️  No se pudo acceder a auth.users, usando UUID genérico")
    
    # Usar un UUID de prueba consistente
    test_uuid = "550e8400-e29b-41d4-a716-446655440000"
    print(f"📝 Usando UUID de prueba: {test_uuid}")
    return test_uuid

def insert_data(supabase_url, api_key, user_id):
    """Insertar datos de prueba en Supabase"""
    
    # Datos de transacciones
    transactions = [
        ["electricity", 120.00, "2026-03-03T00:00:00", "completed", "ENEL", "ENEL-001"],
        ["water", 45.50, "2026-03-05T00:00:00", "completed", "SEDAPAL", "SDPL-001"],
        ["gas", 65.75, "2026-03-08T00:00:00", "completed", "CALIDDA", "CALD-001"],
        ["internet", 89.90, "2026-03-13T00:00:00", "completed", "CLARO", "CLAR-001"],
        ["electricity", 125.50, "2026-03-18T00:00:00", "completed", "ENEL", "ENEL-002"],
    ]
    
    print("\n📊 Insertando datos...\n")
    
    # Insertar transacciones
    print("💳 Insertando transacciones...")
    for i, trans in enumerate(transactions, 1):
        payload = {
            "user_id": user_id,
            "service_type": trans[0],
            "amount": trans[1],
            "transaction_date": trans[2],
            "status": trans[3],
            "provider": trans[4],
            "receipt_number": trans[5],
        }
        
        try:
            req = Request(
                f"{supabase_url}/rest/v1/transactions",
                method="POST",
                headers={
                    "apikey": api_key,
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                data=json.dumps(payload).encode()
            )
            
            with urlopen(req) as response:
                print(f"  ✅ Transacción {i}: {trans[0]} ${trans[1]}")
                time.sleep(0.2)  # Rate limiting
        except URLError as e:
            if "409" in str(e) or "duplicate" in str(e).lower():
                print(f"  ℹ️  Transacción {i} ya existe (ignorado)")
            else:
                print(f"  ⚠️  Error en transacción {i}: {e}")
    
    # Insertar servicios
    print("\n🔌 Insertando servicios del usuario...")
    services = [
        ["electricity", "ENEL", "ENEL-12345-ABC", "active", 25, 120.00],
        ["water", "SEDAPAL", "SEDAPAL-67890-DEF", "active", 23, 45.50],
        ["gas", "CALIDDA", "CALIDDA-11111-GHI", "active", 20, 65.75],
        ["internet", "CLARO", "CLARO-22222-JKL", "active", 1, 89.90],
    ]
    
    for i, service in enumerate(services, 1):
        payload = {
            "user_id": user_id,
            "service_type": service[0],
            "provider": service[1],
            "account_number": service[2],
            "status": service[3],
            "due_date": service[4],
            "last_amount": service[5],
        }
        
        try:
            req = Request(
                f"{supabase_url}/rest/v1/user_services",
                method="POST",
                headers={
                    "apikey": api_key,
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                data=json.dumps(payload).encode()
            )
            
            with urlopen(req) as response:
                print(f"  ✅ Servicio {i}: {service[0]}")
                time.sleep(0.2)
        except URLError as e:
            if "409" in str(e):
                print(f"  ℹ️  Servicio {i} ya existe")
            else:
                print(f"  ⚠️  Error: {e}")
    
    # Insertar alertas
    print("\n🔔 Insertando alertas...")
    alerts = [
        ["upcoming", "Próximo Vencimiento", "Tu factura de Internet vence el 01 de Abril"],
        ["increase", "Aumento Detectado", "El consumo de Electricidad aumentó 5%"],
        ["savings", "Oportunidad de Ahorro", "Podrías ahorrar $50 este mes"],
    ]
    
    for i, alert in enumerate(alerts, 1):
        payload = {
            "user_id": user_id,
            "alert_type": alert[0],
            "title": alert[1],
            "message": alert[2],
            "is_read": False,
        }
        
        try:
            req = Request(
                f"{supabase_url}/rest/v1/alerts",
                method="POST",
                headers={
                    "apikey": api_key,
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                data=json.dumps(payload).encode()
            )
            
            with urlopen(req) as response:
                print(f"  ✅ Alerta {i}: {alert[0]}")
                time.sleep(0.2)
        except URLError as e:
            if "409" in str(e):
                print(f"  ℹ️  Alerta {i} ya existe")
            else:
                print(f"  ⚠️  Error: {e}")
    
    print(f"\n✨ Datos de prueba cargados para usuario: {user_id}")
    print(f"📌 Usa este UUID si necesitas consultar datos específicos")
    
    return user_id

def main():
    print("=" * 70)
    print("🚀 Cargador de Datos de Prueba - PagoIA")
    print("=" * 70)
    print()
    
    env = load_env()
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    api_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not api_key:
        print("❌ Error: Credenciales no encontradas")
        sys.exit(1)
    
    print(f"✅ Conectando a: {supabase_url[:50]}...")
    print()
    
    user_id = get_or_create_user(supabase_url, api_key)
    print()
    
    insert_data(supabase_url, api_key, user_id)
    
    print()
    print("=" * 70)
    print("✅ Proceso completado!")
    print("=" * 70)
    print()
    print("📝 Próximos pasos:")
    print("  1. npm run dev")
    print("  2. Abre: http://localhost:3000/dashboard")
    print("  3. Verifica que ves los datos cargados")
    print()

if __name__ == "__main__":
    main()
