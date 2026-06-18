# Creadora
## Changelog de Desarrollo — v13.0
**Brief Flow Redesign, Idea Duplication, Audit v2 & Bug Fixes · Junio 2026 · Uso interno**

---

## 1. Propósito de este documento

Este documento registra todos los cambios implementados después del CHANGELOG_v12 (v2.0.0). Cubre el rediseño completo del flujo del brief (calificación → aprobación → creación de contenido), la duplicación de ideas, la segunda auditoría del sistema, y una serie de bugs resueltos derivados del uso en producción.

Documentos de referencia previos:
- CHANGELOG_v12 — User Research Fixes, UX Improvements, Tour Redesign & Copy Updates
- CHANGELOG_v11 — Past Due Banner, Cache Invalidation, Timezone Fix, Landing Polish & OG Image
- AUDIT_v2_Junio2026 — Segunda auditoría del sistema (backend + frontend)

**Tag de versión:** `v2.1.0`

---

## 2. Resumen ejecutivo

| 1 Auditoría completada | 8 Bugs resueltos | 3 Features nuevas | 2 Mejoras UX |
|---|---|---|---|

---

## 3. Auditoría del sistema v2

Segunda auditoría ejecutada con Claude Code sobre los repos backend (68 Edge Functions) y frontend app (90 archivos). La landing fue excluida — en proceso de rediseño.

**Resultado:** 0 críticos, 1 importante, 10 mejoras. El sistema está en buen estado arquitectónico. Los patrones de seguridad establecidos en v1 se mantienen en todo el codebase.

### 3.1 Hallazgo importante resuelto — B-01

**Problema:** `content_role` estaba ausente del `combination_hash` en `generate-recipe`. Consecuencia: el sistema detectaba como duplicado un brief con la misma plataforma y formato pero diferente rol, devolviendo el brief anterior en lugar de generar uno nuevo.

**Fix:** agregar `|${content_role ?? ""}` al `combinationString`.

**Archivo afectado:** `supabase/functions/generate-recipe/index.ts`

### 3.2 Mejoras de auditoría — pendientes para próximo ciclo

| # | Hallazgo | Archivo |
|---|---|---|
| B-02 | CORS incompleto en `admin-users-summary` | `admin-users-summary/index.ts` |
| B-03 | Soft delete no null-safe en `me-dashboard` | `me-dashboard/index.ts` |
| B-04 | `catch {}` silencia errores en `me-dashboard` | `me-dashboard/index.ts` |
| B-05 | HTTP 500 en error de cliente en `create-content` y `me-*` | Varias funciones |
| B-06 | Dead code `apiKey` en `generate-recipe` | `generate-recipe/index.ts` |
| B-07 | Sin `tenant_id` en update de `update-creative-session` | `update-creative-session/index.ts` |
| F-01 | Colores Tailwind hardcodeados en `LanguageToggle.scss` | `LanguageToggle.scss` |
| F-02 | Color destructivo hardcodeado en `Contents.scss` | `Contents.scss` |
| F-03 | Placeholders en inglés en `EditIdeaModal.tsx` | `EditIdeaModal.tsx` |
| F-04 | Días de semana en inglés en `ActivityHeatmap.tsx` | `ActivityHeatmap.tsx` |

---

## 4. Rediseño del flujo del brief

El flujo completo de brief fue rediseñado para establecer una secuencia clara e irreversible: calificar → aprobar → crear contenido → ver contenido.

### 4.1 Flujo nuevo — comportamiento completo

1. El creador genera el brief y ve las secciones con emojis de calificación disponibles
2. Califica cada sección (1-5). Las calificaciones ≥4 en todas las secciones habilitan el botón "Aprobar"
3. Al aprobar: los emojis quedan bloqueados, el botón "Aprobar" muestra "✓ Aprobado" y se desactiva permanentemente
4. El botón "Crear contenido" se activa solo tras la aprobación
5. Al crear contenido: se crea el registro directamente en la lista de contenidos en estado `draft`, sin modal intermedio. Aparece un toast "Contenido creado". El botón muta a "Ver contenido"
6. "Ver contenido" navega a `/contents?edit=<id>` y abre el modal de edición del contenido específico
7. El estado es irreversible — no se puede reactivar "Crear contenido" modificando calificaciones

### 4.2 Cambios implementados

| Área | Cambio |
|---|---|
| `RecipePanel.tsx` | Estado `alreadyConverted` inicializado desde `session.status === "executed"`, emojis bloqueados tras aprobación, botón muta entre "Crear contenido" / "Ver contenido", toast de confirmación |
| `Ideas.tsx` | `createContentFromBrief` — llama a `create-content` con `session_id`, elimina modal intermedio `CreateContentModal`, `handleViewContent` navega a `/contents?edit=<id>` |
| `create-content/index.ts` | Acepta `session_id` — al crear el contenido actualiza `creative_sessions` con `content_id` y `status: "executed"` |
| `RecipePanel` props | `onCreateContent` cambió de `() => void` a `() => Promise<string>`, nueva prop opcional `onViewContent?: (contentId: string) => void` |
| i18n | Clave `recipe.viewContent` agregada en ES y EN |

### 4.3 Eliminación del modal de creación desde brief

El `CreateContentModal` como paso intermedio al crear contenido desde un brief fue eliminado. El modal no aportaba valor — las participantes lo abrían, reconocían que la información estaba prellenada y presionaban crear para cerrar el trámite.

Los campos "ubicación" y "reutilizable" se acceden ahora desde el modal de edición en la página de Contenidos.

---

## 5. Bugs resueltos

### 5.1 Temas no se copiaban al crear contenido desde brief

**Problema:** al crear contenido desde un brief, el registro en Contenidos aparecía sin los temas de la idea original, obligando al creador a agregarlos manualmente.

**Fix:** en `create-content`, después de insertar en `content_creative_units`, leer los temas de la idea desde `idea_topics` e insertarlos en `content_topics`.

**Archivo afectado:** `supabase/functions/create-content/index.ts`

---

### 5.2 Brief huérfano al borrar contenido

**Problema:** al borrar un contenido creado desde un brief, el brief quedaba en estado `executed` con `content_id` apuntando a un registro eliminado. El botón "Ver contenido" del brief dejaba de funcionar y no había forma de crear el contenido de nuevo.

**Fix en dos partes:**

**Backend:** antes del soft delete en `delete-content`, verificar si existe una `creative_session` vinculada al contenido y revertirla a `status: "reviewed"` con `content_id: null`.

**Frontend:** `me-contents-history` ahora retorna `has_session: boolean` por cada contenido. El modal de confirmación de borrado muestra un mensaje especial cuando `has_session === true`, explicando que el brief volverá a estar disponible.

**Archivos afectados:** `delete-content/index.ts`, `me-contents-history/index.ts`, `Contents.tsx`, i18n.

---

### 5.3 N1 — Calificación no se actualizaba al elegir alternativa

**Problema:** al presionar "Usar este" en una alternativa del brief, la calificación del aspecto no se actualizaba. El creador quedaba conforme con la alternativa pero el aspecto seguía con calificación baja, bloqueando la aprobación.

**Fix:** en `handleChooseAlternative` de `RecipePanel.tsx`, setear `feedback[aspectKey] = 4` automáticamente al elegir una alternativa.

**Archivo afectado:** `RecipePanel.tsx`

---

### 5.4 Toast de error de duplicación no desaparecía

**Problema:** el toast de error al fallar la duplicación de una idea quedaba fijo en pantalla indefinidamente — solo desaparecía si el usuario hacía clic en él.

**Fix:** agregar `setTimeout(() => setActionError(null), 3000)` en el catch de `handleDuplicateIdea`.

**Archivo afectado:** `Ideas.tsx`

---

### 5.5 Constraint de unicidad bloqueaba duplicación de ideas

**Problema:** `creative_units` tiene un índice único `(tenant_id, title)`. Al intentar duplicar una idea, el insert fallaba con `23505 duplicate key value violates unique constraint "unique_idea_per_tenant"`.

**Fix:** agregar el sufijo `" (copia)"` al título en `duplicateIdea` antes de enviarlo al endpoint.

**Archivo afectado:** `useIdeas.ts`

---

### 5.6 Constraint de uniqueness ignoraba `content_role` en briefs

Ver sección 3.1 — resuelto como parte de la auditoría v2.

---

## 6. Features nuevas

### 6.1 Duplicación de idea

Nueva acción disponible en cada idea card. Permite crear una copia de una idea conservando título, descripto y temas. La copia nace como entidad independiente con nuevo UUID, sin briefs, lista para generar una nueva combinación.

El título de la copia recibe el sufijo `" (copia)"` para diferenciarse de la original y evitar la constraint de unicidad.

**Comportamiento:**
- La validación de combinación duplicada no aplica entre ideas distintas — el creador puede generar el mismo brief en la copia sin restricciones
- La combinación (plataforma, formato, rol) no se copia — nace vacía para que el creador elija una nueva
- Los temas sí se copian — se insertan en `idea_topics` en el mismo request de creación

**Archivos afectados:** `create-idea/index.ts` (soporte para `topic_ids`), `useIdeas.ts` (`duplicateIdea`), `Ideas.tsx` (botón ⧉ en controles de la card), i18n (`ideas.duplicate`).

---

### 6.2 Modal de borrado especial para contenidos con brief

Cuando el creador intenta borrar un contenido que fue creado desde un brief, el modal de confirmación muestra un mensaje específico explicando que el brief volverá a estar disponible. El flujo de borrado normal no cambia para contenidos creados manualmente.

**Archivos afectados:** `Contents.tsx`, i18n.

---

### 6.3 Toast de confirmación al crear contenido desde brief

Al presionar "Crear contenido" en el panel del brief, aparece un toast verde con el texto "Contenido creado" durante 3 segundos. Resuelve la ambigüedad visual de que el botón cambia de texto pero el color permanece igual.

**Archivo afectado:** `RecipePanel.tsx`

---

## 7. Decisiones de producto documentadas

### 7.1 Combinación no se copia al duplicar idea

Se evaluó si la duplicación debería pre-llenar la combinación (plataforma, formato, rol) de la idea original. Se decidió no hacerlo — el creador puede seleccionarla en segundos y el propósito de la duplicación es explorar una combinación diferente, no repetir la misma.

### 7.2 Modal de creación desde brief eliminado definitivamente

El `CreateContentModal` como paso intermedio se eliminó sin reemplazo. Los campos "ubicación" y "reutilizable" quedan en el modal de edición de la página de Contenidos, que es donde tienen sentido conceptualmente — son datos sobre el contenido ya creado, no sobre su creación.

---

## 8. Backlog activo (no implementado en esta versión)

| Item | Descripción | Origen |
|---|---|---|
| N9 | Extensiones de traducción del navegador rompen la UI — pendiente de identificar términos específicos afectados | Entrevistas de usuario |
| V4 | Micro-copy campo Ubicación + label "Ubicación de almacenamiento" | Rediseño modal de edición |
| A3/N7 | Tooltips contextuales — estrategia de implementación pendiente | Implementación anterior generó problemas |
| N8 | Dos combinaciones iguales comparten temas | Solo si se reproduce en producción |
| B-02 a B-07 | Mejoras de auditoría backend | AUDIT_v2_Junio2026 |
| F-01 a F-04 | Mejoras de auditoría frontend | AUDIT_v2_Junio2026 |

---

_Creadora · Changelog v13.0 · Junio 2026_
_Documento vivo. Actualizar tras cada ciclo de desarrollo._