# PagoIA 2.0: puesta en marcha

Esta guía explica cómo activar lo que se agregó en la rama `mejora/pagoia-2`. Todo compila y funciona sin configuración extra. Cada función nueva se activa cuando existe su tabla o su llave; mientras tanto, la app se comporta como antes.

## 1. Aplicar las migraciones en Supabase

Corre estos archivos en orden en el **SQL Editor** de Supabase (o con `supabase db push`). Todos se pueden correr más de una vez.

| Archivo | Qué agrega | Activa |
|---|---|---|
| `supabase/migrations/20260926_asistente_ia.sql` | `ai_conversations`, `ai_messages`, `ai_usage` | Historial y tope diario del asistente |
| `supabase/migrations/20260927_recibos.sql` | `receipts` y el bucket privado `receipts` | Escaneo de recibos |
| `supabase/migrations/20260928_presupuestos_recordatorios.sql` | `budgets`, `reminders`, columnas nuevas en `predictions` y `alerts` | Presupuestos, recordatorios y el cron diario |
| `supabase/migrations/20260929_hogar_compartido.sql` | `households`, `household_members`, `household_invites`, `bill_splits` y 3 funciones | Hogar compartido |

## 2. Variables de entorno

Agrégalas en `.env.local` y en Vercel (Project Settings → Environment Variables). La lista completa está en `.env.example`.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Para IA | Asistente y escaneo de recibos. Sin ella, el chat usa el bot por palabras clave y el escaneo se desactiva. |
| `STRIPE_PAYMENT_METHODS` | No | `card` (por defecto) o `card,oxxo`. OXXO solo funciona con una cuenta de Stripe registrada en México. |
| `CRON_SECRET` | Para el cron | Protege `/api/cron/daily`. Ya existe en tu `.env.local`; agrégala también en Vercel. |
| `RESEND_API_KEY`, `EMAIL_FROM` | No | Recordatorios por correo. Sin ellas, los recordatorios salen solo como notificación push. |

## 3. Stripe

Si activas OXXO, el webhook debe recibir también `checkout.session.async_payment_succeeded` y `checkout.session.async_payment_failed`. El script `npm run stripe:webhook:create` ya los incluye. Si el webhook ya existe, agrégalos desde el Dashboard de Stripe → Developers → Webhooks.

## 4. Tarea diaria

`vercel.json` programa `/api/cron/daily` a las 14:00 UTC (8:00 en la Ciudad de México). En el plan Hobby de Vercel, los cron corren como máximo una vez al día. Cada corrida:

1. guarda el pronóstico del siguiente periodo de cada servicio y registra el monto real en las predicciones pasadas;
2. avisa si el recibo del periodo actual salió fuera de lo normal;
3. avisa al llegar al porcentaje de alerta de cada presupuesto;
4. envía los recordatorios de vencimiento por push y por correo;
5. borra las imágenes de recibos confirmados hace más de 30 días.

Para probarla a mano:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<tu-dominio>/api/cron/daily
```

## 5. Pruebas

```bash
npm test                     # 37 pruebas unitarias: pronóstico, recibos, división de pagos y herramientas del asistente
npx dotenv -e .env.local -- playwright test e2e/rls-aislamiento.spec.ts --project=chromium
```

La prueba de aislamiento necesita dos cuentas de prueba (`E2E_USER_A_*` y `E2E_USER_B_*`). Verifica que ninguna pueda leer los datos de la otra en las 10 tablas personales, en los archivos de recibos y en los hogares. Solo lee datos; no modifica nada.

## 6. Cómo funciona cada parte

- **Asistente** (`app/api/ai/chat`, `lib/ai/assistant.ts`): usa `claude-opus-5` con streaming y cinco herramientas de solo lectura. Las herramientas consultan con la sesión del usuario, así que RLS limita lo que el modelo puede leer. `navegar` solo abre pantallas de una lista cerrada. El respaldo del servidor ante rechazos del modelo (`fallbacks: "default"`) está activado.
- **Recibos** (`app/api/receipts`, `lib/ai/receipt.ts`): Claude extrae los campos con un esquema JSON validado con zod. Del número de servicio solo se guardan los últimos 4 dígitos. Nada se paga hasta que el usuario confirma.
- **Pronóstico** (`lib/forecast.ts`): promedio ponderado de los últimos 3 periodos (50/30/20) con ajuste estacional e intervalo de ±1.5 desviaciones estándar del error histórico. CFE se pronostica por bimestre. `/api/reports/predictions` también reporta el MAPE de las predicciones ya cerradas, un dato útil para el informe de la residencia.
- **Hogar compartido** (`app/api/households`): la invitación es un código de 8 caracteres que vence en 7 días. Los montos se reparten en centavos, así que las partes siempre suman el total.

## 7. Pendientes conocidos

- **Pagos reales:** PagoIA cobra con Stripe, pero no le paga a CFE ni a TELMEX. Mantén Stripe en modo de prueba y descríbelo como prototipo.
- **Video explicativo de 50 s:** el guion está en el plan. El hero usa un loop vectorial (`components/landing/receipt-loop.tsx`) en lugar de un video.
- **Recordatorios por WhatsApp y pagos programados:** quedaron fuera del alcance.
- **Datos de prueba duplicados:** la cuenta `test@pago-ia.local` tiene servicios repetidos. El calendario los agrupa y muestra "×n".
