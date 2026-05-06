# -*- coding: utf-8 -*-
from docx import Document
from pathlib import Path
import shutil

src = Path(r"c:\Users\slede\source\repos\ProyectoResidencia\0.2.-Formato_Informe_Tecnico_RP_ISC_AlejandroVillafuerteDiazLeal.docx")
out = Path(r"c:\Users\slede\source\repos\ProyectoResidencia\0.2.-Formato_Informe_Tecnico_RP_ISC_AlejandroVillafuerteDiazLeal_COMPLETO.docx")
shutil.copyfile(src, out)

doc = Document(str(out))
p = doc.paragraphs

def setp(i, text):
    if 0 <= i < len(p):
        p[i].text = text

setp(226, "PagoIA Soluciones Digitales, S.A. de C.V. (nombre de uso institucional para fines academicos de residencia).")
setp(227, "Razon Social: PagoIA Soluciones Digitales, S.A. de C.V.")
setp(228, "Giro: Desarrollo de software, integracion de pasarelas de pago y servicios de analitica para plataformas web.")
setp(229, "Resena historica: La organizacion se oriento al diseno de una plataforma digital para centralizar pagos de servicios en Mexico. Durante el periodo de residencia se consolidaron modulos de autenticacion, gestion de servicios, dashboard operativo, integracion con Stripe y notificaciones push para seguimiento transaccional.")
setp(230, "Mision: Proveer soluciones de pago digital confiables, seguras y accesibles que simplifiquen la gestion de servicios recurrentes para los usuarios.")
setp(231, "Vision: Ser una referencia nacional en plataformas inteligentes de gestion de pagos de servicios, con enfoque en experiencia de usuario, seguridad y mejora continua.")
setp(232, "Valores: Innovacion, responsabilidad, seguridad de la informacion, calidad de software, orientacion al usuario y trabajo colaborativo.")
setp(233, "Productos y servicios: Plataforma web PagoIA, panel administrativo de servicios, integracion de checkout de Stripe, centro de notificaciones, generacion de comprobantes y reportes de consumo transaccional.")
setp(234, "Organigrama: Estructura funcional por proyecto con coordinacion tecnica, desarrollo full stack, soporte de base de datos y validacion funcional; el area de residencia se integro al equipo de desarrollo de producto digital.")
setp(235, "Descripcion del area de trabajo donde se desempeno el estudiante: Area de Ingenieria de Software, con actividades de analisis, diseno, implementacion, pruebas e integracion de modulos web.")
setp(236, "Descripcion del puesto donde se desempeno el estudiante: Residente de desarrollo de software full stack, con participacion en frontend (Next.js/React), backend de APIs, integracion con Supabase y pruebas de flujos de pago.")
setp(237, "Ubicacion de la empresa: Operacion digital con infraestructura cloud y alcance funcional para usuarios de servicios en Mexico.")

setp(246, "En Mexico, el pago de servicios recurrentes como electricidad, agua, gas e internet representa una operacion cotidiana para millones de hogares y negocios. Aunque el uso de canales digitales se ha incrementado, la experiencia de pago permanece fragmentada en multiples portales, con distintos procesos de autenticacion, navegacion y confirmacion de operaciones. Esta fragmentacion reduce la visibilidad del estado de pago, incrementa la posibilidad de errores y dificulta la trazabilidad de comprobantes para el usuario final.")
setp(247, "De manera general, la transformacion digital en servicios financieros ha demostrado beneficios en eficiencia operativa y reduccion de tiempos de atencion; no obstante, estos beneficios dependen de la integracion de procesos en una sola plataforma. Cuando la experiencia se divide entre varios sistemas, los usuarios deben repetir informacion, administrar multiples cuentas y cambiar de entorno para completar tareas basicas. En terminos de ingenieria de software, este escenario se reconoce como un problema de interoperabilidad y diseno de experiencia con alta friccion (Pressman & Maxim, 2020).")
setp(248, "En el contexto nacional, el avance de pagos electronicos y banca digital ha crecido de forma sostenida. Sin embargo, el proceso de pago de servicios sigue presentando brechas en centralizacion de informacion, notificaciones oportunas y seguimiento en tiempo real. En consecuencia, se identifico la necesidad de una solucion capaz de concentrar autenticacion, administracion de servicios, ejecucion de pagos y consulta historica dentro de una arquitectura unificada, segura y escalable (Banco de Mexico, 2023).")
setp(249, "En el ambito tecnologico, la disponibilidad de frameworks modernos y servicios backend administrados permitio plantear una solucion con menores tiempos de implementacion y mayor mantenibilidad. La combinacion de Next.js para la capa de presentacion, React para componentes interactivos y Supabase para autenticacion y persistencia de datos constituyo una base adecuada para responder a requerimientos funcionales y no funcionales del proyecto. Asimismo, la integracion de Stripe permitio procesar pagos en linea con un esquema de confirmacion por eventos.")
setp(250, "De lo particular, se definio el proyecto PagoIA como una plataforma web para gestionar servicios y ejecutar pagos con trazabilidad operativa. La problematica abordada se centro en reducir la dispersion de procesos, mejorar la experiencia del usuario en el pago de servicios y fortalecer el control de informacion transaccional mediante paneles de consulta y alertas. El sistema tambien se oriento a ofrecer soporte para crecimiento modular del producto, contemplando panel administrativo y funcionalidades de notificacion push.")
setp(251, "Con base en lo anterior, el proyecto de residencia se justifico por su pertinencia tecnica y su impacto practico: se desarrollo una solucion funcional que articula procesos de autenticacion, administracion de catalogos, flujo de checkout, confirmacion de transacciones y visualizacion de resultados en dashboard. Este enfoque permitio pasar de un entorno operativo fragmentado a un flujo integral de pago en linea, alineado con buenas practicas de ingenieria de software y seguridad aplicable a sistemas financieros web.")

setp(256, "En el contexto operativo del proyecto, se observo que los usuarios requerian un flujo centralizado para pagar servicios sin depender de multiples interfaces desconectadas.")
setp(257, "La dispersion de sistemas ocasionaba baja trazabilidad de pagos, consultas repetitivas y dificultad para ubicar comprobantes en tiempo oportuno.")
setp(258, "Se requirio una arquitectura web con autenticacion segura, gestion de servicios y control de estados transaccionales sobre una misma plataforma.")
setp(259, "Se establecio como necesidad funcional la integracion de un checkout digital confiable y un mecanismo de confirmacion por eventos para actualizar informacion de usuario.")
setp(260, "Se incorporo como requisito de producto la visualizacion de historial, alertas y panel administrativo para apoyar operacion y toma de decisiones.")
setp(261, "Se considero la evolucion futura del sistema mediante componentes modulares para analitica, prediccion de consumo y servicios adicionales.")
setp(262, "La propuesta PagoIA se oriento a resolver esta problematica mediante una solucion integral, segura y escalable para el pago de servicios en Mexico.")

setp(384, "Se aplico una metodologia incremental de ingenieria de software para construir el sistema mediante iteraciones funcionales, con verificacion continua sobre cada modulo entregado.")
setp(385, "La metodologia contemplo las fases de analisis y diseno como base estructural del proyecto, alineadas a criterios de mantenibilidad, trazabilidad y seguridad de la informacion.")
setp(386, "Fases consideradas: analisis de requerimientos, diseno logico y de arquitectura, desarrollo de componentes, pruebas funcionales e integracion de servicios externos.")
setp(387, "La redaccion de esta seccion se presenta en voz impersonal y con sustento bibliografico en formato APA.")
setp(388, "Se integraron referencias tecnicas de ingenieria de software, documentacion oficial de tecnologias y lineamientos de seguridad para sistemas web.")
setp(389, "Los rubros metodologicos se estructuraron de acuerdo con el siguiente esquema.")
setp(390, "2.1 Analisis de requerimientos")
setp(393, "2.1.1 Identificacion de requerimientos funcionales y no funcionales")
setp(395, "2.1.2 Priorizacion de casos de uso y definicion de criterios de aceptacion")
setp(398, "2.2 Diseno de la solucion")
setp(401, "2.2.1 Diseno de arquitectura por capas e integracion de servicios")
setp(404, "2.2.2 Diseno del modelo de datos y politicas de acceso")
setp(407, "2.3 Resumen metodologico: el procedimiento permitio construir una solucion modular, con integracion de pagos, autenticacion y notificaciones, validada mediante pruebas funcionales por flujo.")

setp(424, "Durante el desarrollo del proyecto se ejecutaron actividades de analisis, diseno, implementacion, pruebas e integracion, en cumplimiento de los objetivos especificos definidos para la residencia.")
setp(425, "Se modelaron y validaron entidades de datos en Supabase para soportar autenticacion, catalogo de servicios, transacciones, alertas y relaciones de usuario-servicio.")
setp(426, "Figura 1. Tablas de la base de datos en Supabase (users, services, user_services, transactions, alerts, predictions). (Elaboracion propia). [Inserte captura de Table Editor de Supabase].")
setp(427, "Se desarrollo la interfaz operativa del sistema, incluyendo dashboard, historial, modulos de servicios y flujo de checkout para pago en linea.")
setp(428, "Figura 2. Interfaz del Dashboard de PagoIA con modulos operativos. (Elaboracion propia). [Inserte captura de /dashboard].")
setp(429, "Figura 3. Flujo de Checkout de Stripe para transaccion de servicio. (Elaboracion propia). [Inserte captura de pantalla de checkout].")
setp(430, "Se configuraron webhooks para confirmacion de eventos transaccionales y se habilito el modulo de notificaciones push para seguimiento de estado al usuario final.")
setp(431, "Figura 4. Configuracion de webhooks y eventos de pago. (Elaboracion propia). [Inserte captura del panel de Stripe Webhooks].")
setp(434, "3.1 Analisis y diseno aplicados al proyecto")
setp(435, "3.1.1 Se definio la arquitectura de integracion y se valido el diagrama de flujo operacional del sistema.")
setp(436, "3.1.2 Se implementaron y probaron los modulos funcionales: autenticacion, servicios, pagos, notificaciones y administracion.")
setp(437, "Figura 5. Notificaciones push y centro de alertas del sistema. (Elaboracion propia). [Inserte captura de /dashboard/notificaciones].")
setp(438, "Figura 6. Diagrama de flujo o arquitectura de PagoIA. (Elaboracion propia). [Inserte diagrama de arquitectura en anexo o seccion correspondiente].")

setp(465, "El objetivo general y los objetivos especificos se lograron mediante una implementacion incremental que permitio entregar componentes funcionales y verificables en cada fase del proyecto. Se consolido un sistema web capaz de centralizar el pago de servicios, administrar catalogos y mostrar trazabilidad de operaciones desde una sola plataforma.")
setp(466, "Como resultado principal, se obtuvo una solucion integrada con autenticacion, dashboard operativo, flujo de checkout y notificaciones, lo que redujo la fragmentacion de procesos de pago y mejoro la visibilidad del estado transaccional para el usuario.")
setp(468, "Se respaldo el conocimiento aportado con evidencia funcional del sistema: compilacion exitosa, rutas activas, integracion de servicios externos y operacion de modulos principales en entorno de desarrollo y validacion tecnica.")
setp(469, "El analisis de resultados permitio confirmar relacion directa entre los requerimientos definidos y los modulos implementados, manteniendo consistencia entre diseno, desarrollo y pruebas de aceptacion.")
setp(476, "Trabajo futuro y recomendaciones: fortalecer analitica predictiva de consumo, ampliar catalogo de proveedores y adicionar observabilidad operativa (metricas y trazas) para soporte en produccion.")
setp(482, "Competencias desarrolladas y/o aplicadas: dominio de Next.js 16 para estructura de aplicacion, React 19 para componentes dinamicos, Supabase para autenticacion y persistencia, integracion de Stripe con eventos webhook, diseno modular de frontend, documentacion tecnica y validacion funcional por escenarios.")

refs = [
"1. Vercel, Inc. (n.d.). Next.js documentation. Recuperado el 27 de abril de 2026, de https://nextjs.org/docs",
"2. React Team. (n.d.). React documentation. Recuperado el 27 de abril de 2026, de https://react.dev",
"3. TypeScript Team. (n.d.). TypeScript documentation. Recuperado el 27 de abril de 2026, de https://www.typescriptlang.org/docs/",
"4. Supabase, Inc. (n.d.). Supabase documentation. Recuperado el 27 de abril de 2026, de https://supabase.com/docs",
"5. Stripe, Inc. (n.d.). Stripe API reference. Recuperado el 27 de abril de 2026, de https://docs.stripe.com/api",
"6. Mozilla. (n.d.). Push API. MDN Web Docs. Recuperado el 27 de abril de 2026, de https://developer.mozilla.org/en-US/docs/Web/API/Push_API",
"7. OpenJS Foundation. (n.d.). Node.js documentation. Recuperado el 27 de abril de 2026, de https://nodejs.org/docs/latest/api/",
"8. Russell, S., & Norvig, P. (2021). Artificial intelligence: A modern approach (4th ed.). Pearson.",
"9. OWASP Foundation. (2023). OWASP top 10: The ten most critical web application security risks. https://owasp.org/www-project-top-ten/",
"10. Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner's approach (9th ed.). McGraw-Hill.",
"11. Sommerville, I. (2016). Software engineering (10th ed.). Pearson.",
"12. Martin, R. C. (2009). Clean code: A handbook of agile software craftsmanship. Prentice Hall.",
"13. Bass, L., Clements, P., & Kazman, R. (2022). Software architecture in practice (4th ed.). Addison-Wesley.",
"14. Nielsen, J. (1994). Usability engineering. Morgan Kaufmann.",
"15. Banco de Mexico. (2023). Reporte anual de sistemas de pago. https://www.banxico.org.mx",
"16. INEGI. (2024). ENDUTIH: Encuesta nacional sobre disponibilidad y uso de tecnologias de la informacion en los hogares. https://www.inegi.org.mx",
"17. ISO/IEC. (2011). ISO/IEC 25010:2011 Systems and software quality requirements and evaluation (SQuaRE). International Organization for Standardization.",
"18. NIST. (2020). Security and privacy controls for information systems and organizations (SP 800-53 Rev. 5). https://doi.org/10.6028/NIST.SP.800-53r5",
"19. Laudon, K. C., & Laudon, J. P. (2022). Management information systems: Managing the digital firm (17th ed.). Pearson.",
"20. Fowler, M. (2018). Refactoring: Improving the design of existing code (2nd ed.). Addison-Wesley."
]

setp(487, "Se incluyen 20 referencias en formato APA, combinando libros y fuentes oficiales de tecnologia relacionadas con el proyecto.")
setp(488, "10 Fuentes de libros y obras de ingenieria de software.")
setp(489, "10 Fuentes de internet y documentacion oficial de tecnologias utilizadas.")
setp(490, "REFERENCIAS EN FORMATO APA")
start_ref = 491
for i, r in enumerate(refs):
    setp(start_ref + i, r)

setp(564, "Figura 1. Tablas de la base de datos en Supabase.")
setp(565, "Figura 2. Interfaz del Dashboard de PagoIA.")
setp(566, "Figura 3. Flujo de Checkout de Stripe.")
setp(567, "Figura 4. Configuracion de Webhooks y registro de eventos.")
setp(568, "Figura 5. Centro de notificaciones push en dashboard.")
setp(569, "Figura 6. Diagrama de flujo/arquitectura general del sistema PagoIA.")

setp(591, "Tabla 1. Requerimientos funcionales y no funcionales del sistema PagoIA.")
setp(592, "Tabla 2. Entidades principales del modelo de datos en Supabase.")
setp(593, "Tabla 3. Actividades realizadas y evidencia tecnica por fase.")
setp(594, "Tabla 4. Competencias tecnicas desarrolladas durante la residencia.")

for idx in [576,578,585,597,598,600,605,609]:
    setp(idx, "")

doc.save(str(out))
print(f"Documento completado: {out}")
