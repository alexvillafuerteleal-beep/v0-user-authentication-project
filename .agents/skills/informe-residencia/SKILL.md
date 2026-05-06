---
name: informe-residencia
description: >
  Skill para generar, completar o actualizar el Informe Técnico de Residencia Profesional
  de Alejandro Villafuerte Díaz Leal. Úsalo cuando el usuario pida: escribir el informe de
  residencia, generar el documento Word, completar una sección del informe, actualizar el
  capítulo de metodología, marco teórico, conclusiones, actividades, empresa, antecedentes,
  objetivos, justificación, alcances, referencias APA, abstract, resumen, agradecimientos
  o cualquier parte del formato FO-TEST-DSS-PS9-09 / 0.2 Informe Técnico ISC.
---

# Skill: Informe Técnico de Residencia Profesional

## Propósito

Generar el documento Word completo del Informe Técnico de Residencia Profesional siguiendo
**exactamente** las indicaciones del formato oficial `0.2.-Formato_Informe_Tecnico_RP_ISC_AlejandroVillafuerteDiazLeal.docx`.

## Datos del estudiante y proyecto

| Campo | Valor |
|---|---|
| Nombre | Alejandro Villafuerte Díaz Leal |
| Carrera | Ingeniería en Sistemas Computacionales (ISC) |
| Institución | Tecnológico de Estudios Superiores de Tianguistenco |
| Asesora | Amanda Villafuerte Reyes |
| Empresa | PagoIA Soluciones Tecnológicas, S.A. de C.V. |
| Proyecto | Sistema para la gestión de pagos y servicios con Inteligencia Artificial |
| Periodo | 2026 |

## Reglas de formato (obligatorias)

- **Fuente**: Calibri (cuerpo), tamaño **12**
- **Interlineado**: **1.5**
- **Alineación**: Todo **justificado**
- **Márgenes**: Izquierdo 3 cm, Derecho 3 cm, Superior 2.5 cm, Inferior 2 cm
- **Estilos de Word usados en el documento**:
  - `TitulosYanSecciones` → Títulos de sección principal (Resumen, Abstract, Capítulos, etc.)
  - `TituloYan1` → Subtítulos de capítulo (1.1, 2.1, 4.1, etc.)
  - `SubTituloYan2` → Sub-subtítulos (1.1.1, 1.1.2, etc.)
  - `Normal` → Cuerpo de texto
  - `List Paragraph` → Listas con viñetas

## Estructura y contenido del documento

```
Portada (párrafos 0–37)
Resumen en español (39–122)
Abstract en inglés (124–209)
Agradecimientos (212–216)
Índice (218–221)
Descripción de la empresa (223–237)
Antecedentes (244–253)
  └ Planteamiento del Problema (254–262)
  └ Objetivos (282–293)
Justificación (296–301)
Alcances y limitaciones (305–318)
CAPÍTULO 1 – Marco Teórico (321–380)
  └ 1.1 Sistemas de Información y Comercio Electrónico
      1.1.1 Definición Conceptual de Sistemas de Información
      1.1.2 Arquitectura Empresarial de Sistemas de Pagos
  └ 1.2 Procesamiento de Pagos Digitales
      1.2.1 Teoría de Gatekeeping y Autoridades de Pago
      1.2.2 Modelos de Flujo Transaccional
  └ 1.3 Gestión de Datos en Tiempo Real
  └ 1.4 Seguridad en Sistemas Web
CAPÍTULO 2 – Metodología (381–419)
  └ 2.1 Análisis de requerimientos
      2.1.1 Requerimientos funcionales y no funcionales
      2.1.2 Priorización y criterios de aceptación
  └ 2.2 Diseño de la solución
      2.2.1 Diseño de arquitectura y componentes
      2.2.2 Diseño del modelo de datos y seguridad
  └ 2.3 Resumen metodológico
CAPÍTULO 3 – Actividades realizadas (420–458)
  └ 3.1 Configuración de base de datos y RLS
      3.1.1 Modelado de entidades en Supabase
      3.1.2 Políticas Row Level Security
  └ 3.2 Integración de pasarela Stripe y Webhooks
      3.2.1 Stripe Checkout y flujo de cobro
      3.2.2 Webhooks y confirmación transaccional
  └ 3.3 Dashboard, notificaciones y reportes
  └ 3. Resumen de capítulo
CAPÍTULO 4 – Conclusiones (459–485)
  └ 4.1 Conclusiones
  └ 4.2 Trabajo futuro y recomendaciones
  └ 4.3 Experiencia personal-profesional adquirida
  └ 4.4 Competencias desarrolladas y/o aplicadas
Referencias APA (486–524+) – mínimo 20
  └ 10 libros especializados
  └ 10 fuentes digitales oficiales
```

## Workflow de la skill

### Generar documento completo

```bash
# Requiere: .venv activo con python-docx instalado
# Plantilla en: C:\Users\slede\Downloads\0.2.-Formato_Informe_Tecnico_RP_ISC_AlejandroVillafuerteDiazLeal.docx
# Salida en: <workspace>/0.2.-Formato_Informe_Tecnico_RP_ISC_AlejandroVillafuerteDiazLeal_COMPLETO.docx

cd c:\Users\slede\source\repos\ProyectoResidencia
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py
```

### Actualizar solo una sección

```bash
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py --seccion empresa
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py --seccion cap1
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py --seccion cap2
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py --seccion cap3
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py --seccion cap4
.\.venv\Scripts\python.exe .agents\skills\informe-residencia\generar_informe_completo.py --seccion referencias
```

## Instrucciones de redacción por capítulo

### Resumen / Abstract
- Máx. 250 palabras en español y 250 en inglés
- Incluye: objetivo, descripción, tecnologías, resultados, conclusión
- No usa subtítulos dentro del resumen

### Agradecimientos
- Redacción personal, Calibri 12, 1.5, justificado
- Agradece a familia, asesora, institución y empresa

### Descripción de la empresa
Cubrir: Razón Social, Giro, Reseña histórica, Misión, Visión, Valores,
Productos y servicios, Organigrama, Área de trabajo, Puesto del estudiante, Ubicación.

### Antecedentes
- Mínimo 1 cuartilla, máximo 2 cuartillas
- Contextualización: dónde, cuándo, cómo
- Ir de lo general (América Latina / México) a lo particular (PagoIA)
- Redacción impersonal con citas APA

### Planteamiento del Problema
- Mínimo 1 cuartilla
- Causas → consecuencias → necesidad de solución
- Evidencia del problema con datos

### Objetivos
- 1 objetivo general
- 7 objetivos específicos (verbos en infinitivo)

### Justificación
- Relevancia tecnológica y social
- Impacto en los usuarios y la organización
- Citar tecnologías como solución

### Alcances y limitaciones
- Alcance tecnológico, temporal (6 meses), organizacional
- Limitaciones del proyecto

### Capítulo 1 – Marco Teórico
- Redacción impersonal con citas APA
- Mínimo 4 secciones con subsecciones
- Temas: Sistemas de Información, Pagos Digitales, Seguridad Web, IA aplicada
- Esquema: 1.1 > 1.1.1 > 1.1.2 / 1.2 > 1.2.1 > 1.2.2 / etc.

### Capítulo 2 – Metodología
- Redacción impersonal con citas APA
- Metodología: Scrum / Incremental
- Fases: Análisis → Diseño → Desarrollo → Pruebas → Despliegue
- Esquema: 2.1 > 2.1.1 > 2.1.2 / 2.2 / 2.3 Resumen

### Capítulo 3 – Actividades realizadas
- Redacción en **pasado impersonal**
- Incluir figuras con descripción: "Figura N. Descripción. (Elaboración propia)."
- Cubrir: BD Supabase, Stripe, Dashboard, Notificaciones push, Pruebas
- Esquema: 3.1 > 3.1.1 > 3.1.2 / 3.2 / 3.3 / 3. Resumen

### Capítulo 4 – Conclusiones
- 4.1: Cómo se lograron los objetivos + conclusiones adicionales
- 4.2: Trabajo futuro y recomendaciones (IA predictiva, observabilidad, más servicios)
- 4.3: Experiencia personal-profesional adquirida
- 4.4: Competencias desarrolladas (TypeScript, Next.js, Supabase, Stripe, etc.)

### Referencias APA
- Mínimo 20 referencias: 10 libros + 10 fuentes digitales
- Formato APA 7ª edición
- Ordenadas numéricamente

## Notas importantes

- **No modificar** los estilos `TitulosYanSecciones`, `TituloYan1`, `SubTituloYan2` existentes
- Reemplazar únicamente el **texto** de los párrafos de instrucción (los que dicen "El formato del texto deberá ser..." o "Los rubros o conceptos deben...") con el contenido real
- Los títulos de sección (`CAPÍTULO 1\nMarco Teórico`, etc.) **no se modifican**
- Los encabezados de subsección (1.1, 1.1.1, etc.) sí se modifican para poner el título real
- Cada `setp(i, texto)` modifica el texto del párrafo i preservando el estilo Word original
