#!/usr/bin/env python3
"""
Script para aplicar políticas RLS a las tablas predictions y alerts
"""
import os
import sys
from pathlib import Path

# Cargar variables de entorno
env_path = Path(__file__).parent.parent / ".env.local"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            key, value = line.strip().split("=", 1)
            os.environ[key] = value

try:
    from supabase import create_client
except ImportError:
    print("❌ Instalando supabase...")
    os.system("pip install supabase -q")
    from supabase import create_client

def fix_rls_policies():
    """Aplica las políticas RLS correctas"""
    SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no configurados")
        return False
    
    print("📝 Aplicando políticas RLS...")
    
    try:
        # Leer el archivo SQL
        sql_file = Path(__file__).parent / "004_fix_rls_policies.sql"
        with open(sql_file) as f:
            sql_statements = f.read()
        
        # Crear cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Ejecutar SQL directo usando REST API
        response = supabase.postgrest.auth(SUPABASE_KEY).from_("information_schema.tables").select("*").execute()
        
        print("⚠️  Nota: Las políticas RLS deben aplicarse directamente en Supabase")
        print("   Abre el SQL Editor en https://supabase.com/dashboard/project/*/sql/new")
        print("   y ejecuta el contenido de: scripts/004_fix_rls_policies.sql")
        print("\n📋 Contenido SQL a ejecutar:")
        print("=" * 60)
        print(sql_statements)
        print("=" * 60)
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    fix_rls_policies()
