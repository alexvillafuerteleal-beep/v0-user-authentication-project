# 👨‍💻 MANUAL DE USO - NUEVAS CARACTERÍSTICAS

## 🎯 Acceso al Dashboard

### URL Principal
```
http://localhost:3000/dashboard
```

### Rutas Disponibles
```
Dashboard Principal:        /dashboard
Mis Pagos (Servicios):      /dashboard/servicios
Historial de Pagos:         /dashboard/historial
Análisis Comparativo:       /dashboard/comparativo  [NEW]
Soporte (Chat IA):          /dashboard/soporte
Mi Perfil:                  /dashboard/perfil
Configuración:              /dashboard/configuracion
Estados de Cuenta:          /dashboard/estados
```

---

## 📱 USO EN MÓVIL - Menu Hamburguesa

### Cómo Acceder
1. **En dispositivo móvil** (pantalla < 768px)
2. Verás un menu con **☰** (hamburguesa)
3. **Tap en el ícono** para abrir drawer
4. **Desliza desde la izquierda** para cerrar

### Elementos del Menu
```
☰ Menu           ← Abre/Cierra drawer
📊 Dashboard     ← Página principal
💧 Mis Pagos     ← Servicios a pagar
📋 Historial     ← Transacciones pasadas
📊 Comparativo   ← Análisis mes vs mes
🎧 Soporte       ← Chat con IA
👤 Mi Perfil     ← Información personal
⚙️ Configuración ← Ajustes y alertas
```

### Bottom Navigation (Fijo en Móvil)
```
┌──────────────────────────────────────┐
│ ☰ │ 📊 │ 💧 │ 📋 │ 🎧             │
│ Menu│Dash│Pagos│Historial│Soporte  │
└──────────────────────────────────────┘
```
- Taps rápidos para navegación
- El ícono activo se destaca
- Siempre visible para acceso rápido

---

## 💳 USAR MIS PAGOS (SERVICIOS)

### Ver Servicios
1. Ir a **💧 Mis Pagos**
2. Verás tarjetas de servicios con:
   - Nombre y empresa (ej: ENEL)
   - Monto en MXN
   - Fecha de vencimiento
   - Estado (✅ Pagada, ⚠️ Vencida, 🕐 Próxima)

### Editar un Servicio
1. Click en botón **"Editar"** (azul)
2. Se abre diálogo con campos:
   - Nombre empresa
   - Monto (en MXN)
   - Fecha vencimiento
3. Modifica los valores
4. Click **"Guardar"** (verde)
5. Verás toast: "✅ Servicio actualizado"

### Realizar Pago
1. Click en **"Pagar Ahora"** (naranja)
2. Te redirige a Stripe Checkout
3. Completa el pago (usar tarjeta de prueba)
4. Vuelve al dashboard con confirmación

**Tarjetas de Prueba Stripe:**
```
Visa exitoso:        4242 4242 4242 4242
Visa con 3D:         4000 0025 0000 3155
MasterCard exitoso:  5555 5555 5555 4444
Expiry:              12/25
CVC:                 123
```

---

## 📋 USAR HISTORIAL DE PAGOS

### Ver Transacciones
1. Ir a **📋 Historial**
2. Verás lista de transacciones pasadas
3. Cada fila muestra:
   - ID (ej: #1)
   - Servicio (ej: Electricidad)
   - Monto ($2,750 MXN)
   - Fecha (25/03/2026)
   - Estado (✅ Completado)
   - Método (Stripe, Transferencia)
   - Recibo (REC-001)

### Filtrar Transacciones

**Por Servicio:**
1. Click dropdown "Todos los servicios"
2. Selecciona: Electricidad, Agua, Gas o Internet
3. Tabla se actualiza automáticamente

**Por Fecha:**
1. Ingresa fecha en campo "DD/MM/YYYY"
2. Ejemplo: "25/03/2026"
3. Tabla filtra por esa fecha

**Limpiar Filtros:**
1. Click botón **"Limpiar"**
2. Se resetean todos los filtros

### KPIs de Resumen
```
📊 Transacciones:  X registros
💳 Monto Total:    $X,XXX MXN
📈 Promedio:       $X,XXX MXN
```

### Descargar en Excel (CSV)

1. **Filtra datos** (opcional)
2. Click **"Descargar Excel (.CSV)"** (azul)
3. Archivo se descarga: `historial-pagos-2026-03-30.csv`
4. Abre en Excel o Google Sheets
5. Puedes:
   - Editar datos
   - Crear gráficos
   - Compartir con otros

### Descargar en PDF

1. **Filtra datos** (opcional)
2. Click **"Descargar PDF (.PDF)"** (naranja)
3. Se abre ventana de Impresión
4. Verás vista previa con:
   - Título: "📊 Historial de Pagos - PagoIA"
   - Fecha de generación
   - Resumen (Total, Promedio)
   - Tabla de datos
   - Footer profesional

**Guardar como PDF:**
1. En ventana de impresión
2. Selecciona impresora: **"Guardar como PDF"**
3. Click **"Guardar"**
4. Elige ubicación
5. ¡Listo! Archivo guardado

---

## 📊 USAR ANÁLISIS COMPARATIVO (NEW)

### Qué Es
Compara tus gastos del mes **Marzo vs Febrero 2026**

### Secciones

**1. KPIs Principales:**
```
💵 Total Marzo 2026     $7,366 MXN
📅 Total Febrero 2026   $7,080 MXN  
📈 Cambio Total         +$286 MXN (+4.0%) ↑
```

**2. Promedio por Servicio:**
- Marzo: $1,841.50 (barra azul)
- Febrero: $1,770.00 (barra gris)
- Variación: +$71.50 (+4.0%)

**3. Insights (Recomendaciones):**
- 📊 Gastos aumentaron en +$286
- ⚡ Todos los 4 servicios activos
- 💡 Recomendación: Revisar consumo

**4. Comparativo por Servicio:**
```
Servicio       Febrero → Marzo   Cambio      Tendencia
─────────────────────────────────────────────────────
Electricidad   $2,650 → $2,750   +$100       +3.8% ↑
Agua           $980 → $1,040     +$60        +6.1% ↑
Gas            $1,450 → $1,507   +$57        +3.9% ↑
Internet       $2,000 → $2,062   +$62        +3.1% ↑
```

### Interpretar Tendencias
- **Verde ↓ Disminuyó:** Menos gasto
- **Rojo ↑ Aumentó:** Más gasto
- **%:** Porcentaje de cambio

---

## ⚙️ CONFIGURAR ALERTAS DE EMAIL

### Dónde Está
1. Ir a **⚙️ Configuración**
2. Scroll hasta **"📧 Alertas por Email - Vencimientos"**
3. Verás 3 opciones

### Opciones de Alertas

**1. ⏰ Recordatorio 7 días antes**
```
✅ Activo (por defecto)
Recibirás email 7 días antes del vencimiento
Ej: Si vence el 25, recibirás alerta el 18
```

**2. 📅 Recordatorio 3 días antes**
```
✅ Activo (por defecto)
Recibirás email 3 días antes del vencimiento
Ej: Si vence el 25, recibirás alerta el 22
```

**3. 🔔 Recordatorio el día del vencimiento**
```
✅ Activo (por defecto)
Recibirás email el día exacto del pago
Ej: Si vence el 25, recibirás alerta el 25
```

### Cómo Cambiar Alertas
1. Alterna los **toggles** (botones switch)
2. Verde = Activo
3. Gris = Desactivo
4. Scroll abajo y click **"Guardar cambios"**
5. Toast: "✅ Cambios guardados exitosamente"

### Status de Alertas
```
✅ Estado: Todas las alertas activas
Recibirás notificaciones en tu correo registrado
```

---

## 🎨 DASHBOARD PRINCIPAL - NUEVAS CARACTERÍSTICAS

### KPIs con Emojis
Cada métrica muestra:

```
💰 Total por Pagar
$7,366 MXN
+8% ↑ vs mes anterior

💚 Ahorro Estimado (IA)
$1,240 MXN
+16% ↑ vs mes anterior

⚡ Servicios Vinculados
4 servicios
+1 nuevo este mes

💵 Ingresos Estimados
$89,012 MXN
+15% ↑ vs mes anterior
```

### Resumen de Servicios
- Con emojis por tipo:
  - ⚡ Electricidad
  - 💧 Agua
  - 🔥 Gas
  - 📡 Internet
- Status color-coded:
  - ✅ Verde = Pagada
  - ⚠️ Rojo = Vencida
  - 🕐 Amarillo = Próxima

### Cartas de Estado
- 📊 Pronóstico de gastos (gráfico)
- ⏰ Próximos vencimientos (3 servicios)
- ✅ Estado del sistema (Conectado)

---

## 👤 MENU DE USUARIO (HEADER)

### Acceder al Menu
1. Click en tu **avatar** (arriba derecha)
2. Abre dropdown menu

### Opciones
```
👤 Juan Pérez          (Tu nombre)
juan@email.com         (Tu email)
─────────────────
👤 Perfil              ← Ver perfil personal
⚙️ Configuración       ← Ajustes
─────────────────
🚪 Cerrar Sesión       ← Logout
```

---

## 🔄 NAVEGACIÓN GENERAL

### Desktop (Pantalla Grande)
```
┌─────────────────────┬──────────────────────────┐
│ ☰ Sidebar           │ 📊 Dashboard Principal   │
│ PagoIA              │                          │
│                     │ [Content Area]           │
│ 📊 Dashboard        │                          │
│ 💧 Mis Pagos        │ [KPIs, Charts, Data]     │
│ 📋 Historial        │                          │
│ 📊 Comparativo      │                          │
│ 🎧 Soporte          │                          │
│                     │                          │
│ 👤 Mi Perfil        │ Footer (invisible)       │
│ ⚙️ Configuración    │                          │
└─────────────────────┴──────────────────────────┘
```

### Móvil (Pantalla Pequeña)
```
┌─────────────────────────────┐
│ [Pg] PagoIA         👤     │ ← Header
├─────────────────────────────┤
│                             │
│     Main Content            │
│     (apuntando a)           │
│                             │
│  [Scrolleable area]         │
│                             │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ☰ 📊 💧 📋 🎧             │ ← Bottom Nav
└─────────────────────────────┘
```

---

## ⌨️ ATAJOS Y TIPS

### Keyboard
- **Enter** en campos de filtro: Busca
- **Escape** en diálogos: Cierra
- **Ctrl+P** en PDF view: Imprime

### Mobile Tips
- Tap en bottom nav: Navegación rápida
- Desliza el drawer: Menú completo
- Pinch-to-zoom: Amplifica contenido

### Datos Útiles
- Todos los montos están en **MXN**
- Fechas en formato **DD/MM/YYYY**
- Status actualiza en tiempo real
- Cambios se guardan automáticamente

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Cómo recibir alertas de email?**
R: Ve a ⚙️ Configuración > Alertas por Email. Activa los toggles. Se enviarán a tu correo registrado.

**P: ¿Puedo descargar el historial en PDF?**
R: Sí. En 📋 Historial, click "Descargar PDF (.PDF)". Abre en impresión y selecciona "Guardar como PDF".

**P: ¿Funciona en móvil?**
R: Sí, completamente responsivo. Bottom nav + drawer menu optimizado para touch.

**P: ¿Dónde está el comparativo?**
R: En 📊 Comparativo (en el menú principal). Compara Marzo vs Febrero.

**P: ¿Las tarjetas de servicios se pueden editar?**
R: Sí. Click "Editar" en cada tarjeta. Modifica empresa, monto y vencimiento.

**P: ¿Qué datos son reales?**
R: Dashboard muestra datos de ejemplo. Próxima: Conectar con base de datos real.

---

## 🚀 PRÓXIMOS PASOS PARA TI

1. **Logo:** Cuando tengas la imagen, dime y la integro
2. **Email:** Configurar con SendGrid para que funcione realmente
3. **Datos:** Conectar con base de datos Supabase real
4. **Publicar:** Deploy a servidor de producción

---

## 📞 SOPORTE

Si encuentras bugs o tienes preguntas:
1. Abre 🎧 Soporte (chat IA)
2. O revisa la documentación en:
   - `TAREAS_COMPLETADAS_RESUMEN.md`
   - `GUIA_VISUAL_CAMBIOS.md`
   - `ESTADO_FINAL.md`

---

**¡Listo para usar! 🎉**

*Versión: 2.5 | Última actualización: 30 Marzo 2026*
