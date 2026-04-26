# Setup Final en Vercel - Guía Paso a Paso

## 🎯 Objetivo
Configurar todas las variables de entorno en Vercel para que el sitio público funcione correctamente con Supabase, Stripe y Push Notifications.

## 📋 Variables a Configurar

Copia cada valor desde tu archivo `.env.local` local (no compartas estas claves):

```
NEXT_PUBLIC_SUPABASE_URL=<ver .env.local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ver .env.local>
SUPABASE_SERVICE_ROLE_KEY=<ver .env.local>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<ver .env.local>
VAPID_PRIVATE_KEY=<ver .env.local>
VAPID_SUBJECT=<ver .env.local>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<ver .env.local>
STRIPE_SECRET_KEY=<ver .env.local>
STRIPE_WEBHOOK_SECRET=<ver .env.local>
INTERNAL_API_TOKEN=<ver .env.local>
CRON_SECRET=<ver .env.local>
NEXT_PUBLIC_APP_URL=https://v0-user-authentication-project-kcb8.vercel.app
```

## 🔧 Pasos en Vercel

### Paso 1: Acceder a Vercel
1. Ve a https://vercel.com/dashboard
2. Haz click en tu proyecto: `v0-user-authentication-project-kcb8`

### Paso 2: Ir a Settings → Environment Variables
1. En el menú arriba, haz click en **Settings**
2. En el sidebar izquierdo, haz click en **Environment Variables**

### Paso 3: Agregar cada variable
Para cada variable de arriba:
1. Haz click en **Add New**
2. En **Name**, pega el nombre (ej: `NEXT_PUBLIC_SUPABASE_URL`)
3. En **Value**, pega el valor exacto
4. En **Environment**, selecciona: ✅ Production, ✅ Preview, ✅ Development
5. Haz click en **Save**

**Repite esto para todas las 10 variables.**

### Paso 4: Verificar que están todas
Deberías ver estas 10 variables en la lista:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY
- ✅ VAPID_PRIVATE_KEY
- ✅ VAPID_SUBJECT
- ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ INTERNAL_API_TOKEN
- ✅ CRON_SECRET

## 🚀 Paso 5: Triggear el Redeploy

**Opción A: Auto (Recomendado)**
1. Ve a **Deployments** (arriba del menú)
2. Busca el deployment más reciente
3. Haz click en los 3 puntos `...`
4. Elige **Redeploy**

**Opción B: Por Git (Si tienes GitHub conectado)**
1. Haz un commit vacío y push:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## ✅ Paso 6: Validar el Deploy

### Espera a que Vercel termine
- Ve a **Deployments**
- Espera a que el status sea **Ready** (tomará 1-2 min)
- El color debe cambiar de amarillo a verde

### Valida la raíz pública
1. Abre tu dominio: https://v0-user-authentication-project-kcb8.vercel.app/
2. Deberías ver la landing page (sin errores)
3. Intenta hacer logout si estabas autenticado

### Valida el API de Stripe webhook
1. Abre: https://v0-user-authentication-project-kcb8.vercel.app/api/stripe/webhook
2. Debería responder con error 405 (Method Not Allowed) porque GET no está permitido
3. Si ves error 503, significa que las variables Stripe o Supabase no llegaron

### Valida push notifications
1. Ve a https://v0-user-authentication-project-kcb8.vercel.app/auth/login
2. Abre DevTools (F12)
3. En Console, no debería haber errores sobre VAPID

## 🐛 Si algo falla

### El sitio sigue mostrando 500
- Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY sean **exactas**
- Espera 2-3 minutos después de guardar variables (Sometimes Vercel takes time)
- Haz un Redeploy manual

### El webhook dice 503
- Verifica que STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET estén presentes
- Verifica que SUPABASE_SERVICE_ROLE_KEY esté presente

### Los botones de auth no funcionan
- Verifica que NEXT_PUBLIC_SUPABASE_URL sea la URL exacta (con https://)
- No debe haber espacios extras

## ✨ Listo
Una vez que todo valide correctamente, ¡el proyecto está listo para producción!

- Landing page funcional ✅
- Auth con Supabase operativo ✅
- Stripe webhook receptivo ✅
- Push notifications configuradas ✅
