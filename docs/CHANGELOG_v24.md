# Changelog v24 — v2.7.1 (app)

## Fixes post-Phase 3.5 — Ideas: create-idea, generate-ideas, duplicateIdea

**Fecha:** Julio 2026
**Versión:** v2.7.1 (frontend + backend)
**Tipo:** Patch — corrección de bugs, sin funcionalidad nueva
**Objetivo:** Corregir 3 consumidores de Ideas que quedaron sin actualizar durante Phase 3.5 porque no correspondían a las páginas principales revisadas, sino a modales y acciones secundarias

---

## Contexto

Tras cerrar Phase 3.5 y su verificación en producción, un usuario reportó que el modal de "Nueva idea" no mostraba sugerencias generadas por IA, y que al intentar crear una idea manual aparecía el error "Error al guardar. Intenta de nuevo.", con el siguiente detalle en consola:

```
{ error: 'new row violates row-level security policy for table "creative_units"' }
```

Investigación posterior confirmó 2 Edge Functions sin actualizar y 1 función del hook `useIdeas.ts` que dependía de una de ellas.

---

## Causa raíz

El mapeo original de Phase 3.5 se hizo por **página principal** (Ideas.tsx, Contents.tsx, Activity.tsx, Identity.tsx), no por **acción específica** dentro de cada página. `create-idea` y `generate-ideas` se disparan desde `CreateIdeaModal.tsx` — un modal que se abre desde Ideas.tsx pero que nunca se revisó como consumidor independiente durante el barrido de Phase 3.5.

---

## Fix 1 — `create-idea`

**Problema:** el INSERT a `creative_units` no incluía `workspace_id`, violando la política RLS `creative_units_insert_workspace` creada en Phase 2 — bloqueaba la creación de cualquier idea manual para todos los usuarios.

**Cambios:**
- `workspace_id` ahora requerido en el body (400 si falta)
- Verificación de membership vía `workspace_members`, con bloqueo explícito para rol `viewer`
- El INSERT incluye `workspace_id` junto con `tenant_id` (este último se conserva por constraint NOT NULL del schema, aunque el scope funcional real es `workspace_id`)

---

## Fix 2 — `generate-ideas`

**Problema:** la función llama internamente a `content-dna` (vía `supabase.functions.invoke`) sin pasar `workspace_id` — parámetro que `content-dna` ya exigía desde Phase 3.5 (Bloque 4a). La llamada interna fallaba con `400 Missing workspace_id parameter`, y como el frontend capturaba el error silenciosamente, el resultado visible era simplemente "no aparecen sugerencias", sin mensaje de error para el usuario.

**Cambios:**
- `workspace_id` ahora requerido como query parameter
- Verificación de membership
- La llamada interna a `content-dna` ahora incluye `workspace_id`
- La consulta de ideas existentes (usada para evitar sugerencias duplicadas) cambió de `.eq("tenant_id", ...)` a `.eq("workspace_id", ...)`

**Nota técnica:** la llamada a `content-dna` usa `supabase.functions.invoke()` con el nombre de función más el query string concatenado (`content-dna?workspace_id=${workspace_id}`), en vez de `fetch()` directo como el resto del código. Funciona porque el SDK construye la URL a partir del string completo, pero es un patrón distinto al resto del proyecto — candidato a normalizar en limpieza técnica futura si genera algún problema.

---

## Fix 3 — `duplicateIdea` (frontend, `useIdeas.ts`)

**Problema:** la función llama a `create-idea` (ya corregida en el Fix 1) sin incluir `workspace_id` en el body — el botón "Duplicar idea" en `Ideas.tsx` habría empezado a fallar con el mismo error 400 que `create-idea` en cuanto se desplegara el Fix 1, aunque nadie lo había reportado todavía por ser una acción menos usada.

**Cambios:**
- Guard agregado: lanza error explícito si `workspaceId` no está disponible
- `workspace_id` agregado al body de la llamada a `create-idea`

---

## Frontend — `CreateIdeaModal.tsx`

- Import de `useWorkspace()`, obtención de `currentWorkspaceId`
- Carga de sugerencias (`generate-ideas`): guard por `currentWorkspaceId`, `workspace_id` agregado a la URL, agregado a las dependencias del `useEffect`
- Submit (`create-idea`): guard antes de enviar, `workspace_id` agregado al body

---

## Verificación en producción

- ✅ Modal de "Nueva idea" muestra sugerencias generadas por IA correctamente
- ✅ Crear idea manual ya no produce error de RLS
- ✅ Crear idea desde una sugerencia (`source: "generated"`) funciona correctamente
- ✅ Idea creada en un workspace queda aislada — no aparece en otros workspaces del mismo usuario
- ✅ Duplicar idea funciona sin error, la copia queda en el mismo workspace que la idea original

---

## Hallazgos adicionales durante la investigación — sin fix aplicado

Como parte de la búsqueda de más consumidores potencialmente afectados, se revisaron 7 Edge Functions adicionales relacionadas con Ideas. Resultado:

### Pendiente para antes de Acto 2 (no urgente, documentado en instrucciones del proyecto)

`update-idea`, `delete-idea`, `archive-idea`, `update-idea-topics`, `update-creative-session` siguen filtrando por `tenant_id`/`user_id` en vez de `workspace_id`. Sin síntoma visible hoy porque cada workspace tiene exactamente 1 usuario — el problema solo se manifestaría cuando dos usuarios distintos compartan un workspace (Acto 2). `delete-idea` y `update-creative-session` tienen el riesgo más concreto: podrían dejar registros huérfanos o devolver 404 si un miembro del workspace intenta operar sobre un recurso creado por otro miembro.

### Confirmado como código muerto (sin consumidores en frontend)

- **`strategy-insights`** — el hook `useStrategyInsights.ts` existe pero ningún componente lo importa. Consulta 4 vistas SQL (`user_content_dna`, `tenant_content_engines`, `tenant_top_content_engine`, `idea_content_engines`) que sí tienen datos reales y actualizados — se recalculan al vuelo desde `contents`/`creative_units` — pero todas filtran por `tenant_id`, sin scope de workspace. Se suma a `me-contents` y `me-contents-reusable` como candidatas a limpieza técnica futura.

### Sin cambios necesarios

`regenerate-aspect` — no consulta `creative_units`/`contents` directamente, opera solo sobre el contexto que el frontend ya le provee. No requiere `workspace_id`.

---

## Operacional

**Git tags:**
- Frontend: `v2.7.1`
- Backend: `v2.7.1`

**Deployment:**
- `create-idea` — redeployed
- `generate-ideas` — redeployed
- Frontend — Vercel redeploy (`CreateIdeaModal.tsx`, `useIdeas.ts`)

---

**Estado:** v2.7.1 completada. Los 3 puntos de entrada de Ideas afectados por el gap de mapeo de Phase 3.5 quedan corregidos y verificados en producción. Los 5 casos de colaboración pendientes y las 3 piezas de código muerto quedan documentados explícitamente en las instrucciones del proyecto para su resolución en el momento correspondiente del roadmap.