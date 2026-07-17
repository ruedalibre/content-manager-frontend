# Changelog v23 — v2.7.0 (app)

## Phase 3.5 — Filtrado real multi-workspace

**Fecha:** Julio 2026
**Versión:** v2.7.0 (frontend + backend)
**Tipo:** Minor — funcionalidad nueva, no solo texto/infraestructura
**Objetivo:** Convertir el WorkspaceSelector de cosmético a funcional, filtrando realmente todos los datos de la aplicación por `workspace_id` en vez de `tenant_id`/`user_id`

---

## Contexto

Desde Phase 3, el `WorkspaceSelector` en el Sidebar mostraba y permitía cambiar entre workspaces, pero ninguna página de la aplicación filtraba sus datos por el workspace activo — todo seguía filtrado por `tenant_id`, invisible con 1 solo workspace por usuario pero roto en cuanto existiera un segundo. Phase 3.5 cierra ese gap en los 4 módulos principales de la aplicación: Ideas, Contents, Activity e Identity.

**Decisiones de producto que guiaron la implementación** (documentadas en `Creadora_Workspaces_Decisiones.docx`):
- `canCreateWorkspace = is_creator` (no trial) — sin cliff al vencer trial
- Workspaces ilimitados en plan Creator
- Contents e Ideas son colaborativos dentro de un workspace (cualquier editor/owner ve y modifica todo, no solo lo propio)
- Content DNA e Identity son por workspace, no por usuario — reflejan el trabajo colectivo
- Topics permanece tenant-wide por ahora — rediseño como librería universal + activación por workspace diferido a Phase 3.6

---

## Bloque 1 — Ideas

**Edge Functions corregidas:** `me-ideas-counts`, `me-creative-sessions`, `me-idea-topics`

**Frontend:** `useIdeas.ts` (recibe `workspaceId`, guard, reactividad), `Ideas.tsx`

**Hallazgo crítico durante la implementación:** `generate-recipe` (ya escrita en Phase 2) usaba `.select("id")` contra `workspace_members`, tabla sin esa columna — causaba `403 Not a member` para todos los usuarios sin excepción. Corregido a `.select("role")`.

**Incidente de producción resuelto en la misma sesión:** tras desplegar el backend sin el frontend correspondiente, `generate-recipe` y `create-content` (que ya exigían `workspace_id` desde Phase 2) rompieron para todos los usuarios reales. Causa raíz: el frontend nunca fue actualizado para mandar ese parámetro. Resuelto mergeando `development` a `main` de inmediato.

**Bug de reactividad:** `useWorkspace` era un hook simple sin Context — cada componente que lo llamaba tenía su propia copia de estado aislada, por lo que cambiar de workspace en el dropdown no se reflejaba sin refrescar la página. Resuelto convirtiendo `useWorkspace.ts` a `useWorkspace.tsx` en un `WorkspaceProvider` con React Context, envolviendo la app en `AppLayout.tsx`.

---

## Bloque 2 — Contents

**Edge Functions corregidas (8):** `me-contents-history`, `create-idea-from-content`, `delete-content`, `restore-content`, `update-content`, `update-content-ideas`, `update-content-topics`, `me-content-associations`

**Frontend:** `Contents.tsx`, `CreateContentModal.tsx`

**Codigo muerto identificado (no requiere fix, no está en uso):** `me-contents` (consulta una vista `user_dashboard_summary`, solo mencionada en changelogs v2-v4), `me-contents-reusable` (implementación insegura, decodificaba el JWT manualmente sin verificar firma). Ambas quedan como candidatas a eliminación en limpieza técnica futura.

**Decisión de colaboración confirmada:** Contents es colaborativo, cualquier miembro del workspace ve y modifica todos los contenidos, no solo los propios. Consistente con `creative_units`/`creative_sessions`.

---

## Bloque 3 — Activity

**Migración de BD:** 4 funciones RPC de PostgreSQL nuevas (`user_activity_heatmap_by_workspace`, `workspace_content_growth_by_period`, `workspace_content_growth_cumulative_by_period`, `workspace_content_growth_rate_by_period`), reemplazando las versiones basadas en `p_user_id`. Las funciones originales se conservan sin eliminar como red de seguridad.

**Edge Functions corregidas (6):** `me-dashboard`, `me-contents-by-platform`, `me-activity-heatmap`, `me-content-growth`, `me-content-growth-cumulative`, `me-content-growth-rate`

**Frontend:** `useDashboardData.ts` (recibe `workspaceId`), `Activity.tsx`

**Criterio de timezone:** se mantiene resuelto desde el perfil del usuario individual (preferencia personal de visualización), no del workspace.

---

## Bloque 4 — Identity

Dividido en dos sub-bloques por complejidad, siguiendo criterio de terreno seguro primero.

### 4a — Funciones sin caché (4)

**Edge Functions corregidas:** `content-dna`, `me-content-system`, `me-insights`, `me-creative-insights`

**Frontend:** `useContentDNA.ts`, `useAnalyticsInsights.ts`, `useCreativeInsights.ts`, `Identity.tsx`

**Bug de concurrencia encontrado y corregido:** `me-insights` declaraba `const insights: any[] = []` a nivel de módulo, fuera del handler, riesgo de fuga de datos entre requests concurrentes en el entorno serverless. Movido dentro del handler.

**Decisión de colaboración en `me-creative-insights`:** la detección de ideas huérfanas originalmente solo consideraba sesiones creadas por el usuario individual. Corregido con join a `creative_units` para considerar sesiones de cualquier miembro del workspace, cambio de comportamiento más notorio del bloque, consistente con el criterio colaborativo general.

### 4b — Funciones con caché (3)

**Migración de BD:**
- `identity_insights_cache`: columna `workspace_id` agregada, backfill desde workspace personal de cada usuario, NOT NULL más UNIQUE (una fila viva por workspace)
- `creative_reports`: columna `workspace_id` agregada, backfill, NOT NULL más índice, sin UNIQUE porque la tabla mantiene historial completo

**Edge Functions corregidas:** `me-identity-insights`, `me-creative-report`, `me-creative-report-get`

**Frontend:** `useIdentityAI.ts`, `useCreativeReport.ts`, `Identity.tsx`

**Bug de UX corregido en `useCreativeReport.ts`:** al no encontrar informe existente para el workspace activo, el hook no limpiaba el estado, un informe generado en un workspace permanecía visible al cambiar a otro workspace sin informe propio. Corregido con reseteo explícito a null.

**Bug de update corregido en `me-creative-report`:** el UPDATE en force_regenerate filtraba por user_id en vez del id específico del registro localizado, podía afectar la fila incorrecta si existía más de un informe histórico. Corregido para usar el id exacto.

**Criterio de contexto personal preservado:** idioma preferido y datos de disponibilidad siguen leyéndose del perfil del usuario individual que dispara la generación, el contenido cacheado es del workspace pero el contexto que lo construye sigue siendo personal.

---

## Consumidores huérfanos encontrados post-despliegue

Durante la verificación en producción de Identity aparecieron 3 llamadas a Edge Functions ya corregidas que no habían sido identificadas en el mapeo inicial:

1. `Ideas.tsx` usando `me-content-system` vía `useContentSystem`, en el modal Sistema de contenido, corregido para recibir workspaceId
2. `useDashboardData.ts` usando `me-insights`, dejada intencionalmente pendiente durante Activity, corregida al llegar a Identity
3. `App.tsx` usando `me-ideas-counts` y `me-creative-sessions` en la función de precalentamiento al montar la app, resuelto eliminando ambas del array de precalentamiento

Verificación cruzada final por grep contra las 24 funciones del alcance completo confirmó que no queda ningún otro consumidor huérfano.

---

## Bug no relacionado, resuelto durante la sesión — SMTP

Durante las pruebas una usuaria real reportó no poder recuperar su contraseña. Causa: SMTP Settings en Supabase seguía configurado con el remitente del dominio eliminado de Resend durante la migración de dominio de la sesión anterior. Corregido al nuevo remitente del dominio vigente. Sin relación con Phase 3.5 pero bloqueaba a usuarios reales y se priorizó su resolución de inmediato.

Housekeeping relacionado: claves duplicadas en el bloque de login del archivo de traducciones en inglés fueron limpiadas de paso.

---

## Testing y verificación

- Los 4 bloques verificados en producción con 2 workspaces reales, Personal y uno de prueba creado vía Postman
- Prueba definitiva de aislamiento: Informe Creativo generado en cada workspace por separado, confirmado que no se mezclan al alternar entre ambos
- Grep de verificación cruzada final sin consumidores huérfanos pendientes
- Build de TypeScript limpio en cada punto de despliegue

---

## Pendiente relacionado, fuera de alcance de Phase 3.5

- Phase 3.6, Topics como librería universal con activación por workspace
- Phase 3.7 propuesta, UI de contextualización por workspace usando la columna system_prompt hoy sin interfaz
- Activar UI de Crear workspace, hoy comentada, con feature gating para plan Creator
- Validación con un Creator piloto con 2 o más workspaces reales antes de abrir la feature a todos
- Reconsiderar el campo is_reusable en Contents, candidato a Fase 5
- Limpieza técnica: eliminar las 2 funciones de código muerto identificadas, agregar configuración de imports para resolver advertencia de linter en me-creative-report

---

## Operacional

Git tags: v2.7.0 en frontend y backend.

Migraciones aplicadas: add_workspace_rpc_functions_activity, add_workspace_id_identity_insights_cache, finalize_workspace_id_identity_insights_cache, add_workspace_id_creative_reports, finalize_workspace_id_creative_reports.

Deployment: 24 Edge Functions redesplegadas a lo largo de la sesión, frontend desplegado incrementalmente tras cada bloque.

---

Estado: v2.7.0 completada. Phase 3.5 cerrada. El WorkspaceSelector deja de ser cosmético, Ideas, Contents, Activity e Identity filtran y aíslan correctamente los datos por workspace activo, verificado en producción con 2 workspaces reales.