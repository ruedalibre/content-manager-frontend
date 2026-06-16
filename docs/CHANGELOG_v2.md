# Content Intelligence Platform
## Changelog de Desarrollo — v2.0
**Implementación de IA, Onboarding y Sistema de Recetas · Abril 2026 · Uso interno**

---

## 1. Propósito de este documento

Este documento registra todos los cambios implementados después del CHANGELOG_v1. Cubre las fases de estabilización del sistema base, implementación del onboarding inteligente, y el sprint de Recetas de Contenido con IA.

Documentos de referencia previos:
- CHANGELOG_v1 — cambios post-auditoría inicial
- AUDIT_EXECUTIVE_SUMMARY_v1 — estado inicial del sistema

---

## 2. Resumen Ejecutivo

| **2** Fases completadas | **18** Nuevos endpoints | **8** Nuevas tablas BD | **12** Bugs resueltos |
|---|---|---|---|

---

## 3. Bugs y Mejoras Post-Changelog v1

_Correcciones y mejoras implementadas después del primer changelog._

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Backend BD | me-contents-history: count: 'planned' → count: 'exact' — total de registros correcto | Bug paginación |
| ✅ RESUELTO | Frontend App | Paginación avanzada: botones inicio, fin, saltar 5 páginas, input numérico directo | UX mejora |
| ✅ RESUELTO | Frontend App | Dropdown de status carga desde backend — muestra todos los status disponibles | Bug filtros |
| ✅ RESUELTO | Frontend App | Toast de confirmación al crear y editar contenidos | UX mejora |
| ✅ RESUELTO | Backend Functions | Growth Rate: resolveFromDate ampliado para capturar períodos anteriores comparables | Bug métricas |
| ✅ RESUELTO | Frontend App | growthRate: growth_rate parseado con Number() — string de PostgreSQL convertido correctamente | Bug métricas |
| ✅ RESUELTO | Frontend App | Growth Rate muestra '—' cuando no hay datos suficientes para comparar | UX métricas |
| ✅ RESUELTO | Backend BD | Timezone parametrizado por usuario — columna timezone agregada a users | Arquitectura |
| ✅ RESUELTO | Backend BD | Funciones analíticas usan p_timezone en lugar de America/Bogota hardcodeado | Internacionalización |
| ✅ RESUELTO | Frontend App | Día incorrecto en gráfica de 7 días corregido — series generadas en timezone del usuario | Bug visual |
| ✅ RESUELTO | Frontend App | Empty state diferenciado en Activity — usuario nuevo vs sin actividad en período | UX |
| ✅ RESUELTO | Frontend App | Columna content_role y filtro agregados a tabla de Contents | Feature |
| ✅ RESUELTO | Frontend App | Columna y filtro de topics en tabla de Contents | Feature |
| ✅ RESUELTO | Frontend App | Heatmap dinámico — celdas escalan al ancho del contenedor con ResizeObserver | Bug visual |
| ✅ RESUELTO | Backend Functions | update-content: content_role agregado al destructuring y al UPDATE | Bug edición |
| ✅ RESUELTO | Frontend App | published_at en modo edición: .slice(0, 16) para formato datetime-local | Bug edición |
| ✅ RESUELTO | Frontend App | Bug login: navigate('/dashboard') → navigate('/activity') | Bug crítico |

---

## 4. Sprint Topics e Ideas

_Implementación completa del sistema de topics y su integración con ideas y contenidos._

### 4.1 Modelo de datos

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Backend BD | Tabla idea_topics — pivote many-to-many entre ideas y topics | Modelo |
| 🆕 NUEVO | Backend BD | Tabla user_profiles — perfil extendido del creador con datos de onboarding | Modelo |
| 🆕 NUEVO | Backend BD | Tabla creative_sessions — historial de recetas generadas con feedback | Modelo |
| ✅ RESUELTO | Backend BD | Eliminado trigger enforce_topic_limit — sin límite de topics por contenido | Arquitectura |
| ✅ RESUELTO | Backend BD | Constraint topics_name_max_length: 100 chars en BD, 50 en UI para cubrir multibyte | Arquitectura |
| 🆕 NUEVO | Backend BD | Campo entry_channel en contents — 'manual' \| 'recipe' \| 'migration' \| 'api' | Migración futura |
| 🆕 NUEVO | Backend BD | Campo combination_hash en creative_sessions — unicidad de combinaciones | Arquitectura |
| 🆕 NUEVO | Backend BD | Campo content_role en creative_sessions | Feature |

### 4.2 Endpoints nuevos

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Backend Functions | me-topics — listar topics del tenant | Topics |
| 🆕 NUEVO | Backend Functions | create-topic — crear topic con validación de 50 chars en UI | Topics |
| 🆕 NUEVO | Backend Functions | update-topic — editar topic con regeneración de slug | Topics |
| 🆕 NUEVO | Backend Functions | archive-topic — archivar topic (soft delete) | Topics |
| 🆕 NUEVO | Backend Functions | update-idea-topics — asociar topics a una idea (reemplaza el set completo) | Topics |
| 🆕 NUEVO | Backend Functions | me-idea-topics — leer topics de una idea específica | Topics |
| 🆕 NUEVO | Backend Functions | update-content-topics — actualizar topics de un contenido | Contenidos |
| 🆕 NUEVO | Backend Functions | update-content-ideas — actualizar ideas de un contenido | Contenidos |
| 🆕 NUEVO | Backend Functions | me-content-associations — leer topics e ideas de un contenido | Contenidos |
| 🆕 NUEVO | Backend Functions | me-user-profile — leer perfil del creador | Onboarding |
| 🆕 NUEVO | Backend Functions | create-user-profile — crear perfil en el onboarding | Onboarding |
| 🆕 NUEVO | Backend Functions | update-user-profile — actualizar perfil y campos inferidos por comportamiento | Onboarding |
| 🆕 NUEVO | Backend Functions | generate-recipe — generación de Receta de Contenido con IA (Claude) | IA |
| 🆕 NUEVO | Backend Functions | me-creative-sessions — listar sesiones creativas del usuario | Recetas |
| 🆕 NUEVO | Backend Functions | update-creative-session — actualizar status y feedback de una sesión | Recetas |
| ✅ RESUELTO | Backend Functions | delete-idea: elimina asociaciones en content_creative_units, idea_topics y creative_sessions antes de borrar | Bug |

---

## 5. Fase 1 — Onboarding Inteligente

_Sistema de bienvenida y captura de perfil del creador en la primera sesión._

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | WelcomeScreen — pantalla de bienvenida con explicación del producto y CTA | UX |
| 🆕 NUEVO | Frontend App | Flujo de onboarding — 4 preguntas opcionales con barra de progreso | Onboarding |
| 🆕 NUEVO | Frontend App | Preguntas: tiempo disponible, setup de producción, fuentes de ideas, referentes | Onboarding |
| 🆕 NUEVO | Frontend App | Hook useUserProfile — carga, crea y actualiza el perfil del creador | Hook |
| 🆕 NUEVO | Frontend App | Integración en AppLayout — WelcomeScreen aparece automáticamente en primera sesión | Integración |
| ✅ RESUELTO | Frontend App | isFirstSession vs needsOnboarding — diferenciación de estados de perfil | Lógica |

---

## 6. Fase 2 — Sistema de Recetas de Contenido

_Implementación del primer output de IA: la Receta de Contenido personalizada._

### 6.1 Arquitectura de la Receta

La Receta de Contenido es un documento JSON estructurado generado por Claude basado en la combinación idea + topics + plataforma + formato + role del creador y su perfil de onboarding. Se guarda en `creative_sessions` junto al feedback del creador.

Estructura del JSON de receta:
- `angle` — el ángulo principal para abordar la idea
- `hook` — el gancho de apertura listo para usar
- `tone` — el tono recomendado para el contenido
- `structure` — pasos concretos de desarrollo
- `reuse_suggestions` — conexiones con contenido anterior
- `strategic_note` — observación estratégica personalizada

### 6.2 Cambios en el frontend

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | Layout de 2 columnas en Ideas — idea card + recipe card emparejadas | UX |
| 🆕 NUEVO | Frontend App | Selectores de plataforma, formato y role en la idea card para configurar la receta | UX |
| 🆕 NUEVO | Frontend App | Botón animado '✨ Generate' con dots de carga durante la generación | UX |
| 🆕 NUEVO | Frontend App | RecipeCard — muestra angle y hook de la receta con estado y fecha | Componente |
| 🆕 NUEVO | Frontend App | RecipePanel — vista expandida con combinación + receta + feedback por aspecto | Componente |
| 🆕 NUEVO | Frontend App | Sistema de feedback inline — rating de 1-5 por angle, hook, tone y structure | Feature |
| 🆕 NUEVO | Frontend App | Estados de receta: generated \| reviewed \| executed \| discarded | Feature |
| 🆕 NUEVO | Frontend App | Estadísticas en toolbar: ideas totales, con receta, implementadas | Feature |
| ✅ RESUELTO | Frontend App | Pre-llenado de plataforma, formato y role al abrir CreateContentModal desde receta | Integración |
| ✅ RESUELTO | Frontend App | Estado de selectores persiste después de generar receta — carga desde sesión existente | Bug |
| 🆕 NUEVO | Frontend App | Hook usePlatforms — reutilizable en Ideas y Contents | Hook |
| 🆕 NUEVO | Frontend App | Hook useFormats — retorna Promise<string[]> para uso por idea independiente | Hook |

### 6.3 Prompt del sistema

El prompt de generación de Recetas es parametrizado por el perfil del creador. Incluye contexto de tiempo disponible, setup de producción, fuentes de inspiración y referentes. También incluye el historial de los últimos 10 contenidos del creador para sugerencias de reutilización.

Modelo utilizado: `claude-sonnet-4-5`. Temperatura: default. Max tokens: 1000.

---

## 7. Decisiones Arquitectónicas Tomadas en v2

**7.1 Arquetipos invisibles**

Los arquetipos de creador funcionan como orientadores internos invisibles — no se muestran al usuario. La experiencia se personaliza sin etiquetar al creador. El arquetipo se calcula del onboarding y se refina con el comportamiento real. Decisión basada en investigación antropológica del founder: las personas no se sienten cómodas siendo encasilladas.

**7.2 Dos capas de personalización**

Capa 1 — Arquetipo base: viene del onboarding, orienta el tono desde el inicio. Capa 2 — Comportamiento real: el sistema observa qué ideas usa, qué recetas ejecuta, qué feedback da, y refina el perfil silenciosamente. Con el tiempo la Capa 2 domina a la Capa 1.

**7.3 Receta como unidad de trabajo pendiente**

El espacio vacío en el layout de 2 columnas no es ausencia — es invitación. Ideas & Topics funciona como sala de producción, no biblioteca pasiva. Las recipe cards vacías invitan al creador a generar recetas. El estado 'en cola' convierte la lista de ideas en una cola de trabajo pendiente.

**7.4 Compatibilidad con migración de historial**

El campo `entry_channel` en `contents` permite diferenciar contenidos creados manualmente, desde recetas, o migrados desde otras plataformas. Los contenidos migrados alimentan el DNA y los analytics pero no tienen ideas ni topics asociados — eso es esperado y correcto.

**7.5 Unicidad de combinaciones**

Una idea puede tener múltiples recetas siempre que la combinación `idea_id + topic_ids + platform_id + format + content_role` sea única. El hash SHA-256 de la combinación se guarda en `combination_hash` con un índice único. Si el creador intenta generar una receta duplicada, el sistema lo detecta y le muestra la existente.

---

## 8. Roadmap Activo — Fases Pendientes

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 📋 PENDIENTE | Fase 3 | Creator Identity — página dedicada /identity con DNA creativo completo | Alta prioridad |
| 📋 PENDIENTE | Fase 4 | Insights automáticos v2 — señales detectadas sin acción del creador | Alta prioridad |
| 📋 PENDIENTE | Fase 5 | Informe Creativo — análisis profundo bajo demanda con Claude | Media prioridad |
| 📋 PENDIENTE | Fase 6 | Content System View — vista de conjuntos idea + topics + contenidos | Media prioridad |
| 📋 PENDIENTE | Fase 7 | Pulido y lanzamiento — primer batch de early adopters | Baja prioridad |
| 📋 PENDIENTE | Feature | Regeneración de aspecto específico de la Receta según feedback bajo | Fase 2 extensión |
| 📋 PENDIENTE | Feature | Sistema de nomenclatura para contenidos — title_pattern en users | Backlog |
| 📋 PENDIENTE | Feature | Perfil de usuario en UI — language, country, timezone, role | Backlog |
| 📋 PENDIENTE | Feature | Tags — sprint dedicado con modelo completo | Backlog |
| 📋 PENDIENTE | Feature | Market Intelligence Dashboard — early access + encuesta Tally | Backlog |
| 📋 PENDIENTE | Arquitectura | SECURITY DEFINER views → SECURITY INVOKER (40+ vistas) | Deuda técnica |
| 📋 PENDIENTE | Arquitectura | Migración de historial externo — script de importación masiva | Futuro |

---

_Content Intelligence Platform · Changelog v2.0 · Abril 2026_
_Documento vivo. Actualizar tras cada ciclo de desarrollo._