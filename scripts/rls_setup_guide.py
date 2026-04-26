#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplicar Políticas RLS - Guía Interactiva
"""
import sys
import os

def main():
    sql_content = """DROP POLICY IF EXISTS "Users can only view their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
CREATE POLICY "Users can view their own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can only view their own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can insert their own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON alerts;
CREATE POLICY "Users can view their own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON alerts FOR DELETE USING (auth.uid() = user_id);"""
    
    print("\n" + "=" * 90)
    print("  PASO 1: APLICAR POLITICAS RLS")
    print("=" * 90 + "\n")
    
    print("Sigue estos pasos:\n")
    print("1. Abre en tu navegador:")
    print("   https://supabase.com/dashboard/project/wweoeziquaofporasczt/sql/new\n")
    
    print("2. Copia TODO el siguiente SQL (Ctrl+C después de este bloque):\n")
    print("─" * 90)
    print(sql_content)
    print("─" * 90)
    
    print("\n3. Pégalo en el SQL Editor de Supabase (Ctrl+V)\n")
    print("4. Haz click en 'Run' (botón verde con ▶️)\n")
    print("5. Verifica que aparezca 'Success' en verde\n")
    
    input("Presiona Enter cuando hayas ejecutado el SQL en Supabase...")
    
    print("\n" + "=" * 90)
    print("  PASO 2: CREAR DATOS DE PRUEBA")
    print("=" * 90 + "\n")
    
    print("Ejecuta este comando:")
    print("   python scripts/setup_test_data.py\n")
    
    print("Esto creará automáticamente:")
    print("   - Usuario de prueba: test@pago-ia.local")
    print("   - 5 transacciones")
    print("   - 4 servicios")
    print("   - Predicciones y alertas\n")
    
    print("=" * 90 + "\n")

if __name__ == "__main__":
    main()
