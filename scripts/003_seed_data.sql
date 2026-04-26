-- Script de Datos de Prueba para PagoIA
-- Ejecutar DESPUÉS de ejecutar 002_create_tables.sql

-- Insertar un usuario de prueba (usando email conocido para test)
-- En Supabase, primero necesitas crear el usuario a través de Auth

-- Insertar transacciones de prueba
INSERT INTO transactions (user_id, service_type, amount, transaction_date, status, provider, receipt_number)
VALUES 
  -- Reemplazar 'your-user-uuid-here' con un UUID real
  ('00000000-0000-0000-0000-000000000000', 'electricity', 120.00, NOW() - INTERVAL '25 days', 'completed', 'ENEL', 'ENEL-001-25MAR'),
  ('00000000-0000-0000-0000-000000000000', 'water', 45.50, NOW() - INTERVAL '23 days', 'completed', 'SEDAPAL', 'SDPL-001-23MAR'),
  ('00000000-0000-0000-0000-000000000000', 'gas', 65.75, NOW() - INTERVAL '20 days', 'completed', 'CALIDDA', 'CALD-001-20MAR'),
  ('00000000-0000-0000-0000-000000000000', 'internet', 89.90, NOW() - INTERVAL '15 days', 'completed', 'CLARO', 'CLAR-001-15MAR'),
  ('00000000-0000-0000-0000-000000000000', 'electricity', 125.50, NOW() - INTERVAL '10 days', 'completed', 'ENEL', 'ENEL-002-10MAR');

-- Insertar predicciones de IA
INSERT INTO predictions (user_id, service_type, predicted_amount, actual_amount, confidence_score, month_year)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'electricity', 120.00, 120.00, 0.95, '2026-03'),
  ('00000000-0000-0000-0000-000000000000', 'water', 45.00, 45.50, 0.92, '2026-03'),
  ('00000000-0000-0000-0000-000000000000', 'gas', 68.00, 65.75, 0.88, '2026-03'),
  ('00000000-0000-0000-0000-000000000000', 'internet', 89.90, 89.90, 0.99, '2026-03');

-- Insertar servicios vinculados del usuario
INSERT INTO user_services (user_id, service_type, provider, account_number, status, due_date, last_amount)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'electricity', 'ENEL', 'ENEL-12345-ABC', 'active', 25, 120.00),
  ('00000000-0000-0000-0000-000000000000', 'water', 'SEDAPAL', 'SEDAPAL-67890-DEF', 'active', 23, 45.50),
  ('00000000-0000-0000-0000-000000000000', 'gas', 'CALIDDA', 'CALIDDA-11111-GHI', 'active', 20, 65.75),
  ('00000000-0000-0000-0000-000000000000', 'internet', 'CLARO', 'CLARO-22222-JKL', 'active', 1, 89.90);

-- Insertar alertas de prueba
INSERT INTO alerts (user_id, alert_type, title, message, is_read)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'upcoming', 'Próximo Vencimiento', 'Tu factura de Internet vence el 01 de Abril', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'increase', 'Aumento Detectado', 'El consumo de Electricidad aumentó 5% respecto al mes anterior', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'savings', 'Oportunidad de Ahorro', 'Según nuestro análisis, podrías ahorrar $50 este mes', FALSE);

-- Mensajes informativos
-- Nota: Reemplaza '00000000-0000-0000-0000-000000000000' con el UUID real de tu usuario
-- Puedes obtenerlo desde Supabase > Authentication > Users > copiar el ID
