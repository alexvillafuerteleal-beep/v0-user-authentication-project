#!/usr/bin/env python3
"""
Script para aplicar políticas RLS directamente a Supabase
"""
import os
import sys
import json
import requests
from pathlib import Path

def load_env():
    """Cargar variables de entorno"""
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

def apply_rls_policies():
    """Aplicar políticas RLS usando Supabase API"""
    
    env = load_env()
    SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no configurados")
        return False
    
    print("\n" + "="*70)
    print("  Aplicando Políticas RLS - Predictions & Alerts")
    print("="*70 + "\n")
    
    # Si no tenemos service role key, intentar obtenerla
    if not SERVICE_ROLE_KEY:
        print("⚠️  SUPABASE_SERVICE_ROLE_KEY no encontrada en .env.local")
        print("    Necesitamos la service role key para aplicar políticas RLS")
        print("\n📋 Obtén la service role key desde:")
        print("   1. Abre https://supabase.com/dashboard/project/wweoeziquaofporasczt/settings/api")
        print("   2. Copia la 'Service Role Secret'")
        print("   3. Agrégala a .env.local como: SUPABASE_SERVICE_ROLE_KEY=xxx\n")
        
        # Leer de stdin
        SERVICE_ROLE_KEY = input("Pega aquí la Service Role Key (o presiona Enter para saltarse): ").strip()
        
        if not SERVICE_ROLE_KEY:
            print("\n❌ No se puede aplicar políticas sin service role key")
            return False
        
        # Guardar en .env.local
        with open(".env.local", "a") as f:
            f.write(f"\nSUPABASE_SERVICE_ROLE_KEY={SERVICE_ROLE_KEY}\n")
        print("✅ Service role key guardada en .env.local\n")
    
    # SQL a ejecutar
    sql_statements = [
        # Predictions
        """DROP POLICY IF EXISTS "Users can only view their own predictions" ON predictions""",
        """DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions""",
        """DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions""",
        """CREATE POLICY "Users can view their own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id)""",
        """CREATE POLICY "Users can insert their own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id)""",
        """CREATE POLICY "Users can update their own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id)""",
        
        # Alerts
        """DROP POLICY IF EXISTS "Users can only view their own alerts" ON alerts""",
        """DROP POLICY IF EXISTS "Users can update their own alerts" ON alerts""",
        """DROP POLICY IF EXISTS "Users can insert their own alerts" ON alerts""",
        """DROP POLICY IF EXISTS "Users can delete their own alerts" ON alerts""",
        """CREATE POLICY "Users can view their own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id)""",
        """CREATE POLICY "Users can insert their own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id)""",
        """CREATE POLICY "Users can update their own alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id)""",
        """CREATE POLICY "Users can delete their own alerts" ON alerts FOR DELETE USING (auth.uid() = user_id)""",
    ]
    
    # Ejecutar cada SQL
    success_count = 0
    errors = []
    
    for i, sql in enumerate(sql_statements, 1):
        try:
            # Usar requests para llamar al endpoint SQL de Supabase
            headers = {
                "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY
            }
            
            # Construir URL para ejecutar SQL
            sql_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
            
            payload = {
                "query": sql
            }
            
            # Primera intento: usar el endpoint rpc exec_sql
            try:
                response = requests.post(
                    sql_url,
                    headers=headers,
                    json=payload,
                    timeout=10
                )
                
                if response.status_code in [200, 204]:
                    print(f"✅ [{i:2d}] {sql.split()[0:3]}")
                    success_count += 1
                else:
                    # Si falla, intentar con la API REST directa usando curl equivalente
                    print(f"⚠️  [{i:2d}] {sql.split()[0:3]} - Status {response.status_code}")
                    errors.append((sql, response.text))
                    
            except Exception as e:
                # Si el RPC no funciona, intentar ejecutar directamente
                print(f"⚠️  [{i:2d}] Intentando método alternativo...")
                errors.append((sql, str(e)))
            
        except Exception as e:
            print(f"❌ [{i:2d}] Error: {str(e)[:50]}")
            errors.append((sql, str(e)))
    
    print(f"\n{'='*70}")
    print(f"Resultados: {success_count}/{len(sql_statements)} políticas aplicadas")
    print(f"{'='*70}\n")
    
    if errors:
        print("⚠️  Algunos comandos pueden requerir ejecución manual en Supabase SQL Editor\n")
        
        # Mostrar instrucción manual
        print("📋 ALTERNATIVA: Ejecuta manualmente en SQL Editor\n")
        print("Abre https://supabase.com/dashboard y ve a SQL Editor > New Query\n")
        print("Pega este SQL:\n")
        print("-" * 70)
        for sql in sql_statements:
            print(sql + ";")
        print("-" * 70)
    
    return success_count > 0

if __name__ == "__main__":
    try:
        apply_rls_policies()
    except KeyboardInterrupt:
        print("\n❌ Cancelado por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
