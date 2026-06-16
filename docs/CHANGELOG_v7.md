# Content Intelligence Platform
## Changelog de Desarrollo — v7.0
**Brief System Redesign, Archived Ideas, Activity Fixes & AI Insights · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v6 (v1.4.0). Cubre el rediseño completo del flujo de briefs en la página Ideas y Temas, la funcionalidad de ideas archivadas, correcciones críticas en las gráficas de la página Actividad, y fixes en los insights de IA de Identidad.
 
Documentos de referencia previos:
- CHANGELOG_v6 — IP Protection, Legal Pages, Rate Limiting, Security Audit & API Cache
- CHANGELOG_v5 — Admin Dashboards, Survey Intelligence, Login Refinements
- CHANGELOG_v4 — Waitlist Intelligence v1, Login Redesign, Fix is_deleted
- CHANGELOG_v3 — Security Audit, Fase 3 Creator Identity
**Tag de versión:** `v1.5.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 1 Sistema de briefs rediseñado | 1 Feature archivados | 3 Funciones SQL corregidas | 2 Fixes IA |
|---|---|---|---|
 
---
 
## 3. Ideas y Temas — Rediseño del sistema de briefs
 
### 3.1 Contexto
 
El modelo de datos ya soportaba múltiples briefs por idea (`creative_sessions` sin constraint único en `idea_id`), pero la UI solo mostraba el brief más reciente como una card que ocupaba todo el espacio de la columna derecha. El rediseño expone la capacidad real del modelo: una idea puede tener tantos briefs como combinaciones de parámetros quiera explorar el creador.
 
### 3.2 Nuevo componente `BriefList`
 
Reemplaza `RecipeCard`. Muestra todos los briefs activos (no descartados) de una idea como lista compacta:
 
```
Youtube · Video · Educativo .......... [Borrador]  20/5  ↓
Instagram · Reel · Personal .......... [Aprobada]  19/5
LinkedIn · Post · Inspiracional ...... [Convertida] 18/5
```
 
| Elemento | Detalle |
|---|---|
| Combinación | Plataforma · Formato · Rol — identificador natural del brief |
| Línea de puntos | Spacer flexible entre combinación y acciones |
| Badge de estado | Borrador / Aprobada / Convertida / Descartada |
| Fecha | Formato local, font monospace |
| Ícono de descarga | Color `--accent` cuando el creador ya descargó el brief |
| Hover | Resalta combinación con `--primary` y subrayado — toda la fila es cliqueable |
| Header | "BRIEFS · N briefs" — contador de briefs activos |
 
### 3.3 Estados del brief actualizados
 
| Estado interno | Label ES | Label EN | Cambio |
|---|---|---|---|
| `generated` | Borrador | Draft | Renombrado de "Generado" |
| `reviewed` | Aprobada | Approved | Sin cambio |
| `executed` | Convertida | Converted | Renombrado de "Generado" — evita confusión con "Generada" de ideas IA |
| `discarded` | Descartada | Discarded | Filtrado — no aparece en la lista |
 
### 3.4 Cambios de comportamiento
 
| Comportamiento | Antes | Después |
|---|---|---|
| Briefs por idea | Solo el más reciente | Todos los activos en lista compacta |
| Al generar un brief | Aparece en la card, campos quedan llenos | Modal se abre automáticamente, campos se limpian |
| Al descartar | Mensaje "prueba nueva combinación" | Brief desaparece de la lista silenciosamente |
| Botón Crear contenido | Bloqueado sin aprobación previa | Habilitado en cualquier estado activo |
| Badge al crear contenido | Sin cambio visual | Cambia a "Convertida" inmediatamente |
| Flag de descarga | No existía | Ícono discreto en color accent cuando fue descargado |
 
### 3.5 Plataforma en el modal del brief
 
La columna de Combinación en `RecipePanel` ahora incluye Plataforma, que estaba ausente — solo mostraba Temas, Formato y Rol.
 
### 3.6 Fix de reloads — actualizaciones quirúrgicas de estado
 
Todas las funciones de `useIdeas.ts` que antes terminaban con `await loadIdeas()` (recarga completa) ahora actualizan solo el elemento afectado en el array local con `setIdeas(prev => prev.map(...))`:
 
| Función | Antes | Después |
|---|---|---|
| `updateIdea` | `loadIdeas()` | Actualiza título y descripción de la idea |
| `updateIdeaTopics` | `loadIdeas()` | Actualiza topics de la idea |
| `updateSessionStatus` | `loadIdeas()` | Actualiza status de la sesión |
| `saveFeedback` | `loadIdeas()` | Actualiza feedback de la sesión |
| `updateRecipeAspect` | `loadIdeas()` | Actualiza recipe de la sesión |
| `markAsDownloaded` | No existía | Actualización optimista + persistencia async |
| `deleteIdea` | `loadIdeas()` | Filtra la idea del array |
 
`loadIdeas()` completo se mantiene solo en: carga inicial, `refetch` al crear contenido desde brief, y `restoreIdea`.
 
### 3.7 Fix — campos de combinación no se repoblaban al volver a la página
 
El `useEffect` que inicializa `recipeState` desde las sesiones existentes repoblaba los selectores cada vez que el componente se remontaba. Fix: solo pre-llenar selectores si la última sesión es de un día anterior — si es de hoy, los campos quedan vacíos para la siguiente combinación.
 
### 3.8 Fix — temas persistiendo en briefs
 
`handleGenerateRecipe` llamaba a `updateIdeaTopics(idea.id, [], [])` después de generar, borrando la relación `idea_topics` en BD. Los temas son de la idea, no de la combinación — se eliminó esa llamada. Los temas siempre pertenecen a la idea y se mantienen visibles en la card.
 
### 3.9 Campo `downloaded_at` en `creative_sessions`
 
```sql
ALTER TABLE creative_sessions
ADD COLUMN downloaded_at TIMESTAMPTZ DEFAULT NULL;
```
 
El endpoint `update-creative-session` acepta el nuevo campo. `markAsDownloaded` hace actualización optimista en el estado local y persiste en BD de forma async sin bloquear la UI.
 
---
 
## 4. Ideas Archivadas
 
### 4.1 Contexto
 
Flujo de gestión del ciclo de vida de una idea:
```
Activa → [Archivar] → Archivada → [Restaurar] → Activa
Activa → [Eliminar + confirmación] → Eliminada permanentemente
```
 
### 4.2 Cambios en BD
 
```sql
ALTER TABLE creative_units
ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;
 
CREATE INDEX idx_creative_units_archived_at
ON creative_units(tenant_id, archived_at)
WHERE archived_at IS NULL;
```
 
### 4.3 Endpoint `archive-idea`
 
Nuevo endpoint `POST /archive-idea/:id`. Acepta `{ archived: boolean }` — `true` para archivar, `false` para restaurar. Filtra por `tenant_id` (no `user_id` — la columna `user_id` en `creative_units` es `null` para todos los registros existentes).
 
### 4.4 Cambios en el frontend
 
| Estado | Cambio |
|---|---|
| 🆕 NUEVO | Pestaña "Archivadas" — tercera pestaña después de Ideas y Temas |
| 🆕 NUEVO | Lista desplegable por idea — título + contador de briefs + fecha de archivo + botón Restaurar |
| 🆕 NUEVO | Al expandir cada idea archivada — lista de briefs con combinación y estado |
| 🆕 NUEVO | Botón Archivar en la card de ideas — entre Editar y Eliminar |
| 🆕 NUEVO | Confirmación antes de archivar con mensaje explicativo |
| 🆕 NUEVO | Contador del tab "Archivadas" se actualiza localmente al archivar sin recargar |
| 🔄 MODIFICADO | Mensaje de eliminación — explícito sobre irreversibilidad y que los briefs también se eliminan |
| 🆕 NUEVO | `loadArchivedIdeas` en `useIdeas.ts` — carga lazy, solo al abrir la pestaña |
| 🆕 NUEVO | `archiveIdea` y `restoreIdea` en `useIdeas.ts` |
 
### 4.5 Filtro en vista principal
 
`loadIdeas` ahora incluye `.is("archived_at", null)` para excluir archivadas de la lista activa. Las ideas archivadas solo aparecen en la pestaña Archivadas.
 
---
 
## 5. Actividad — Correcciones de gráficas
 
### 5.1 Causa raíz
 
Las tres funciones SQL de crecimiento filtraban por `published_at` — campo opcional que el creador llena manualmente. De 19 contenidos, solo 6 tenían `published_at` poblado. El resultado: gráficas casi vacías para todos los usuarios.
 
### 5.2 Funciones SQL corregidas
 
Migración: `[timestamp]_fix_growth_functions_use_created_at.sql`
Migración: `[timestamp]_fix_growth_field_names.sql`
 
| Función | Fix 1 | Fix 2 | Fix 3 |
|---|---|---|---|
| `user_content_growth_by_period` | `published_at` → `created_at` | `is_deleted = false` → `IS DISTINCT FROM true` | `generate_series` para períodos sin contenido (muestra 0 en vez de omitir) |
| `user_content_growth_cumulative_by_period` | `published_at` → `created_at` | `IS DISTINCT FROM true` | Campo renombrado `cumulative_contents` → `cumulative_total` para coincidir con el frontend |
| `user_content_growth_rate_by_period` | `published_at` → `created_at` | `IS DISTINCT FROM true` | Campo `growth_rate` agregado al resultado (antes no existía — causaba KPI en "—") |
 
### 5.3 Impacto
 
- Gráfica "Evolución de contenidos" — ahora muestra los 19 contenidos distribuidos correctamente con ceros en períodos vacíos
- Gráfica "Crecimiento acumulado" — ahora muestra la curva acumulativa correcta
- KPI "Tasa de crecimiento" — ahora calcula y muestra el porcentaje de cambio semana a semana
Aplica para todos los usuarios — no solo para el usuario de desarrollo.
 
---
 
## 6. Identity — Fixes de IA
 
### 6.1 Insights en inglés para usuarios en español
 
**Causa:** el caché de `identity_insights_cache` guardó resultados en inglés antes de que la lectura de `preferred_language` estuviera funcionando correctamente. El caché de 24h seguía sirviendo el resultado incorrecto.
 
**Fix:**
- `DELETE FROM identity_insights_cache` — forzar regeneración para todos los usuarios
- Campo `user_lang` agregado al caché — si el idioma del usuario cambia, el caché se invalida
- Migración: `ALTER TABLE identity_insights_cache ADD COLUMN user_lang TEXT DEFAULT 'en'`
### 6.2 Sección "Vale la pena reflexionar" vacía
 
**Causa:** las cuatro condiciones del endpoint `me-creative-insights` eran demasiado estrictas:
- `ALL_ROLES` no incluía `"sales"` — todos los roles estaban cubiertos, `missingRoles` vacío
- Condición de concentración `dominant.length <= 3` fallaba con 6 temas dominantes
**Fix en `me-creative-insights/index.ts`:**
 
```typescript
// Agregar sales a los roles esperados
const ALL_ROLES = ["educational", "inspirational", "personal",
                   "promotional", "curated", "sales"];
 
// Relajar condición de concentración
// Antes: dominant.length <= 3 && pct > 70
// Después: pct > 60
if (dominant.length > 0 && pct > 60) { ... }
```
 
---
 
## 7. Mejora pendiente — anotada para fase de pulido
 
**Cambio de idioma no actualiza resultados de IA:** al cambiar EN/ES en el switch del header, los textos generados por IA (`standout_insights`, `creative_style_tags`, informe creativo, `me-creative-insights`) siguen en el idioma anterior hasta que expira el caché. Requiere invalidación del caché al cambiar idioma + evento que dispare regeneración en background. Se resuelve junto con la personalización de timezone por usuario antes del lanzamiento general.
 
---
 
## 8. Estado del sistema post-v7
 
| Área | Estado |
|---|---|
| Ideas y Temas | Múltiples briefs por idea, lista compacta, sin reloads innecesarios |
| Briefs | Flujo completo: generar → revisar → aprobar → convertir → descargar → archivar |
| Ideas archivadas | Pestaña dedicada con restauración |
| Actividad | Las 3 gráficas y el KPI de tasa de crecimiento funcionan correctamente |
| Identity — IA | Insights en español, sección "Vale la pena reflexionar" activa |
 
---
 
## 9. Roadmap Activo — Fases Pendientes
 
| Estado | Área | Cambio | Prioridad |
|---|---|---|---|
| 📋 PENDIENTE | Pulido | Cambio de idioma invalida caché de IA y regenera en background | Alta — antes del lanzamiento |
| 📋 PENDIENTE | Pulido | Timezone por usuario en funciones de crecimiento | Alta — antes del lanzamiento |
| 📋 PENDIENTE | Admin | Editor de prompts — migrar system prompts a tabla `system_prompts` | Media |
| 📋 PENDIENTE | Fase 4 | Insights automáticos v2 — señales detectadas sin acción del creador | Alta |
| 📋 PENDIENTE | Fase 5 | Informe Creativo — narrativa profunda bajo demanda con Claude + web search | Media |
| 📋 PENDIENTE | Fase 6 | Content System View — vista de conjuntos idea + topics + contenidos | Media |
| 📋 PENDIENTE | Fase 7 | Pulido y lanzamiento — primer batch de early adopters | Alta |
| 📋 PENDIENTE | Feature | DNA Snapshots — fotografía del DNA en un momento dado | Backlog |
| 📋 PENDIENTE | Feature | Perfil de usuario en UI — language, country, timezone, role | Backlog |
| 📋 PENDIENTE | Feature | Tags — sprint dedicado con modelo completo | Backlog |
| 📋 PENDIENTE | Arquitectura | SECURITY DEFINER views → SECURITY INVOKER (40+ vistas) | Deuda técnica |
| 📋 PENDIENTE | Auth | Leaked password protection — habilitar en Supabase Dashboard | Configuración |
 
---
 
*Content Intelligence Platform · Changelog v7.0 · Tag v1.5.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*
 