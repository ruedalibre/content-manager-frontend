# Content Intelligence Platform
## Changelog de Desarrollo — v1.0
**Registro de cambios post-auditoría · Abril 2026 · Uso interno**

---

## 1. Propósito de este documento

Este documento registra todos los cambios implementados después de la auditoría inicial del sistema (AUDIT_BACKEND_v1, AUDIT_FRONTEND_APP_v1, AUDIT_FRONTEND_LANDING_v1). Sirve como referencia de evolución del producto y debe cargarse junto a los informes de auditoría en cada sesión de trabajo.

Documentos de referencia base:
- AUDIT_BACKEND_v1 — estado inicial del backend
- AUDIT_FRONTEND_APP_v1 — estado inicial del frontend app
- AUDIT_FRONTEND_LANDING_v1 — estado inicial del frontend landing
- AUDIT_EXECUTIVE_SUMMARY_v1 — resumen consolidado inicial

---

## 2. Resumen de Cambios

| **47** Cambios resueltos | **3** Fases completadas | **12** Bugs adicionales | **15** Pendientes activos |
|---|---|---|---|

---

## 3. Fase 1 — Seguridad y Estabilidad Crítica

_Objetivo: el sistema es seguro para recibir usuarios reales._

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Frontend App | Eliminados console.log con IDs de ideas en CreateContentModal | Seguridad básica |
| ✅ RESUELTO | Frontend App | Eliminado VITE_ACCESS_TOKEN del .env — verificado que nunca estuvo en Git | Seguridad crítica |
| ✅ RESUELTO | Frontend App | Eliminada segunda instancia de createClient() en App.tsx | Singleton Supabase |
| ✅ RESUELTO | Frontend Landing | URL hardcodeada de Supabase reemplazada por variable de entorno en RequestAccessModal | Seguridad |
| ✅ RESUELTO | Backend | Bug activo corregido: primary_topic siempre null — rel.topics?.[0] → rel.topics | Bug producción |
| ✅ RESUELTO | Backend | generate-ideas ahora pasa Authorization header al invocar content-dna internamente | Generación ideas |
| ✅ RESUELTO | Backend RLS | early_access_requests: política separada en COUNT público vs SELECT privado | Privacidad emails |
| ✅ RESUELTO | Backend RLS | content_topics y content_tags: filtro por tenant reemplaza qual: true | Aislamiento datos |
| ✅ RESUELTO | Backend RLS | contents UPDATE: agregado with_check para prevenir cambio de tenant_id | Integridad datos |
| ✅ RESUELTO | Backend RLS | creative_units: agregadas políticas UPDATE y DELETE con filtro por tenant | Ciclo vida ideas |
| ✅ RESUELTO | Backend RLS | Todas las políticas migradas de rol public a authenticated | Seguridad RLS |
| ✅ RESUELTO | Backend BD | handle_new_user corregida: crea tenant propio por usuario, UUIDs reales en lugar de enteros hardcodeados | Crítico producción |

---

## 4. Fase 2 — Estabilización y Calidad

_Objetivo: el sistema se comporta correctamente bajo uso real._

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Backend BD | Triggers update_updated_at conectados a contents, topics y tenants | Timestamps |
| ✅ RESUELTO | Backend BD | Rol admin creado y asignado al founder — funciones admin-* protegidas | Seguridad admin |
| ✅ RESUELTO | Backend Functions | content-dna: query de content_topics refactorizado — join por tenant en lugar de .in() con 639 IDs | Performance + bug |
| ✅ RESUELTO | Backend Functions | me-insights: ideaRelations movido fuera del loop de contents — conteo correcto | Bug cálculo |
| ✅ RESUELTO | Frontend App | Estado error agregado a useIdeas, useContentDNA, useAnalyticsInsights, useStrategyInsights | UX errores |
| ✅ RESUELTO | Frontend App | Verificación res.ok agregada en hooks de insights — errores HTTP manejados correctamente | Robustez |
| ✅ RESUELTO | Frontend App | alert() reemplazado por error inline en CreateContentModal | UX |
| ✅ RESUELTO | Frontend App | Bug corregido: contenido con status published fallaba — campo published_at agregado al formulario | Bug producción |
| ✅ RESUELTO | Frontend App | Campo content_role agregado al formulario de CreateContentModal y al endpoint create-content | Feature |
| ✅ RESUELTO | Frontend App | Bug corregido: content_role enviaba string vacío al enum — \|\| null en lugar de ?? null | Bug producción |
| ✅ RESUELTO | Frontend App | Conteo de contenidos en useIdeas excluye soft-deleted | Precisión datos |
| ✅ RESUELTO | Frontend App | Header apikey eliminado de todos los hooks de insights y Contents.tsx | Limpieza código |

---

## 5. Fase 3 — Ciclo de Vida de Ideas y Arquitectura

_Objetivo: el corazón del producto está completo y bien construido._

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Backend BD | Agregados user_id y status (enum: active/archived/exhausted) a creative_units | Modelo datos |
| ✅ RESUELTO | Backend Functions | Creados endpoints update-idea y delete-idea con auth y filtro por tenant | Feature |
| ✅ RESUELTO | Backend BD | Creada tabla pivote content_creative_units — relación many-to-many idea-contenido | Arquitectura |
| ✅ RESUELTO | Backend BD | Vistas recreadas usando content_creative_units en lugar de creative_unit_id | Migración |
| ✅ RESUELTO | Backend BD | Columna creative_unit_id eliminada de contents | Limpieza modelo |
| ✅ RESUELTO | Backend Functions | content-dna y me-insights actualizados para usar content_creative_units | Compatibilidad |
| ✅ RESUELTO | Backend Functions | Creado endpoint me-ideas-counts para conteo eficiente desde tabla pivote | Performance |
| ✅ RESUELTO | Frontend App | useIdeas actualizado para usar me-ideas-counts en lugar de join directo | Compatibilidad |
| ✅ RESUELTO | Frontend App | Ideas.tsx: botones editar y borrar + modal de edición inline implementados | Feature |
| ✅ RESUELTO | Frontend App | generateIdeasFromDNA.ts eliminado — lógica consolidada en backend | Deuda técnica |
| ✅ RESUELTO | Frontend App | Dashboard renombrado a Activity en rutas y archivos | Nomenclatura |
| ✅ RESUELTO | Frontend Landing | Typo corregido: useEarlyAccessCoutn.ts → useEarlyAccessCount.ts | Limpieza |

---

## 6. Bugs Adicionales Resueltos

_Bugs identificados durante el desarrollo que no estaban en la auditoría original._

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Backend Functions | me-contents-history: count: 'planned' → count: 'exact' — total de registros correcto | Bug paginación |
| ✅ RESUELTO | Frontend App | Paginación: al borrar registro, página se recalcula automáticamente si queda vacía | Bug UX |
| ✅ RESUELTO | Frontend App | Dropdown de status: opciones cargadas desde backend — muestra todos los status disponibles | Bug filtros |
| ✅ RESUELTO | Frontend App | Toast de confirmación implementado para crear y editar contenidos | UX mejora |
| ✅ RESUELTO | Backend Functions | Growth Rate: resolveFromDate ampliado para capturar períodos anteriores comparables | Bug métricas |
| ✅ RESUELTO | Frontend App | growthRate.ts: growth_rate parseado con Number() — string de PostgreSQL convertido correctamente | Bug métricas |
| ✅ RESUELTO | Frontend App | Growth Rate muestra '—' en lugar de '0%' cuando no hay datos suficientes para comparar | UX métricas |
| ✅ RESUELTO | Backend BD | Timezone parametrizado por usuario — columna timezone agregada a users | Arquitectura |
| ✅ RESUELTO | Backend BD | Funciones analíticas usan p_timezone en lugar de America/Bogota hardcodeado | Internacionalización |
| ✅ RESUELTO | Frontend App | Día incorrecto en gráfica de 7 días corregido — series generadas en timezone del usuario | Bug visual |
| ✅ RESUELTO | Frontend App | Empty state diferenciado en Activity — usuario nuevo vs sin actividad en período | UX |
| ✅ RESUELTO | Frontend App | Columna content_role y filtro agregados a tabla de Contents | Feature |

---

## 7. Warnings de Seguridad Resueltos

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Backend BD | RLS habilitado en tablas de catálogo: countries, roles, platform_formats, platform_types, languages, insight_catalog | Seguridad |
| ✅ RESUELTO | Backend BD | search_path fijo agregado a enforce_topic_limit, update_updated_at, get_current_user_tenant_id | Seguridad |
| ✅ RESUELTO | Backend BD | search_path fijo agregado a funciones analíticas: admin_content_growth_by_period, cumulative, rate, user_activity_heatmap | Seguridad |
| ✅ RESUELTO | Backend BD | Versión antigua de admin_content_growth_cumulative_by_period eliminada | Limpieza |
| ⚠️ PARCIAL | Backend BD | SECURITY DEFINER views — 40+ vistas pendientes de migrar a SECURITY INVOKER | Bajo impacto actual |
| 📋 PENDIENTE | Backend BD | pg_trgm en schema público — requiere recrear índice GIN de búsqueda | Baja prioridad |
| 📋 PENDIENTE | Auth | Leaked password protection deshabilitado — toggle en Supabase Dashboard | Configuración |

---

## 8. Pendientes Activos

_Tareas identificadas durante el desarrollo que están pendientes de implementación._

### 8.1 Features de producto

- Sistema de nomenclatura para contenidos sin título (Instagram, X)
- Implementar tags de contenidos — sprint dedicado (modelo + RLS + endpoints + UI)
- Perfil de usuario — implementar language, country, role en UI
- Mover cálculo de porcentaje al backend para ContentDNACard

### 8.2 UX y mejoras visuales

- Heatmap no cubre 100% del ancho del contenedor — corrección CSS
- Botones de navegación avanzada en paginación (inicio, fin, saltar páginas)

### 8.3 Inteligencia y analytics

- Market Intelligence Dashboard — análisis de early access + encuesta Tally
- Integración encuesta Tally — script de importación + tabla survey_responses

### 8.4 Arquitectura futura

- Fase 4 del plan de auditoría — tags, timezone en UI, paginación en me-insights
- SECURITY DEFINER views → SECURITY INVOKER (40+ vistas)
- Migrar pg_trgm a schema extensions

---

## 9. Decisiones Arquitectónicas Tomadas Durante el Desarrollo

**9.1 Tabla pivote content_creative_units**

La relación idea → contenido es many-to-many. Un contenido puede estar agrupado por múltiples ideas simultáneamente. La FK directa creative_unit_id fue eliminada de contents y reemplazada por la tabla pivote. ON DELETE CASCADE en content_id, ON DELETE SET NULL en creative_unit_id.

**9.2 Timezone parametrizado por usuario**

Las funciones analíticas reciben p_timezone como parámetro con default 'UTC'. Cada usuario tiene su timezone guardado en users.timezone. El frontend envía el timezone del usuario en cada request. Cuando se implemente el perfil de usuario, el timezone se podrá actualizar desde la UI.

**9.3 Modelo de tenancy — un tenant por usuario independiente**

handle_new_user crea un tenant nuevo por cada usuario que se registra independientemente. El modelo soporta múltiples usuarios por tenant (equipos/agencias) pero el flujo de invitación a tenant existente es una feature pendiente de diseño.

**9.4 Rol admin en tabla roles**

Se creó el rol admin (UUID: 3536f72e-c434-4ced-88a1-0320d68d0b9f) en la tabla roles. Las funciones admin-* verifican este role_id antes de devolver datos agregados del sistema. El founder (Andrés) tiene este rol asignado en producción.

**9.5 Generación de ideas en backend exclusivamente**

generateIdeasFromDNA.ts fue eliminado del frontend. Toda la lógica de generación de ideas vive en la Edge Function generate-ideas. La generación actual es template-based con personalización por primary_topic del Content DNA del usuario.

---

_Content Intelligence Platform · Changelog v1.0 · Abril 2026_
_Documento vivo. Actualizar tras cada ciclo de desarrollo._