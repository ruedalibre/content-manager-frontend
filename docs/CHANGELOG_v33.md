# Changelog v33 - v2.15.0 (app)

## Edicion y archivado de workspaces + Hallazgo critico de RLS

**Fecha:** Agosto 2026
**Version:** v2.15.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva (CRUD completo de workspaces), mas hallazgo y correccion de una politica de seguridad de base de datos faltante

---

## Contexto

Cierre de la ultima pieza pendiente del trabajo de contexto de workspace: hasta ahora solo era posible crear un workspace, sin forma de editar su nombre/contexto despues, ni de archivarlo si dejaba de ser relevante. Este ciclo completa el CRUD, y en el proceso revela un hallazgo de seguridad real: la tabla `workspaces` tenia RLS habilitado con una unica politica de SELECT, sin ninguna politica de UPDATE - un vacio que llevaba desde el diseño original de la tabla sin manifestarse porque nunca antes se habia intentado un UPDATE via el cliente autenticado normal (todo lo previo pasaba por `service_role`, que ignora RLS).

---

## Bloque 1 - Backend: edicion y archivado de workspaces

### Decision de arquitectura: funciones separadas, no una combinada

Siguiendo el precedente ya establecido con `update-idea`/`archive-idea`, se opto por 2 Edge Functions independientes en vez de una sola con logica condicional - preserva consistencia con el patron del proyecto, permite que los permisos diverjan en el futuro sin acoplamiento (hoy ambas exigen rol `owner`, pero podrian evolucionar distinto), y mantiene el `action` de cada entrada de `audit_logs` semanticamente claro desde su origen.

- **`update-workspace`** (nueva): edita `name`, `description`, `referents`, `guidelines`, `workspace_type`. Solo el `owner` del workspace. El nombre del workspace Personal esta protegido explicitamente (no puede cambiarse, ni siquiera se envia al backend si se detecta `is_personal`) - decision del fundador de mantener siempre transparente cual es el workspace por defecto.
- **`archive-workspace`** (nueva): soft-delete via `archived_at` (mismo patron ya establecido con usuarios `deactivated_at` y plataformas `is_active` - nunca se destruye trabajo creativo). El workspace Personal esta protegido de archivarse a nivel de backend, no solo de UI. Soporta restaurar (`archived: false`).

### Migracion `add_workspace_archived_at`

Nueva columna `workspaces.archived_at`.

### Fix en `me-workspaces` - bug real encontrado durante pruebas

Primer intento de filtrar workspaces archivados uso `.is("workspaces.archived_at", null)` sobre una consulta que parte de `workspace_members` (tabla relacionada) - la funcion empezo a devolver un error `TypeError: Cannot read properties of null (reading 'id')` que rompia toda la respuesta, ocultando el `WorkspaceSelector` completo (no solo el workspace archivado). Causa: Postgrest, al filtrar por una columna de tabla relacionada de esta forma, no descarta la fila de `workspace_members` que no cumple - deja la relacion `workspace` en `null`, rompiendo el `.map()` posterior. Corregido filtrando en JavaScript despues de traer los datos (`.filter(row => row.workspace && !row.workspace.archived_at)`), con proteccion adicional contra el caso de `workspace: null` para evitar que el mismo tipo de error vuelva a romper la funcion en el futuro.

---

## Bloque 2 - Hallazgo critico: falta politica de RLS de UPDATE en workspaces

### Sintoma

Al intentar editar un workspace desde el frontend recien construido, la funcion fallaba con `500` y el log revelaba `PGRST116: Cannot coerce the result to a single JSON object` - el UPDATE se ejecutaba pero afectaba 0 filas.

### Investigacion metodica

Se descarto sistematicamente: coincidencia de `created_by` con el usuario real (confirmada correcta), contenido exacto del body enviado (confirmado correcto via logging temporal por pasos), y ejecucion directa del mismo UPDATE via SQL Editor (funciono sin problema, confirmando que la tabla/columnas estaban bien). La causa real se aislo verificando las politicas de RLS existentes: `pg_policies` mostro una unica politica, `workspaces_select_own`, con `cmd: "SELECT"` explicito - sin ninguna cobertura para UPDATE. Con RLS habilitado y sin politica de UPDATE, Postgres aplica deny-all por defecto para esa operacion via el cliente autenticado normal (confirmado con documentacion oficial de PostgreSQL/PostgREST).

### Contradiccion investigada honestamente, no descartada por conveniencia

`archive-workspace` usaba el mismo cliente restringido para su propio UPDATE (`archived_at`), y sin embargo funcionaba - confirmado con evidencia real que el dato SI se persistia en base de datos, no era un exito cosmetico del frontend. Se investigo la causa de esta aparente inconsistencia en vez de ignorarla: la diferencia tecnica identificada es que `archive-workspace` nunca pedia `.select().single()` sobre el resultado (a diferencia de `update-workspace`), evitando el punto especifico donde Postgrest exige que se devuelva exactamente 1 fila - un comportamiento de RLS documentado (via discusion oficial del repositorio de PostgREST) donde un UPDATE bloqueado devuelve una respuesta vacia sin error explicito. Explicacion consistente con toda la evidencia reunida, aunque no verificada con una prueba controlada adicional - documentada con ese nivel de certeza, sin sobre-afirmar.

### Fix

Migracion `add_workspaces_update_policy`: nueva politica `workspaces_update_owner`, permitiendo UPDATE solo cuando el usuario autenticado es `owner` del workspace segun `workspace_members` - misma regla de negocio ya aplicada a nivel de aplicacion en `update-workspace`, ahora tambien exigida de forma independiente por la base de datos.

**Verificado:** edicion de workspace funcional tras aplicar la politica.

---

## Bloque 3 - Frontend: UI de edicion y archivado

- **`WorkspaceSelector.tsx`**: iconos de editar (`Pencil`) y archivar (`Archive`) junto a cada workspace en el dropdown, visibles solo para el `owner` (icono de archivar ademas oculto en el Personal). Truncamiento de nombres largos via CSS (`text-overflow: ellipsis`) en vez de saltos de linea, con los iconos de accion protegidos con `flex-shrink: 0`. Modal de confirmacion antes de archivar, con mensaje tranquilizador explicito de que ideas/contenidos/briefs quedan guardados.
- **`CreateWorkspaceModal.tsx`**: extendido para soportar modo edicion via prop opcional `workspaceToEdit` - reutiliza el mismo formulario completo de creacion, precargado con los valores actuales. Campo de nombre deshabilitado (no oculto) cuando se edita el Personal, con hint explicando por que. El gating de plan Creator (`UpgradePrompt`) solo bloquea creacion, no edicion de un workspace ya existente.
- **`useWorkspace.tsx`**: nuevas funciones `updateWorkspace()` y `archiveWorkspace()` en el Context. `archiveWorkspace()` incluye salvaguarda automatica: si se archiva el workspace actualmente activo, cambia automaticamente al Personal antes de recargar la lista, evitando que el usuario quede "atrapado" viendo un workspace que acaba de desaparecer.

### Bug de UI encontrado y corregido - modal sin createPortal

El modal de confirmacion de archivado se renderizaba anidado dentro del arbol del `WorkspaceSelector`/Sidebar en vez de al nivel raiz de `document.body`, heredando el ancho limitado del sidebar (especialmente severo con el sidebar colapsado, donde el modal quedaba casi completamente aplastado) y estilos de opacidad no intencionados. Corregido envolviendo el modal en `createPortal`, mismo patron ya usado consistentemente en el resto de modales de la aplicacion.

---

## Testing / Verificacion

- Archivado verificado con persistencia real en base de datos (`archived_at` con timestamp confirmado via SQL, no solo cambio cosmetico de UI)
- Edicion verificada funcional tras aplicar la politica de RLS faltante
- `me-workspaces` verificado no rompiendo la lista completa al filtrar archivados
- Modal de confirmacion verificado correctamente centrado en pantalla completa, en ambos estados del sidebar (expandido/colapsado)
- Proteccion del workspace Personal verificada: nombre no editable, opcion de archivar no disponible

---

## Operacional

Git tags: v2.15.0 en frontend y backend.

Migraciones aplicadas: `add_workspace_archived_at`, `add_workspaces_update_policy`.

Deployment: `update-workspace` (nueva), `archive-workspace` (nueva), `me-workspaces` redeployed. Frontend con `WorkspaceSelector.tsx`, `CreateWorkspaceModal.tsx`, `useWorkspace.tsx` actualizados.

---

Estado: v2.15.0 completada. CRUD completo de workspaces (crear, editar, archivar) cierra el ciclo de trabajo de contexto de workspace iniciado en v2.14.0. El hallazgo de la politica de RLS faltante es el tipo de vacio de seguridad que puede pasar desapercibido indefinidamente en un sistema donde la mayoria de operaciones pasan por `service_role` - se investigo con rigor incluyendo una contradiccion aparente entre 2 funciones similares, documentando el nivel de certeza real alcanzado en vez de forzar una conclusion sin evidencia completa.