-- Tabla de Transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed',
  provider VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Predicciones (IA)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  predicted_amount DECIMAL(10, 2) NOT NULL,
  actual_amount DECIMAL(10, 2),
  prediction_date TIMESTAMP DEFAULT NOW(),
  confidence_score DECIMAL(3, 2),
  month_year VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Servicios del Usuario
CREATE TABLE user_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  account_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  due_date INTEGER,
  last_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Alertas
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_user_services_user ON user_services(user_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);

-- RLS (Row Level Security) para Transacciones
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS para Predicciones
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS para Servicios del Usuario
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own services" ON user_services
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own services" ON user_services
  FOR ALL USING (auth.uid() = user_id);

-- RLS para Alertas
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);
