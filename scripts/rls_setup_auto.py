#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script Automático para Aplicar Políticas RLS
Copia SQL al portapapeles y abre Supabase
"""
import os
import sys
import webbrowser
import subprocess
from pathlib import Path

def copy_to_clipboard(text):
    """Copiar texto al portapapeles"""
    try:
        # Usar powershell en Windows - más confiable
        process = subprocess.Popen(
            ['powershell', '-NoProfile', '-Command', 
             f'$text | Set-Clipboard'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding='utf-8',
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        )
        stdout, stderr = process.communicate(input=text, timeout=5)
        return process.returncode == 0
    except subprocess.TimeoutExpired:
        process.kill()
        return False
    except Exception as e:
        print(f"  Advertencia: No se pudo copiar ({type(e).__name__})")
        return False

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
    
    print("\n" + "=" * 100)
    print("  APLICANDO POLITICAS RLS - PREDICTIONS & ALERTS")
    print("=" * 100)
    
    print("\n1. Copiando SQL al portapapeles...")
    if copy_to_clipboard(sql_content):
        print("   ✓ SQL copiado exitosamente\n")
    else:
        print("   ✗ No se pudo copiar. Tendrás que copiar manualmente.\n")
        print("SQL a copiar:")
        print("-" * 100)
        print(sql_content)
        print("-" * 100)
        print()
    
    print("2. Abriendo Supabase SQL Editor en el navegador...")
    url = "https://supabase.com/dashboard/project/wweoeziquaofporasczt/sql/new"
    webbrowser.open(url)
    print(f"   → {url}\n")
    
    print("3. Instrucciones:")
    print("   a) El SQL ya está en tu portapapeles")
    print("   b) En Supabase, pega el SQL (Ctrl+V)")
    print("   c) Haz click en 'Run' (botón verde)")
    print("   d) Verifica que todos los comandos se ejecutaron sin errores\n")
    
    input("Presiona ENTER cuando hayas ejecutado el SQL en Supabase...\n")
    
    print("\n" + "=" * 100)
    print("  CREANDO DATOS DE PRUEBA")
    print("=" * 100 + "\n")
    
    print("Ejecutando setup_test_data.py...\n")
    
    # Ejecutar setup_test_data.py
    try:
        result = subprocess.run(
            [sys.executable, "scripts/setup_test_data.py"],
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        print(result.stdout)
        if result.stderr:
            print("Errores:", result.stderr)
    except Exception as e:
        print(f"Error ejecutando setup: {e}")
        print("\nEjécuta manualmente: python scripts/setup_test_data.py")
    
    print("\n" + "=" * 100)
    print("  LISTO!")
    print("=" * 100)
    print("\nAhora puedes ejecutar: npm run dev\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelado por el usuario")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
