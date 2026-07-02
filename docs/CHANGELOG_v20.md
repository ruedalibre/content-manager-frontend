# Changelog v20 — v2.6.0

## Workspace Selector UI + Fix crítico de producción

**Fecha:** Julio 2026
**Versión:** v2.6.0 (frontend + backend)
**Objetivo:** Cerrar Phase 3 de Workspaces v3.0 con UI funcional de selección, y resolver un bug crítico que bloqueaba la generación de briefs y creación de contenidos en producción

---

## 🔴 Fix crítico de producción

**Contexto:** tras el despliegue de Phase 2 (RLS + auditoría), las Edge Functions `generate-recipe` y `create-content` pasaron a requerir `workspace_id` como campo obligatorio en el request body. El frontend nunca fue actualizado para enviarlo, dejando ambos flujos completamente rotos para todos los usuarios en producción.

**Síntomas reportados:**
- Generar un brief devolvía `400 — Missing required field: workspace_id`
- Crear contenido devolvía el mismo error
- Tras el primer fix, generar un brief devolvía `403 — Not a member of this workspace` para todos los usuarios, incluso en su propio workspace personal

### Causa 1 — `workspace_id` no se enviaba desde el frontend

Tres puntos de llamada no incluían el campo:
- `useIdeas.ts` → tipo de parámetros de `generateRecipe()` no contemplaba `workspace_id`
- `Ideas.tsx` → `handleGenerateRecipe()` y `createContentFromBrief()` no lo pasaban en el body
- `CreateContentModal.tsx` → `handleSubmit()` no lo pasaba en el body

### Causa 2 — Bug de columna inexistente en `generate-recipe`

La verificación de membership usaba:
```typescript
.from("workspace_members").select("id")...
```

`workspace_members` no tiene columna `id` propia — su primary key es compuesta (`workspace_id`, `user_id`). La query fallaba silenciosamente, devolvía `null`, y el código lo interpretaba como "no es miembro", bloqueando a todos los usuarios sin excepción.

### Fix aplicado

- `useIdeas.ts`: agregado `workspace_id: string` al tipo de `generateRecipe()`
- `Ideas.tsx`: import de `useWorkspace()`, `workspace_id` propagado en `handleGenerateRecipe()` y `createContentFromBrief()`, con guards que evitan disparar el fetch si `currentWorkspaceId` aún no cargó
- `CreateContentModal.tsx`: `useWorkspace()` movido al scope correcto del componente (estaba mal ubicado dentro de `TopicCombobox`, causando errores de compilación), `workspace_id` agregado al body, guard en `handleSubmit()`
- `generate-recipe/index.ts`: cambiado `.select("id")` → `.select("role")` en la verificación de membership

**Impacto:** generación de briefs y creación de contenidos restaurados en producción para todos los usuarios.

---

## Backend — Phase 3

### Edge Functions nuevas

**`me-workspaces`** (GET)
- Lista los workspaces del usuario autenticado, con su rol en cada uno
- Devuelve también `current_workspace_id` desde `user_profiles`

**`switch-workspace`** (POST)
- Recibe `workspace_id`, valida membership, actualiza `user_profiles.current_workspace_id`

**`create-workspace`** (POST)
- Crea un workspace no-personal (`is_personal: false`)
- Inserta membership automática con `role: 'owner'` para el creador
- Registra `audit_logs` con `action: 'create'`, `resource_type: 'workspace'`
- Nota: `resource_type: 'workspace'` no requirió migración de BD — se descubrió durante esta fase que `audit_logs.resource_type` nunca tuvo un CHECK constraint real aplicado, a pesar de estar documentado en el diseño original de Phase 2

---

## Frontend — Phase 3

### Hook `useWorkspace.ts`

- Carga workspaces del usuario vía `me-workspaces`
- Expone `workspaces`, `currentWorkspace`, `currentWorkspaceId`, `switchWorkspace()`, `createWorkspace()`
- `switchWorkspace()` con actualización optimista y rollback en caso de error
- Dispara evento `workspace-switched` en `globalThis` para futura reactividad de otros componentes

### Componente `WorkspaceSelector.tsx`

- Integrado en `Sidebar.tsx`, arriba de la navegación principal
- Estado expandido: botón con icono carpeta + nombre del workspace activo + chevron, dropdown con lista de workspaces y checkmark en el activo
- Estado colapsado: badge circular con icono carpeta, dropdown lateral
- Bloque de "Crear workspace" implementado pero comentado — listo para activar en Phase 3.5 / Acto 2
- Click-outside cierra el dropdown

### Estilos `WorkspaceSelector.scss`

- Tokens Lumen (`--s-*`, `--r-*`, `--fs-*`, `--accent`, `--text-on-primary`)
- Iteración de ajustes visuales durante la sesión:
  - Ancho del trigger igualado al de los ítems de navegación (fix de padding duplicado)
  - Línea divisoria translúcida agregada debajo del selector, separándolo del menú
  - Dropdown corregido para anclarse exactamente al ancho y posición del botón — requirió introducir un wrapper `.workspace-selector__inner` con `position: relative` propio, separado del contenedor exterior que lleva el padding de la línea divisoria (el dropdown se posicionaba relativo al contenedor equivocado, apareciendo desplazado y con ancho incorrecto)

---

## Testing / Verificación

- ✅ Confirmado en BD: query de membership retorna `Personal | owner` para usuario de prueba
- ✅ Generación de brief funcionando en producción tras el fix de `.select("role")`
- ✅ Creación de contenido funcionando en producción
- ✅ Dropdown del selector abre, cierra con click-outside, y selecciona correctamente
- ✅ Estilos verificados visualmente en estado expandido y colapsado del sidebar

---

## ⚠️ Limitación conocida — Phase 3.5 pendiente

El selector de workspace es hoy **funcionalmente cosmético** para cualquier usuario con más de un workspace. Las queries de lectura del frontend (`useIdeas.ts`, y presumiblemente Contents/Identity/Activity) filtran por `tenant_id`, no por `workspace_id` activo. Con 1 workspace por usuario esto es invisible en la práctica, pero romperá en cuanto exista un segundo workspace por usuario — mostraría datos mezclados de todos los workspaces en vez de solo el activo.

No se creó ninguna vía en producción para que un usuario cree un workspace adicional (el bloque de UI está comentado intencionalmente), por lo que este bug no es alcanzable todavía por usuarios reales. Queda documentado como bloqueador explícito antes de activar creación de workspaces.

---

## Operacional

**Git tags:**
- Frontend: `v2.6.0`
- Backend: `v2.6.0`

**Deployment:**
- `generate-recipe` — redeployed (fix de `.select("role")`)
- `create-content` — sin cambios de lógica, ya tenía `.select("role")` correcto
- `me-workspaces`, `switch-workspace`, `create-workspace` — desplegadas desde rama `development`
- Frontend — Vercel redeploy con `WorkspaceSelector` integrado

---

## Notas técnicas para futuras sesiones

- **`workspace_members` no tiene columna `id`** — cualquier query nueva de validación debe usar `.select("role")` u otro campo real, nunca `.select("id")`
- **`audit_logs.resource_type` no tiene CHECK constraint en BD** — la validación de valores permitidos es responsabilidad del código de aplicación, no de la base de datos
- **Phase 3.5 es prerequisito antes de exponer "Crear workspace" al usuario** — sin el filtrado real por `workspace_id` en las queries de lectura, un segundo workspace causaría mezcla de datos visible para el usuario

---

**Estado:** v2.6.0 completada. Producción estable. Workspace Selector visualmente y funcionalmente correcto para el caso de 1 workspace por usuario. Phase 3.5 (filtrado real multi-workspace) queda como bloqueador documentado antes de permitir creación de workspaces adicionales.