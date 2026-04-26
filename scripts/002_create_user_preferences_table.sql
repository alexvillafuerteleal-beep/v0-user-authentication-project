-- Crear tabla user_preferences para guardar preferencias del usuario
-- Esta tabla está conectada al servicio getUserPreferences() y updateUserPreferences()

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Notificaciones
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  alert_notifications BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT true,
  
  -- Privacidad
  profile_public BOOLEAN DEFAULT false,
  share_data BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT true,
  
  -- Apariencia
  theme VARCHAR(20) DEFAULT 'dark',
  zoom VARCHAR(20) DEFAULT 'normal',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus propias preferencias
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar solo sus propias preferencias
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar solo sus propias preferencias
CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Crear índice para mejor performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
