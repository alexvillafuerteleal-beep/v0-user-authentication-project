#!/usr/bin/env python3
import os
import sys
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("Installing supabase...")
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

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Variables no encontradas")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\nEsquema de BD - PagoIA\n")

tables = ["transactions", "user_services", "predictions", "alerts"]

for table in tables:
    try:
        response = supabase.table(table).select("*").limit(1).execute()
        if response.data:
            columns = list(response.data[0].keys())
            print(f"{table}:")
            for col in columns:
                print(f"  - {col}")
        else:
            print(f"{table}: (empty)")
    except Exception as e:
        print(f"{table}: ERROR - {e}")

print()
