#!/usr/bin/env python3
"""
Script to deploy SQL schema to Supabase
Ejecutar: python scripts/deploy_schema.py
"""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

def main():
    print("🚀 Iniciando deploy del schema SQL a Supabase...\n")
    
    # Obtener credenciales de .env.local
    env_file = Path(".env.local")
    if not env_file.exists():
        print("❌ Error: .env.local no encontrado")
        sys.exit(1)
    
    env_vars = {}
    with open(env_file, encoding='utf-8') as f:
        for line in f:
            if "=" in line:
                key, value = line.strip().split("=", 1)
                env_vars[key] = value
    
    supabase_url = env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = env_vars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Credenciales de Supabase no encontradas en .env.local")
        sys.exit(1)
    
    print(f"✅ Credenciales cargadas de .env.local")
    print(f"📍 Supabase URL: {supabase_url[:50]}...")
    
    # Leer archivo SQL
    sql_file = Path("scripts/002_create_tables.sql")
    if not sql_file.exists():
        print("❌ Error: scripts/002_create_tables.sql no encontrado")
        sys.exit(1)
    
    with open(sql_file, encoding='utf-8') as f:
        sql_content = f.read()
    
    print(f"📄 Archivo SQL cargado ({len(sql_content)} caracteres)")
    print("⏳ Procesando statements...\n")
    
    # Dividir en statements
    statements = [
        s.strip() for s in sql_content.split(';') 
        if s.strip() and not s.strip().startswith('--')
    ]
    
    print(f"📊 Total de statements: {len(statements)}\n")
    print("=" * 70)
    print("INSTRUCCIÓN MANUAL:")
    print("=" * 70)
    print("1. Abre: https://app.supabase.com/project/wweoeziquaofporasczt/sql/new")
    print("2. Copia y pega el siguiente SQL:")
    print("=" * 70)
    print(sql_content)
    print("=" * 70)
    print("3. Haz click en RUN (botón verde)")
    print("4. Verifica que se crean las 4 tablas en Table Editor")
    print("\n✨ Luego ejecuta: npm run dev")
    print("   y abre: http://localhost:3000/dashboard\n")

if __name__ == "__main__":
    main()
