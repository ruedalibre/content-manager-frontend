# Changelog v30 - v2.12.0 (app)

## Gating de workspaces por plan + Fix de idioma centralizado + Rediseno de guardado en Perfil

**Fecha:** Agosto 2026
**Version:** v2.12.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva real (gating de workspaces por plan, pieza final de Workspaces v3.0), mas correccion de bugs de produccion y mejoras de UX

---

## Contexto

Cierre de la ultima pieza critica del Roadmap 2026 v4.0 antes de la fecha limite del 23 de agosto: el gating de workspaces por plan, que protege a los 4 usuarios piloto (y a cualquier Creator futuro que deje de pagar) de perder acceso sin aviso a sus workspaces adicionales. La implementacion revelo y corrigio, de paso, los 5 Edge Functions de colaboracion pendientes desde Phase 3.5, ademas de 3 bugs de produccion descubiertos durante pruebas reales.

---

## Bloque 1 - Gating de workspaces por plan (funcionalidad nueva)

### Diseno

Regla unica: cuando `plan != 'creator'`, todo workspace donde `is_personal = false` pasa a modo solo lectura (visible, historial intacto, sin poder crear/editar). El Workspace Personal nunca se afecta. La regla se basa solo en el estado actual del plan, sin necesidad de recordar historial de pagos - aplica igual a un Creator que dejo de pagar que a un usuario piloto al que se le revoca el acceso manual.

**Redireccion automatica - solo al aterrizar, no en cada navegacion:** si el workspace activo guardado ya no es valido al cargar la app, se redirige una unica vez al Personal (via `useRef` como bandera de "ya verificado"). Si el usuario, despues, navega deliberadamente a un workspace bloqueado desde el selector, se le permite entrar en modo lectura sin volver a expulsarlo - decision explicita para honrar "el creador puede seguir viendo su contenido".

### Backend - 5 Edge Functions corregidas en una sola pasada

`update-idea`, `delete-idea`, `archive-idea`, `update-idea-topics`, `update-creative-session` - las mismas 5 funciones identificadas desde Phase 3.5 como pendientes de migrar de `tenant_id`/`user_id` a `workspace_id`. Se resolvio el fix base de colaboracion y se agrego el gating de plan en la misma pasada por cada funcion, evitando tocarlas dos veces.

Cada funcion ahora: verifica membership + `is_personal` en una sola consulta con join, bloquea el rol `viewer` para escritura, y si el workspace no es personal, verifica `subscriptions.plan === 'creator'` antes de permitir la mutacion. Respuesta de error estandarizada a `{ error: "workspace_read_only" }` (codigo corto, sin texto), dejando que el frontend resuelva el mensaje completo via i18n segun el idioma del usuario - decision tomada explicitamente para no acoplar el backend a un idioma o redaccion especifica.

**Hallazgos adicionales corregidos de paso:**
- `delete-idea`: el orden de operaciones era inseguro - borraba asociaciones (`content_creative_units`, `idea_topics`, `creative_sessions`) antes de verificar que la idea perteneciera al workspace del usuario. Corregido: verificacion de pertenencia primero, mutaciones despues.
- `delete-idea` y `update-creative-session`: ambas seguian filtrando por `user_id` en operaciones de borrado/actualizacion, rompiendo colaboracion real (un miembro del workspace no podia borrar sesiones o ideas generadas por otro). Removido el filtro - ahora cualquier miembro del workspace puede operar sobre datos compartidos del workspace, sin importar quien los creo.
- `update-creative-session`: al no tener `workspace_id` directo en su tabla, se resuelve via join `creative_sessions -> creative_units.workspace_id`.

### Frontend

- `AppLayout.tsx`: `useEffect` de redireccion con bandera `hasCheckedInitialGating` (useRef)
- `WorkspaceSelector.tsx`: icono de candado en cada workspace bloqueado (`Lock`, Lucide), tooltip explicativo, clic segue permitido (no bloqueado) para navegacion deliberada
- `WorkspaceSelector.scss`: modificador `--readonly`, nueva clase `.workspace-selector__lock`

---

## Bloque 2 - Bugs de produccion descubiertos durante pruebas reales

### Bug 1 - archivar/borrar ideas fallaba con 400 en cualquier workspace

Tras desplegar el Bloque 1, archivar o borrar cualquier idea (en workspace personal o no) fallaba. Causa: `useIdeas.ts` nunca se actualizo para enviar `workspace_id` en las 9 llamadas a las 5 funciones recien modificadas - el backend ya lo exigia, el frontend seguia sin mandarlo. Corregido: `workspace_id` agregado al body (o como query param en el caso de `deleteIdea`, unico `DELETE`) en las 9 llamadas.

### Bug 2 - lista de ideas archivadas no se actualizaba al cambiar de workspace

La pestana "Archivadas" mostraba las ideas del primer workspace visitado, sin importar a cual workspace se cambiara despues. Causa: el `useEffect` que dispara la carga solo dependia de `[activeTab]`, no de `currentWorkspaceId` - se disparaba al cambiar de pestana, pero no al cambiar de workspace estando ya parado en esa pestana. Corregido agregando `currentWorkspaceId` a las dependencias.

### Bug 3 - contador de ideas archivadas mezclaba todos los workspaces

El badge numerico junto a la pestana "Archivadas" mostraba un conteo que no cambiaba entre workspaces. Causa mas profunda que el Bug 2: una consulta directa a Supabase en `Ideas.tsx` (fuera del hook `useIdeas`) filtraba por `tenant_id` en vez de `workspace_id`, y su `useEffect` tenia `[]` como dependencias (solo se ejecutaba al montar el componente). Corregido: filtro cambiado a `workspace_id`, dependencias actualizadas a `[currentWorkspaceId]`, y se elimino la resolucion innecesaria de `tenant_id` que ya no hacia falta.

---

## Bloque 3 - Idioma centralizado en Perfil (fix de arquitectura)

Reportado durante pruebas del gating: las ideas sugeridas por IA salian en el idioma correcto (ingles, segun el perfil real del usuario), pero el resto de la interfaz se mostraba en espanol - una desincronizacion entre 2 fuentes de verdad del idioma que coexistian sin comunicarse.

### Diagnostico

`LanguageToggle.tsx`, usado dentro de `Profile.tsx`, persistia el cambio de idioma **inmediatamente al hacer clic**, sin pasar por el boton "Guardar" del formulario - a diferencia de todos los demas campos de Profile, que si respetaban el patron de edicion local + guardado explicito. Ademas, la sincronizacion de `i18n.changeLanguage()` con el perfil real solo ocurria mientras el componente `LanguageToggle` estaba montado en pantalla (es decir, solo dentro de la pagina de Perfil) - en cualquier otra pagina de la app, el idioma visual dependia de lo ultimo guardado en `localStorage`, sin relacion con el perfil.

**Contexto de decision previa confirmado:** en una sesion anterior ya se habia decidido eliminar el toggle de idioma expuesto en el header/login de la app autenticada, dejando el cambio de idioma centralizado exclusivamente en Profile - `LanguagePublicToggle` (usado en Login/UpdatePassword, paginas sin sesion) ya seguia ese criterio correctamente, cambiando solo el idioma de esa sesion publica sin persistir nada.

### Fix

- `LanguageToggle.tsx` convertido a componente controlado (`value`/`onChange`), sin logica propia de persistencia ni lectura de perfil
- `Profile.tsx`: el toggle ahora se conecta al `form` local; la persistencia real ocurre unicamente dentro de `handleSave` (que ya tenia la logica lista, pero desconectada del componente en pantalla)
- `AppLayout.tsx` (`AppLayoutContent`): nuevo `useEffect` que sincroniza `i18n.changeLanguage()` con `profile.preferred_language` a nivel global, cada vez que el perfil carga o cambia - efectivo en toda la app, no solo en Profile

### Confirmado, no un bug - separacion entre idioma de interfaz y contenido generado

Se verifico que los briefs ya generados no se ven afectados por cambios posteriores de idioma en el perfil: `generate-recipe` lee el idioma en el momento exacto de la generacion y el resultado queda fijo como texto en `creative_sessions.recipe`. Un creador bilingue puede generar briefs en distintos idiomas segun su preferencia del momento, sin que cambios futuros de idioma "retraduzcan" contenido historico - comportamiento ya correcto sin necesidad de cambios adicionales.

---

## Bloque 4 - Rediseno del guardado en Perfil (UX)

La barra de progreso de completitud y el boton "Guardar" vivian al final de una pagina larga, poco visibles mientras el usuario editaba secciones mas arriba.

### Diseno final

Barra de progreso y boton "Guardar" combinados en un contenedor `sticky`, fijo justo debajo del header al hacer scroll, con separacion horizontal clara entre ambos elementos (para no leerse como relacionados) y la barra de progreso en su propia tarjeta visualmente diferenciada del fondo.

### Iteracion tecnica (documentada por su valor de aprendizaje)

1. **Intento 1:** `position: sticky` con `background` propio en el contenedor de la barra - fuga visual, el contenido de secciones inferiores se veia "pasar" a traves de un hueco durante el scroll.
2. **Causa real:** `.app-layout__main` (el contenedor real con `overflow-y: auto`) tiene `padding: 1.5rem` en sus 4 lados. El wrapper sticky vivia dentro de ese padding, sin cubrir el area exacta por donde se filtraba el contenido inferior al hacer scroll.
3. **Intento 2:** margenes negativos (`margin: -1.5rem -1.5rem 0 -1.5rem`) para que el wrapper "coma" el padding del contenedor padre, extendiendo su `background` hasta el borde real visible - efectivo, pero un cambio estructural intermedio dejo temporalmente **todas** las secciones del formulario anidadas dentro del wrapper sticky (cierre de `</div>` mal ubicado), causando que toda la pagina se moviera como un bloque unico en vez de solo la barra. Corregido reubicando el cierre del wrapper inmediatamente despues de la barra y el mensaje de error, antes de las 4 secciones del formulario.
4. **Ajuste final:** wrapper exterior con `background: var(--bg-canvas)` (fondo real de pagina, mas preciso que la superficie elevada usada inicialmente) conteniendo una barra interior con su propio `background: var(--bg-surface)`, borde y radio, dandole presencia de tarjeta diferenciada.

---

## Testing / Verificacion

- Gating verificado con cuenta Creator (sin regresion) y simulando plan `free` en un workspace no-personal: redireccion automatica al aterrizar, candado visible, navegacion deliberada permitida en modo lectura, mutaciones rechazadas con `workspace_read_only`
- Colaboracion verificada: un miembro del workspace puede calificar/aprobar/borrar sesiones y borrar ideas generadas por otro miembro
- Los 3 bugs de produccion verificados resueltos con pruebas reales de archivar/borrar/cambiar de workspace
- Sincronizacion de idioma verificada de punta a punta: cambio en Profile con boton Guardar, reflejado inmediatamente en toda la app sin necesidad de recargar
- Scroll de Perfil verificado sin fugas visuales tras la iteracion completa de CSS

---

## Operacional

Git tags: v2.12.0 en frontend y backend.

Deployment: `update-idea`, `delete-idea`, `archive-idea`, `update-idea-topics`, `update-creative-session` redeployed. Multiples despliegues incrementales de frontend durante la sesion.

---

Estado: v2.12.0 completada. Ultima pieza critica de Workspaces v3.0 para Acto 1 cerrada antes de la fecha limite del 23 de agosto. Los 5 Edge Functions de colaboracion pendientes desde Phase 3.5 quedan resueltos como efecto colateral positivo del mismo trabajo. Sistema de idioma consolidado en una unica fuente de verdad (perfil, con guardado explicito). Experiencia de guardado en Perfil mejorada con patron sticky, documentando una iteracion de CSS con 2 causas raiz distintas para referencia futura.