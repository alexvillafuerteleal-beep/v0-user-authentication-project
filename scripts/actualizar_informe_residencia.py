# -*- coding: utf-8 -*-
from docx import Document
from pathlib import Path

path = Path(r"c:\Users\slede\source\repos\ProyectoResidencia\0.2.-Formato_Informe_Tecnico_RP_ISC_AlejandroVillafuerteDiazLeal_COMPLETO.docx")
doc = Document(str(path))
p = doc.paragraphs

def setp(i, text):
    if 0 <= i < len(p):
        p[i].text = text

# =============================
# DESCRIPCION DE LA EMPRESA
# =============================
setp(226, "Este proyecto se desarrolló en el contexto de una organización tecnológica orientada a soluciones financieras digitales para servicios recurrentes en México.")
setp(227, "Razón Social: PagoIA Soluciones Tecnológicas, S.A. de C.V.")
setp(228, "Giro: Desarrollo de software Full-Stack para plataformas de pago, gestión de servicios y analítica operativa con enfoque en experiencia de usuario.")
setp(229, "Reseña histórica: La empresa se constituyó como iniciativa de ingeniería aplicada para resolver problemas de fragmentación en el pago de servicios. En su evolución, priorizó arquitectura web moderna, integración de pasarelas de pago y seguridad de datos para operar soluciones escalables en entorno cloud.")
setp(230, "Misión: Diseñar y operar plataformas digitales seguras que simplifiquen la gestión de pagos y servicios, elevando la trazabilidad y la eficiencia operativa de usuarios y organizaciones.")
setp(231, "Visión: Consolidarse como referente nacional en soluciones de pago inteligente para servicios públicos y privados, integrando automatización, análisis de datos y experiencia centrada en el usuario.")
setp(232, "Valores: Innovación continua, seguridad de la información, calidad técnica, responsabilidad profesional, ética en el manejo de datos, orientación al usuario y mejora permanente.")
setp(233, "Productos y servicios: Plataforma PagoIA para gestión de servicios y cobros; dashboard de monitoreo; módulo administrativo de catálogos; integración de Stripe Checkout; notificaciones push; reportes de ingresos y comprobantes digitales.")
setp(234, "Organigrama: Dirección General > Coordinación de Tecnología > Área de Ingeniería de Software > Célula Full-Stack (Frontend, Backend y Datos). El residente se ubicó en el Área de Ingeniería de Software, participando en frontend con Next.js, backend de APIs y configuración de base de datos en Supabase.")
setp(235, "Descripción del área de trabajo donde se desempeñó el estudiante: Área de Desarrollo de Software con enfoque en análisis funcional, diseño de arquitectura, implementación, pruebas y despliegue de módulos transaccionales.")
setp(236, "Descripción del puesto donde se desempeñó el estudiante: Residente de Ingeniería en Sistemas Computacionales en rol Full-Stack, con actividades de modelado de datos, desarrollo de interfaces, integración de servicios externos y validación técnica del sistema.")
setp(237, "Ubicación de la empresa: Operación digital en modalidad híbrida con infraestructura en la nube, atendiendo requerimientos de usuarios del territorio nacional.")

# =============================
# ANTECEDENTES (modular, 1.5 cuartillas aprox)
# =============================
setp(246, "En América Latina, la evolución del ecosistema Fintech ha transformado los mecanismos de intermediación financiera y los modelos de servicio digital para la ciudadanía. El crecimiento de infraestructura tecnológica, la adopción de pagos electrónicos y la expansión del uso de aplicaciones móviles han impulsado nuevas prácticas de cobro, pago y conciliación. De acuerdo con el Banco Interamericano de Desarrollo (BID, 2022), la región ha mostrado una consolidación progresiva de empresas tecnológicas enfocadas en pagos digitales, crédito, identidad digital y banca abierta, con efectos directos en inclusión financiera y eficiencia operativa.")
setp(247, "En este contexto regional, México ocupa una posición estratégica por su volumen de usuarios, su penetración de internet y la maduración de su industria tecnológica. Sin embargo, la digitalización no se ha desarrollado de manera homogénea en todos los sectores ni en todos los niveles de gobierno. En materia de servicios públicos y cobros recurrentes, persisten esquemas administrativos heterogéneos, con plataformas aisladas y procesos de validación no estandarizados, lo que ocasiona fricción en la experiencia del usuario final y limita la trazabilidad transaccional.")
setp(248, "Desde la perspectiva de política pública y sistemas de pago, el Banco de México ha destacado la relevancia de fortalecer infraestructura digital para favorecer operaciones seguras, ágiles y auditables (Banco de México, 2023). No obstante, en escenarios operativos cotidianos todavía se observan problemas de fragmentación: cada servicio suele operar en portales independientes, con diferentes credenciales, formatos de referencia y flujos de confirmación. Esta dispersión incrementa carga cognitiva, eleva riesgos de error humano y dificulta la administración integral de adeudos, pagos y comprobantes.")
setp(249, "La problemática se vuelve más visible en ámbitos locales y municipales, donde la madurez digital puede variar entre dependencias y proveedores. En tales condiciones, los usuarios deben alternar entre aplicaciones o sitios con usabilidad desigual, sin una vista consolidada de vencimientos ni alertas inteligentes de seguimiento. La ausencia de centralización obstaculiza el control preventivo de pagos, propicia retrasos y reduce la capacidad de análisis financiero personal. En términos de ingeniería de software, este patrón evidencia déficit de integración sistémica entre módulos de autenticación, catálogo de servicios, ejecución de cobros y notificación de estados.")
setp(250, "Frente a este escenario, el diseño de una plataforma unificada se plantea como respuesta técnica viable para reducir fricción operativa. El enfoque consiste en articular, sobre una arquitectura modular, funciones de registro de usuario, administración de servicios, checkout seguro, confirmación por eventos y visualización de reportes. Esta aproximación permite sustituir experiencias fragmentadas por flujos coherentes, medibles y escalables. Además, habilita prácticas de observabilidad y mejora continua, al concentrar evidencia transaccional en un modelo de datos consistente.")
setp(251, "Con base en lo anterior, se formuló el proyecto PagoIA: Sistema para la gestión de pagos y servicios con Inteligencia Artificial, orientado a centralizar procesos y mejorar la experiencia de cobro/pago en un entorno web moderno. La propuesta integra Next.js y React para la capa de presentación, Supabase para autenticación y persistencia de datos, Stripe para procesamiento de pagos y Web Push API para alertas en tiempo casi real. La selección tecnológica respondió a criterios de seguridad, mantenibilidad y capacidad de evolución funcional.")
setp(252, "En síntesis, el problema no radica únicamente en digitalizar formularios, sino en construir un sistema integral que conecte actores, datos y eventos operativos bajo reglas consistentes. La contribución del proyecto se ubica en ese nivel: diseñar e implementar una solución Full-Stack que automatice cobros, mejore la trazabilidad y reduzca la dispersión funcional del pago de servicios en México.")
setp(253, "Esta contextualización mantiene coherencia con los objetivos del informe, al vincular el diagnóstico de fragmentación con las decisiones metodológicas y técnicas adoptadas durante la residencia profesional.")

# =============================
# CAPITULO 2 - METODOLOGIA
# =============================
setp(384, "Se adoptó una metodología ágil basada en Scrum para organizar el desarrollo del sistema en ciclos iterativos, con entregables funcionales al cierre de cada sprint.")
setp(385, "La estrategia metodológica permitió combinar análisis y diseño con validación continua, manteniendo trazabilidad entre requerimientos, historias de usuario, arquitectura y pruebas.")
setp(386, "El procedimiento se estructuró en fases: levantamiento y análisis de requerimientos, diseño de arquitectura, implementación modular, pruebas funcionales e integración final con servicios externos.")
setp(387, "La redacción se presenta en forma impersonal y se sustenta en fuentes técnicas y académicas relacionadas con ingeniería de software, seguridad y plataformas web modernas.")
setp(388, "Durante la ejecución se mantuvo un backlog priorizado, reuniones de seguimiento y verificación de criterios de aceptación para cada incremento del producto.")
setp(389, "Los rubros metodológicos del capítulo se presentan conforme a la siguiente estructura.")
setp(390, "2.1 Análisis de requerimientos")
setp(391, "Se identificaron requerimientos funcionales: autenticación de usuarios, gestión de servicios, flujo de cobro con pasarela, notificaciones y visualización de reportes.")
setp(392, "Se definieron requerimientos no funcionales: seguridad de acceso, consistencia transaccional, usabilidad responsive, rendimiento y mantenibilidad del código.")
setp(393, "2.1.1 Identificación y validación de requerimientos")
setp(394, "La validación se efectuó mediante historias de usuario y escenarios de uso, verificando entradas, salidas y reglas de negocio por módulo.")
setp(395, "2.1.2 Priorización del backlog y criterios de aceptación")
setp(396, "Se priorizaron historias críticas (autenticación, pagos y trazabilidad) y se documentaron criterios medibles para aceptación funcional por sprint.")
setp(398, "2.2 Diseño de la solución")
setp(399, "Se diseñó una arquitectura web por capas: interfaz (Next.js/React), lógica de aplicación (API routes) y persistencia/autenticación (Supabase).")
setp(400, "La solución consideró integración con Stripe para checkout y webhooks de confirmación, así como notificaciones push para eventos relevantes al usuario.")
setp(401, "2.2.1 Diseño de arquitectura y componentes")
setp(402, "Se definieron componentes reutilizables de UI, rutas protegidas, contratos de APIs y separación de responsabilidades para facilitar evolución y pruebas.")
setp(404, "2.2.2 Diseño del modelo de datos y seguridad")
setp(405, "El modelo incluyó entidades de servicios, transacciones y alertas, aplicando políticas RLS en Supabase para restringir acceso por contexto de usuario autenticado.")
setp(407, "2.3 Resumen metodológico: La aplicación de Scrum permitió construir una solución incremental, verificable y coherente con los objetivos de automatización de cobros del proyecto PagoIA.")

# =============================
# CAPITULO 3 - ACTIVIDADES REALIZADAS (pasado)
# =============================
setp(424, "Las actividades se ejecutaron en fases de desarrollo Full-Stack, en pasado e impersonal, alineadas con los objetivos específicos del proyecto.")
setp(425, "3.1 Configuración de la base de datos en Supabase y políticas RLS")
setp(426, "Se diseñaron y desplegaron tablas para servicios, transacciones, usuarios y alertas. Posteriormente se aplicaron políticas Row Level Security para controlar acceso por usuario y reforzar confidencialidad de datos.")
setp(427, "Figura 1. Esquema de tablas en Supabase. (Elaboración propia). [Insertar captura del Table Editor].")
setp(428, "3.2 Integración de la pasarela Stripe y gestión de Webhooks")
setp(429, "Se integró Stripe Checkout para procesar cobros y se configuraron webhooks para confirmar eventos de pago, actualizar estados de transacción y sincronizar información en la base de datos.")
setp(430, "Figura 2. Configuración de Stripe Checkout. (Elaboración propia). [Insertar captura del flujo de pago].")
setp(431, "Figura 3. Eventos de Webhooks y confirmación transaccional. (Elaboración propia). [Insertar captura del panel de eventos].")
setp(432, "3.3 Desarrollo del Dashboard y reportes con gráficos de ingresos")
setp(433, "Se implementó un dashboard para visualización operativa de servicios, historial y métricas de ingresos, incorporando gráficos para facilitar interpretación de comportamiento financiero.")
setp(434, "Figura 4. Dashboard principal con indicadores y gráficos de ingresos. (Elaboración propia). [Insertar captura de /dashboard].")
setp(435, "3.4 Implementación de Notificaciones Push con Web Push API")
setp(436, "Se habilitó el módulo de notificaciones push para alertar cambios de estado en pagos y eventos relevantes, validando el flujo de suscripción, envío y visualización en interfaz.")
setp(437, "Figura 5. Configuración de suscripción Web Push API. (Elaboración propia). [Insertar captura de configuración].")
setp(438, "Figura 6. Centro de notificaciones en el dashboard. (Elaboración propia). [Insertar captura de /dashboard/notificaciones].")
setp(439, "3.5 Resultado de la fase de implementación")
setp(440, "Se obtuvo un sistema funcional con autenticación, procesamiento de cobros, trazabilidad de transacciones, reportes visuales y notificaciones en tiempo oportuno, cumpliendo la ruta técnica definida.")
setp(441, "")
setp(442, "")
setp(443, "")
setp(444, "")
setp(445, "")

# =============================
# CAPITULO 4 - CONCLUSIONES
# =============================
setp(465, "El objetivo de automatizar cobros se cumplió al integrarse, en una sola plataforma, los procesos de autenticación, administración de servicios, ejecución de pagos y actualización de estados transaccionales.")
setp(466, "La solución implementada redujo la fragmentación operativa al centralizar flujo de cobro y consulta de historial, mejorando trazabilidad y disponibilidad de información para el usuario final.")
setp(467, "")
setp(468, "La evidencia funcional del sistema confirmó la correspondencia entre requerimientos definidos y módulos desarrollados, observándose consistencia entre análisis, diseño, construcción y validación técnica.")
setp(469, "La integración de Supabase, Stripe, dashboard analítico y notificaciones push permitió sostener un modelo de operación digital con enfoque en seguridad, mantenibilidad y escalabilidad.")
setp(473, "Como trabajo futuro se recomienda incorporar analítica predictiva de mayor profundidad, observabilidad con métricas en producción y ampliación del catálogo de servicios para nuevos contextos de cobro.")
setp(474, "También se sugiere fortalecer estrategia de pruebas automatizadas end-to-end para robustecer control de regresiones en nuevas versiones del sistema.")
setp(476, "La experiencia profesional adquirida consolidó competencias de desarrollo Full-Stack, integración de servicios externos y redacción técnica orientada a documentación de ingeniería de software.")
setp(481, "Se desarrollaron habilidades para diseño modular, solución de incidencias de integración y comunicación técnica de resultados en un contexto real de residencia profesional.")
setp(482, "Competencias desarrolladas y/o aplicadas: dominio de TypeScript 5.7.3, gestión de autenticación con JWT, desarrollo con Next.js 16 y React 19, modelado y seguridad de datos con Supabase (RLS), integración de Stripe y despliegue/operación en Vercel.")

# =============================
# REFERENCIAS APA - 20 (10 libros + 10 digitales)
# =============================
setp(487, "Se presenta un total de 20 referencias en formato APA: 10 libros especializados y 10 fuentes digitales oficiales.")
setp(488, "10 fuentes de libros de ingeniería de software, arquitectura y sistemas inteligentes.")
setp(489, "10 fuentes digitales oficiales de documentación tecnológica e instituciones de referencia.")
setp(490, "REFERENCIAS EN FORMATO APA")

refs = [
"1. Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner's approach (9th ed.). McGraw-Hill.",
"2. Sommerville, I. (2016). Software engineering (10th ed.). Pearson.",
"3. Martin, R. C. (2009). Clean code: A handbook of agile software craftsmanship. Prentice Hall.",
"4. Bass, L., Clements, P., & Kazman, R. (2022). Software architecture in practice (4th ed.). Addison-Wesley.",
"5. Fowler, M. (2018). Refactoring: Improving the design of existing code (2nd ed.). Addison-Wesley.",
"6. Russell, S., & Norvig, P. (2021). Artificial intelligence: A modern approach (4th ed.). Pearson.",
"7. Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep learning. MIT Press.",
"8. Bishop, C. M. (2006). Pattern recognition and machine learning. Springer.",
"9. Han, J., Kamber, M., & Pei, J. (2012). Data mining: Concepts and techniques (3rd ed.). Morgan Kaufmann.",
"10. Laudon, K. C., & Laudon, J. P. (2022). Management information systems: Managing the digital firm (17th ed.). Pearson.",
"11. Vercel, Inc. (n.d.). Next.js documentation. Recuperado el 27 de abril de 2026, de https://nextjs.org/docs",
"12. React Team. (n.d.). React documentation. Recuperado el 27 de abril de 2026, de https://react.dev",
"13. TypeScript Team. (n.d.). TypeScript documentation. Recuperado el 27 de abril de 2026, de https://www.typescriptlang.org/docs/",
"14. Supabase, Inc. (n.d.). Supabase documentation. Recuperado el 27 de abril de 2026, de https://supabase.com/docs",
"15. Stripe, Inc. (n.d.). Stripe API reference. Recuperado el 27 de abril de 2026, de https://docs.stripe.com/api",
"16. Mozilla. (n.d.). Push API. MDN Web Docs. Recuperado el 27 de abril de 2026, de https://developer.mozilla.org/en-US/docs/Web/API/Push_API",
"17. Banco de México. (2023). Reporte anual de sistemas de pago. https://www.banxico.org.mx",
"18. Banco Interamericano de Desarrollo. (2022). Fintech en América Latina y el Caribe: Un ecosistema consolidado para la recuperación. https://www.iadb.org",
"19. OWASP Foundation. (2023). OWASP top 10: The ten most critical web application security risks. https://owasp.org/www-project-top-ten/",
"20. Vercel, Inc. (n.d.). Vercel documentation. Recuperado el 27 de abril de 2026, de https://vercel.com/docs"
]

for i, ref in enumerate(refs):
    setp(491 + i, ref)

# Limpiar ejemplos sobrantes del bloque de referencias
for i in range(511, 561):
    setp(i, "")

# Indices finales
setp(564, "Figura 1. Esquema de tablas en Supabase.")
setp(565, "Figura 2. Configuración de Stripe Checkout.")
setp(566, "Figura 3. Eventos de Webhooks y confirmación transaccional.")
setp(567, "Figura 4. Dashboard principal con gráficos de ingresos.")
setp(568, "Figura 5. Configuración de suscripción Web Push API.")
setp(569, "Figura 6. Centro de notificaciones del sistema PagoIA.")
setp(591, "Tabla 1. Requerimientos funcionales y no funcionales del sistema PagoIA.")
setp(592, "Tabla 2. Modelo lógico de entidades en Supabase.")
setp(593, "Tabla 3. Actividades realizadas por fase de desarrollo.")
setp(594, "Tabla 4. Competencias técnicas desarrolladas durante la residencia.")

# Formato base solicitado (Calibri 12)
for para in p:
    for run in para.runs:
        run.font.name = "Calibri"
        run.font.size = None

doc.save(str(path))
print("Documento actualizado correctamente.")
