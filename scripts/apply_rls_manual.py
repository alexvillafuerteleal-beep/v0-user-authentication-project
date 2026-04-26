#!/usr/bin/env python3
"""
Script para aplicar políticas RLS - Versión simplificada
"""
import os
import sys
from pathlib import Path

def apply_rls_policies_manual():
    """Mostrar SQL para ejecutar manualmente"""
    
    sql_statements = """
-- Corregir políticas RLS para PREDICTIONS
DROP POLICY IF EXISTS "Users can only view their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;

CREATE POLICY "Users can view their own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Corregir políticas RLS para ALERTS
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
    
    print("\n" + "="*80)
    print("  APLICAR POLITICAS RLS - PREDICTIONS & ALERTS")
    print("="*80 + "\n")
    
    print("📋 PASOS A SEGUIR:\n")
    print("1. Abre https://supabase.com/dashboard")
    print("   Selecciona proyecto: wweoeziquaofporasczt\n")
    print("2. Ve a SQL Editor > New Query\n")
    print("3. Copia y pega el siguiente SQL:\n")
    print("-" * 80)
    print(sql_statements)
    print("-" * 80)
    print("\n4. Haz click en 'Run' (botón verde con ▶️)\n")
    print("5. Verifica que todos los comandos se ejecutaron sin errores\n")
    print("="*80 + "\n")
    
    input("Presiona Enter cuando hayas ejecutado el SQL en Supabase...")
    
    print("\n✅ Políticas RLS aplicadas correctamente\n")
    print("Ahora ejecuta: python scripts/setup_test_data.py\n")

if __name__ == "__main__":
    apply_rls_policies_manual()
