# PagoIA 2.0: puesta en marcha

Esta guía explica cómo activar lo que se agregó en la rama `mejora/pagoia-2`. Todo compila y funciona sin configuración extra. Cada función nueva se activa cuando existe su tabla o su llave; mientras tanto, la app se comporta como antes.

## 1. Aplicar las migraciones en Supabase

Corre estos archivos en orden en el **SQL Editor** de Supabase (o con `supabase db push`). Todos se pueden correr más de una vez.

| Archivo | Qué agrega | Activa |
|---|---|---|
| `supabase/migrations/20260926_asistente_ia.sql` | `ai_conversations`, `ai_messages`, `ai_usage` | Historial y tope diario del asistente |
| `supabase/migrations/20260927_recibos.sql` | `receipts`, el bucket privado `receipts` y `pending_payments` (si no existe) | Escaneo de recibos |
| `supabase/migrations/20260928_presupuestos_recordatorios.sql` | `budgets`, `reminders`, columnas nuevas en `predictions` y `alerts` | Presupuestos, recordatorios y el cron diario |
| `supabase/migrations/20260929_hogar_compartido.sql` | `households`, `household_members`, `household_invites`, `bill_splits` y 3 funciones | Hogar compartido |
| `supabase/migrations/20260930_whatsapp_pagos_automaticos.sql` | canal `whatsapp` en `reminders`, `payment_profiles`, `scheduled_payments`, `autopay_runs` | WhatsApp y pagos automáticos |

Tu base actual no tiene `pending_payments` ni algunas columnas de `20260430_complete_schema.sql`, como `transactions.metadata` o `user_services.auto_pay`. El código nuevo no usa esas columnas, y `pending_payments` se crea con la migración de recibos.

## 2. Variables de entorno

Agrégalas en `.env.local` y en Vercel (Project Settings → Environment Variables). La lista completa está en `.env.example`.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Para IA | Asistente y escaneo de recibos. Sin ella, el chat usa el bot por palabras clave y el escaneo se desactiva. |
| `STRIPE_PAYMENT_METHODS` | No | `card` (por defecto) o `card,oxxo`. OXXO solo funciona con una cuenta de Stripe registrada en México. |
| `CRON_SECRET` | Para el cron | Protege `/api/cron/daily`. Ya existe en tu `.env.local`; agrégala también en Vercel. |
| `RESEND_API_KEY`, `EMAIL_FROM` | No | Recordatorios por correo. Sin ellas, los recordatorios salen solo como notificación push. |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | No | Recordatorios por WhatsApp. Sin ellas, la opción no aparece. Ver la sección 4. |
| `WHATSAPP_TEMPLATE`, `WHATSAPP_TEMPLATE_LANG` | No | Nombre e idioma de la plantilla aprobada (por defecto `recordatorio_pago` y `es_MX`). |
| `AUTOPAY_ALLOW_LIVE` | No | Déjala en `false`. Con llaves reales de Stripe, los cobros automáticos solo corren si vale `true`. |

## 3. Stripe

Si activas OXXO, el webhook debe recibir también `checkout.session.async_payment_succeeded` y `checkout.session.async_payment_failed`. El script `npm run stripe:webhook:create` ya los incluye. Si el webhook ya existe, agrégalos desde el Dashboard de Stripe → Developers → Webhooks.

Los pagos automáticos no necesitan eventos nuevos: la tarjeta se guarda con `checkout.session.completed`, que ya está configurado.

## 4. WhatsApp

WhatsApp solo permite que una empresa inicie la conversación con una plantilla aprobada por Meta.

1. En [Meta for Developers](https://developers.facebook.com/), crea una app de tipo Business y agrega el producto WhatsApp.
2. Copia el **Phone number ID** y genera un token permanente con un usuario del sistema. Van en `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_TOKEN`.
3. Crea la plantilla `recordatorio_pago` (categoría Utilidad, idioma Español de México) con tres variables. Por ejemplo:
   > Hola, tu recibo de {{1}} vence {{2}}. Monto aproximado: {{3}}. Págalo desde PagoIA.
4. Mientras la cuenta no esté verificada, Meta solo entrega mensajes a los números de prueba que registres.

El usuario activa WhatsApp por servicio en **Calendario → Recordatorios**, y necesita un celular de 10 dígitos en su perfil. El cron manda la plantilla con el servicio, la fecha y el monto.

## 5. Pagos automáticos

En **Pagos automáticos** (`/dashboard/programados`), el usuario guarda una tarjeta con Stripe Checkout en modo `setup`. Stripe la guarda sin cobrar nada, y PagoIA solo conoce la marca y los últimos 4 dígitos. Luego, para cada servicio, activa el pago automático, fija un tope y elige cuántos días antes cobrar.

- **Qué cobra el cron:** un recibo pendiente de `pending_payments` (se crea al confirmar un recibo escaneado), cuando está dentro de esos días y no pasa del tope. Si pasa del tope, avisa y no cobra.
- **Ningún recibo se cobra dos veces:** antes de cobrar, el cron registra el intento en `autopay_runs`, donde `pending_payment_id` es único, y el cargo usa una llave de idempotencia.
- **Si el banco rechaza el cargo** o pide autenticación, el usuario recibe una alerta para pagar a mano.
- **Con llaves reales (`sk_live_`), los cobros están apagados** mientras `AUTOPAY_ALLOW_LIVE` no valga `true`. PagoIA cobra, pero no le paga a CFE ni a TELMEX, así que un cobro real se quedaría con el dinero sin pagar el recibo.

Para probarlo en modo de prueba:

1. Guarda la tarjeta `4242 4242 4242 4242`.
2. Escanea y confirma un recibo con fecha límite cercana.
3. Corre el cron a mano (sección 6).

Para probar un cargo rechazado, usa la tarjeta `4000 0000 0000 0341`.

## 6. Tarea diaria

`vercel.json` programa `/api/cron/daily` a las 14:00 UTC (8:00 en la Ciudad de México). En el plan Hobby de Vercel, los cron corren como máximo una vez al día. Cada corrida:

1. guarda el pronóstico del siguiente periodo de cada servicio y registra el monto real en las predicciones pasadas;
2. avisa si el recibo del periodo actual salió fuera de lo normal;
3. avisa al llegar al porcentaje de alerta de cada presupuesto;
4. envía los recordatorios de vencimiento por push, correo y WhatsApp;
5. cobra los pagos automáticos que tocan ese día;
6. borra las imágenes de recibos confirmados hace más de 30 días.

Para probarla a mano:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<tu-dominio>/api/cron/daily
```

## 7. Pruebas

```bash
npm test                     # 50 pruebas unitarias: pronóstico, recibos, división de pagos, pagos automáticos, teléfonos y asistente
npx dotenv -e .env.local -- playwright test e2e/rls-aislamiento.spec.ts --project=chromium
```

La prueba de aislamiento necesita dos cuentas de prueba (`E2E_USER_A_*` y `E2E_USER_B_*`). Verifica que ninguna cuenta pueda leer los datos de la otra en las 13 tablas personales, en los archivos de recibos ni en los hogares. Solo lee datos; no modifica nada.

## 8. Video explicativo

El video de 50 s está en `public/video/pagoia-explicativo.mp4` y aparece en la landing, en la sección "Mira cómo funciona". Es una composición HTML con GSAP (`video/explicativo/index.html`) que sigue en seis escenas el guion del plan: el problema, el panel, el escaneo, el pronóstico, el pago y el cierre. Trae subtítulos porque en la web se reproduce sin sonido.

Para cambiar textos o montos, edita el HTML y vuelve a renderizar. Necesitas un ffmpeg con libx264; `ffmpeg-static` trae uno:

```bash
npm i -D ffmpeg-static
FFMPEG_PATH="$(node -p 'require("ffmpeg-static")')" node scripts/render-video.mjs
```

Para ver la composición en tiempo real, abre `video/explicativo/index.html?play` en el navegador. Si quieres voz en off, graba la columna "Voz en off" del guion y únela al MP4 en cualquier editor; los tiempos coinciden.

## 9. Cómo funciona cada parte

- **Asistente** (`app/api/ai/chat`, `lib/ai/assistant.ts`):
  - Usa `claude-opus-5` con streaming y cinco herramientas de solo lectura.
  - Las herramientas consultan con la sesión del usuario, así que RLS limita lo que el modelo puede leer.
  - `navegar` solo abre pantallas de una lista cerrada.
  - Está activado el respaldo del servidor ante rechazos del modelo (`fallbacks: "default"`).
- **Recibos** (`app/api/receipts`, `lib/ai/receipt.ts`): Claude extrae los campos con un esquema JSON validado con zod. Del número de servicio solo se guardan los últimos 4 dígitos. Nada se paga hasta que el usuario confirma.
- **Pronóstico** (`lib/forecast.ts`):
  - Calcula un promedio ponderado de los últimos 3 periodos (50/30/20) con ajuste estacional, y un intervalo de ±1.5 desviaciones estándar del error histórico.
  - CFE se pronostica por bimestre.
  - `/api/reports/predictions` también reporta el MAPE de las predicciones ya cerradas, un dato útil para el informe de la residencia.
- **WhatsApp** (`lib/notifications/whatsapp.ts`): convierte el celular a `52` más 10 dígitos (acepta `+52`, `521`, espacios y guiones) y manda la plantilla con la Cloud API de Meta.
- **Pagos automáticos** (`lib/autopay.ts`, `lib/payments/autopay-stripe.ts`): la decisión de qué cobrar es una función pura con pruebas. Los cargos se hacen con `off_session: true` sobre la tarjeta guardada.
- **Hogar compartido** (`app/api/households`): la invitación es un código de 8 caracteres que vence en 7 días. Los montos se reparten en centavos, así que las partes siempre suman el total.

## 10. Pendientes conocidos

- **Pagos reales:** PagoIA cobra con Stripe, pero no le paga a CFE ni a TELMEX. Mantén Stripe en modo de prueba y descríbelo como prototipo.
- **Voz en off del video:** el MP4 no tiene audio; los subtítulos cubren el guion.
- **WhatsApp:** faltan la verificación de Meta y la aprobación de la plantilla, que dependen de tu cuenta.
- **Datos de prueba duplicados:** la cuenta `test@pago-ia.local` tiene 15 servicios repetidos. Para limpiarla, corre `node scripts/limpiar-duplicados-prueba.mjs test@pago-ia.local`. Sin `--apply` solo muestra los repetidos; con `--apply` guarda un respaldo en `scripts/respaldos/` y los borra.
