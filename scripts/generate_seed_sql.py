#!/usr/bin/env python3
"""
Script para generar y mostrar el SQL de datos de prueba
Este SQL debe ser ejecutado en Supabase SQL Editor
"""

import sys
from pathlib import Path

def main():
    print("🚀 Generador de SQL de Datos de Prueba\n")
    print("=" * 80)
    print("⚠️  IMPORTANTE: Los datos de prueba requieren que primero registres un usuario")
    print("=" * 80)
    print()
    
    print("📋 PASO 1: Crear usuario de prueba")
    print("-" * 80)
    print("1. Ve a: https://app.supabase.com/project/wweoeziquaofporasczt/auth/users")
    print("2. Click en 'Add user' (botón arriba a la derecha)")
    print("3. Ingresa:")
    print("   - Email: test@pago-ia.local")
    print("   - Password: Test123456!")
    print("4. Copia el UUID que aparece en la lista")
    print("5. Guárdalo, lo necesitarás en el siguiente paso")
    print()
    
    print("📋 PASO 2: Ejecutar SQL en Supabase")
    print("-" * 80)
    print("1. Ve a: https://app.supabase.com/project/wweoeziquaofporasczt/sql/new")
    print("2. Copia TODO este SQL:")
    print()
    print("=" * 80)
    
    # SQL con marcador de reemplazo
    sql_template = """-- 🔔 REEMPLAZA 'YOUR_USER_UUID' con el UUID de tu usuario (sin comillas simples extras)
-- Ejemplo: 550e8400-e29b-41d4-a716-446655440000

-- Insertar transacciones de prueba
INSERT INTO transactions (user_id, service_type, amount, transaction_date, status, provider, receipt_number)
VALUES 
  ('YOUR_USER_UUID', 'electricity', 120.00, NOW() - INTERVAL '25 days', 'completed', 'ENEL', 'ENEL-001'),
  ('YOUR_USER_UUID', 'water', 45.50, NOW() - INTERVAL '23 days', 'completed', 'SEDAPAL', 'SDPL-001'),
  ('YOUR_USER_UUID', 'gas', 65.75, NOW() - INTERVAL '20 days', 'completed', 'CALIDDA', 'CALD-001'),
  ('YOUR_USER_UUID', 'internet', 89.90, NOW() - INTERVAL '15 days', 'completed', 'CLARO', 'CLAR-001'),
  ('YOUR_USER_UUID', 'electricity', 125.50, NOW() - INTERVAL '10 days', 'completed', 'ENEL', 'ENEL-002');

-- Insertar servicios del usuario
INSERT INTO user_services (user_id, service_type, provider, account_number, status, due_date, last_amount)
VALUES
  ('YOUR_USER_UUID', 'electricity', 'ENEL', 'ENEL-12345-ABC', 'active', 25, 120.00),
  ('YOUR_USER_UUID', 'water', 'SEDAPAL', 'SEDAPAL-67890-DEF', 'active', 23, 45.50),
  ('YOUR_USER_UUID', 'gas', 'CALIDDA', 'CALIDDA-11111-GHI', 'active', 20, 65.75),
  ('YOUR_USER_UUID', 'internet', 'CLARO', 'CLARO-22222-JKL', 'active', 1, 89.90);

-- Insertar predicciones IA
INSERT INTO predictions (user_id, service_type, predicted_amount, actual_amount, confidence_score, month_year)
VALUES
  ('YOUR_USER_UUID', 'electricity', 120.00, 120.00, 0.95, '2026-03'),
  ('YOUR_USER_UUID', 'water', 45.00, 45.50, 0.92, '2026-03'),
  ('YOUR_USER_UUID', 'gas', 68.00, 65.75, 0.88, '2026-03'),
  ('YOUR_USER_UUID', 'internet', 89.90, 89.90, 0.99, '2026-03');

-- Insertar alertas
INSERT INTO alerts (user_id, alert_type, title, message, is_read)
VALUES
  ('YOUR_USER_UUID', 'upcoming', 'Próximo Vencimiento', 'Tu factura de Internet vence el 01 de Abril', FALSE),
  ('YOUR_USER_UUID', 'increase', 'Aumento Detectado', 'El consumo de Electricidad aumentó 5%', FALSE),
  ('YOUR_USER_UUID', 'savings', 'Oportunidad de Ahorro', 'Podrías ahorrar $50 este mes', FALSE);"""
    
    print(sql_template)
    
    print()
    print("=" * 80)
    print()
    print("3. IMPORTANTE:")
    print("   - Reemplaza 'YOUR_USER_UUID' con tu UUID real (p.ej.: 550e8400-e29b-41d4-a716-446655440000)")
    print("   - NO dejes las comillas simples alrededor del UUID")
    print("   - Usa Ctrl+H (Find & Replace) para reemplazar rápidamente")
    print()
    print("4. Click en RUN (botón verde)")
    print("5. Verifica que las inserciones se completaron")
    print()
    
    print("✨ Una vez completado:")
    print("   $ npm run dev")
    print("   Abre: http://localhost:3000/dashboard")
    print()

if __name__ == "__main__":
    main()
