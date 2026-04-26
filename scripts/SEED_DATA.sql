-- Copia TODO este SQL a Supabase (reemplaza YOUR_USER_UUID con tu UUID)

INSERT INTO transactions (user_id, service_type, amount, transaction_date, status, provider, receipt_number)
VALUES 
  ('YOUR_USER_UUID', 'electricity', 120.00, NOW() - INTERVAL '25 days', 'completed', 'ENEL', 'ENEL-001'),
  ('YOUR_USER_UUID', 'water', 45.50, NOW() - INTERVAL '23 days', 'completed', 'SEDAPAL', 'SDPL-001'),
  ('YOUR_USER_UUID', 'gas', 65.75, NOW() - INTERVAL '20 days', 'completed', 'CALIDDA', 'CALD-001'),
  ('YOUR_USER_UUID', 'internet', 89.90, NOW() - INTERVAL '15 days', 'completed', 'CLARO', 'CLAR-001'),
  ('YOUR_USER_UUID', 'electricity', 125.50, NOW() - INTERVAL '10 days', 'completed', 'ENEL', 'ENEL-002');

INSERT INTO user_services (user_id, service_type, provider, account_number, status, due_date, last_amount)
VALUES
  ('YOUR_USER_UUID', 'electricity', 'ENEL', 'ENEL-12345-ABC', 'active', 25, 120.00),
  ('YOUR_USER_UUID', 'water', 'SEDAPAL', 'SEDAPAL-67890-DEF', 'active', 23, 45.50),
  ('YOUR_USER_UUID', 'gas', 'CALIDDA', 'CALIDDA-11111-GHI', 'active', 20, 65.75),
  ('YOUR_USER_UUID', 'internet', 'CLARO', 'CLARO-22222-JKL', 'active', 1, 89.90);

INSERT INTO predictions (user_id, service_type, predicted_amount, actual_amount, confidence_score, month_year)
VALUES
  ('YOUR_USER_UUID', 'electricity', 120.00, 120.00, 0.95, '2026-03'),
  ('YOUR_USER_UUID', 'water', 45.00, 45.50, 0.92, '2026-03'),
  ('YOUR_USER_UUID', 'gas', 68.00, 65.75, 0.88, '2026-03'),
  ('YOUR_USER_UUID', 'internet', 89.90, 89.90, 0.99, '2026-03');

INSERT INTO alerts (user_id, alert_type, title, message, is_read)
VALUES
  ('YOUR_USER_UUID', 'upcoming', 'Proximo Vencimiento', 'Tu factura de Internet vence el 01 de Abril', FALSE),
  ('YOUR_USER_UUID', 'increase', 'Aumento Detectado', 'El consumo de Electricidad aumento 5%', FALSE),
  ('YOUR_USER_UUID', 'savings', 'Oportunidad de Ahorro', 'Podrias ahorrar $50 este mes', FALSE);
