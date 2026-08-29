# Changelog v31 - v2.13.0 (app)

## Restriccion de CORS en todo el backend + Extension de trial + 2 bugs criticos de integridad de datos

**Fecha:** Agosto 2026
**Version:** v2.13.0 (frontend + backend)
**Tipo:** Minor - mejora de seguridad significativa (CORS), mas correccion de 2 bugs de integridad de datos descubiertos durante trabajo de producto

---

## Contexto

Revision de un checklist de seguridad aportado externamente motivo un analisis honesto punto por punto contra la arquitectura real de Creadora. De los 9 puntos evaluados, uno se confirmo como hallazgo critico y verificable: CORS configurado con wildcard (`*`) en practicamente todas las Edge Functions. El resto del bloque de trabajo surgio de decisiones de negocio (extension de trial) y de una tarea aparentemente simple de UI (agregar una columna en Admin) que termino revelando un bug de integridad de datos activo desde el diseño original del sistema de ideas.

---

## Bloque 1 - Restriccion de CORS de wildcard a whitelist de dominios

### Analisis del checklist de seguridad

Evaluacion punto por punto contra la arquitectura real: JWT (emision/validacion/expiracion) resulto ser responsabilidad de Supabase Auth, no codigo propio - no accionable directamente. Autenticacion/autorizacion por endpoint se confirmo como punto fuerte, con evidencia de las 5 Edge Functions corregidas para el gating de workspaces en el ciclo anterior. CORS wildcard se confirmo como el unico hallazgo critico verificable con certeza absoluta, dado que aparecia literalmente en cada Edge Function revisada a lo largo de multiples sesiones de trabajo.

### Implementacion

Nuevo archivo `supabase/functions/_shared/cors.ts` con una whitelist de 3 origenes (`https://app.usecreadora.com`, `https://usecreadora.com`, `http://localhost:5173`) y una funcion `getAllowedOrigin()` que valida el header `Origin` de cada request contra la whitelist, en vez de responder `*` a cualquier origen.

**Ejecutado via Claude Code** sobre 71 de 71 Edge Functions, con PR revisado antes de fusionar. Decision tecnica notable: `corsHeaders` se movio de una constante a nivel de modulo hacia dentro del handler (`Deno.serve`), unico lugar donde `req.headers.get("Origin")` esta disponible - verificado explicitamente que el nuevo bloque se calcula antes de la respuesta al preflight `OPTIONS` en las 71 funciones, para no romper CORS en las llamadas reales que siguen.

**Casos especiales manejados manualmente:** `admin-users-list` (estilo de codigo sin punto y coma, sin `Access-Control-Allow-Methods` - hallazgo preexistente, no relacionado, anotado para limpieza tecnica) y `me-dashboard` (comentario `// 🔐 CORS headers` bloqueaba el regex de busqueda automatica).

**Verificacion de build:** 62/71 funciones con `deno check` limpio. 9 fallos investigados y confirmados como preexistentes, no relacionados con el cambio: 2 por errores de tipo genuinos en logica de negocio de `admin-ecosystem` y `admin-profile-stats` (anotados para limpieza tecnica, no bloquean), y 7 por resolucion de paquetes `npm:` (`react`, `@react-email/components`, `resend`) que fallan en `deno check` local pero se resuelven correctamente en el runtime real de Supabase al desplegar - confirmado con evidencia directa (las invitaciones desde `admin-invite-user` seguian llegando bien en produccion durante toda la investigacion) y reproducido el mismo fallo en la rama `development` sin tocar, descartando causalidad del PR.

**Despliegue:** las 71 funciones desplegadas en 4 lotes de ~15-20, con verificacion funcional real entre cada lote (crear/editar contenido, cambiar de workspace, entrar a Activity/Identity/Admin/Perfil) antes de continuar con el siguiente.

**Nota de arquitectura:** `Access-Control-Allow-Methods` se preservo intacto y especifico de cada funcion durante el refactor - deliberadamente no se amplio a un set generico de metodos para evitar aflojar restricciones existentes.

---

## Bloque 2 - Fix de accesibilidad en Login (colateral)

Durante las pruebas del Bloque 1, se detecto en consola un warning de accesibilidad sobre el campo de contraseña, que llevo a una discusion extensa sobre si el valor de la contraseña en texto plano visible en el DOM (via las DevTools) representaba una vulnerabilidad. Conclusion tecnica: no es una fuga de datos - `type="password"` solo enmascara la presentacion visual, nunca el `value` real del DOM, que el navegador necesita para poder enviarlo al hacer submit. La proteccion real de una contraseña vive en 3 capas distintas (memoria local bajo control fisico del usuario, cifrado HTTPS en transito, hash irreversible en reposo en el backend), ninguna de las cuales depende de ocultar el DOM. El mensaje persistente en consola tras cerrar sesion se explico como historial de consola del navegador (no se limpia con navegacion client-side de React Router, solo con un refresh real), no como un dato "vivo" persistiendo en algun lugar.

**Fix aplicado:** `autoComplete` agregado a los 3 campos de `Login.tsx` (email: `"email"`, password: `"current-password"` o `"new-password"` segun el modo login/registro, confirmar contraseña: siempre `"new-password"`) - elimina el warning en su origen.

---

## Bloque 3 - Extension del periodo de acceso gratuito al 18 de octubre

Decision de negocio: el fundador necesita mas tiempo antes de abrir la plataforma al publico general (trabajo pendiente, activacion de Stripe aun bloqueada por definicion de pricing con asesoria contable). Dado que hoy el registro solo ocurre via invitacion (sin flujo de registro publico abierto), la extension aplica de forma segura a todo el universo actual de usuarios sin necesidad de logica condicional adicional.

### Cambios

- `create-user-profile/index.ts`: fecha de corte para nuevos registros movida de `2026-08-23T23:59:59Z` a `2026-10-18T23:59:59Z`
- Actualizacion retroactiva de 25 usuarios existentes en trial (`UPDATE subscriptions SET trial_ends_at = ... WHERE status = 'trialing' AND trial_ends_at < '2026-10-18'`) - identificados 2 sub-grupos con fechas distintas por razones historicas (16 con el corte fijo del 23 de agosto ya hardcodeado en su momento, 9 mas antiguos con 14 dias calculados dinamicamente desde su registro, de antes de que existiera la logica de corte fijo) - ambos cubiertos con un unico UPDATE por rango en vez de coincidencia exacta

### Reversion de usuarios piloto - primera validacion real del gating de workspaces

Los 4 usuarios con acceso piloto manual a workspaces multiples (activado en sesiones anteriores para validacion, con la promesa explicita de ser temporal) fueron revertidos a `plan = 'free', status = 'trialing'`, con la misma fecha de corte extendida. Esta es la primera aplicacion real (no simulada) del sistema de gating de workspaces por plan construido en el ciclo anterior (v2.12.0) - a partir de este cambio, sus workspaces no-personales deberian pasar a modo solo lectura automaticamente la proxima vez que inicien sesion.

---

## Bloque 4 - Triage de 10 tareas nuevas identificadas por el fundador

Revisadas y clasificadas contra el Roadmap 2026 v4.0. La mayoria se distribuyeron en categorias existentes (barrido de i18n, limpieza tecnica, Phase 3.7). Dos hallazgos merecieron atencion inmediata en este mismo ciclo:

### Bug critico confirmado y corregido - nota estrategica del brief mezclaba workspaces

El fundador reporto haber visto, al menos una vez, que la nota estrategica de un brief generado parecia tomar en cuenta contexto de otros workspaces. Investigacion confirmo la sospecha con certeza: `generate-recipe/index.ts` construia el "historial reciente de contenidos" (inyectado directamente en el prompt de generacion) filtrando por `tenant_id`, no por `workspace_id` - arrastrado desde el diseño original de la funcion (previo a Workspaces v3.0) sin haberse migrado durante Phase 3.5. Cualquier brief generado en cualquier workspace del mismo tenant quedaba influenciado por el historial de contenido de todos los demas workspaces del usuario, comprometiendo el aislamiento de contexto entre workspaces.

**Fix:** filtro cambiado de `.eq("tenant_id", tenant_id)` a `.eq("workspace_id", workspace_id)` en la query de historial.

### Tareas consolidadas para el roadmap (sin ejecutar en este ciclo)

- Gestion completa de workspace (editar nombre/contexto + IA usa ese contexto para personalizar generaciones + modal tipo formulario) - fusiona 3 items relacionados: la tarea de "editar/borrar workspace" identificada anteriormente, Phase 3.7 ya existente en el roadmap, y esta nueva peticion
- Traduccion de secciones del brief en descarga/copia (`LABEL_MAP` hardcodeado en ingles)
- Modal de brief a pantalla completa
- Traduccion de opciones de combinacion de ideas + banner "Obtener Creator"
- Metricas de workspaces en Admin
- Boton de audio (texto a voz) para brief - backlog
- Interfaz de Admin separada - ya documentada como decision de arquitectura pospuesta
- Reflexion sobre aprovechamiento de data science con el moat de datos - candidata a documento de vision separado, no item tecnico de roadmap

---

## Bloque 5 - Admin: columna "Ideas" + bug critico de integridad descubierto

### Cambio solicitado

Renombrar "Total de contenidos" a "Contenidos" en la tabla de usuarios activos de Admin, y agregar una columna "Ideas" con el conteo por usuario. Se creo una clave i18n nueva y separada (`admin.colContents`) para el header de la tabla especificamente, en vez de reutilizar la clave `admin.totalContents` que tambien alimenta una tarjeta resumen agregada distinta, evitando un efecto colateral no solicitado.

### Bug descubierto durante la verificacion

Al probar el cambio, el fundador reporto tener ~23 ideas reales pero el conteo en Admin mostraba 0. Investigacion escalonada (fecha de creacion, origen manual vs. generado por IA, distribucion por workspace) revelo la causa real: `create-idea/index.ts` - la funcion principal de creacion manual de ideas, el flujo mas usado del producto - **nunca incluyo `user_id` en su INSERT** desde su diseño original, a diferencia de `create-idea-from-content` (verificada como correcta). Confirmado con evidencia: 99 de 112 ideas totales en la base de datos tenian `user_id NULL`, sin relacion con fecha de creacion, origen (manual/generado), o workspace especifico - consistente con un INSERT incompleto disparandose en cada creacion via ese endpoint especifico, sin importar cuando o donde.

**Fix de codigo:** `user_id: user.id` agregado al INSERT de `create-idea/index.ts`.

**Reconstruccion de datos historicos:** verificado que el modelo actual es 1:1 usuario-tenant (sin tenants compartidos), lo que permitio reconstruir con seguridad las 99 ideas huerfanas via `UPDATE ... FROM public.users WHERE creative_units.tenant_id = users.tenant_id AND user_id IS NULL` - las 99 quedaron correctamente atribuidas, verificado con conteo final en 0 huerfanas restantes.

---

## Testing / Verificacion

- CORS verificado end-to-end en produccion y localhost tras cada uno de los 4 lotes de despliegue
- Extension de trial verificada: 25 usuarios existentes + logica de nuevos registros confirmados con `trial_ends_at` correcto
- Fix de aislamiento de workspace en nota estrategica desplegado, pendiente de validacion organica en proximos briefs generados
- Columna "Ideas" en Admin verificada mostrando el conteo correcto tras el fix y la reconstruccion de datos

---

## Pendiente relacionado

- Limpieza tecnica: `admin-users-list` sin `Access-Control-Allow-Methods`, errores de tipo en `admin-ecosystem`/`admin-profile-stats`, estandarizar `admin-invite-user` (tiene `node_modules` propia, patron distinto al resto)
- Gestion completa de workspace (editar/borrar/contexto para IA) - consolidada, pendiente de diseño
- Barrido de traduccion: `LABEL_MAP` del brief, opciones de combinacion de ideas, banner de upgrade
- Validar organicamente que los 4 usuarios revertidos experimenten el gating de workspaces correctamente en su proximo login

---

## Operacional

Git tags: v2.13.0 en frontend y backend.

Deployment: 71 Edge Functions redeployed en 4 lotes (fix de CORS). `create-user-profile`, `generate-recipe`, `create-idea`, `admin-users-list` redeployed adicionalmente por sus fixes especificos. Frontend con despliegue de `Login.tsx` y `Admin.tsx`.

---

Estado: v2.13.0 completada. Mejora de seguridad significativa (CORS restringido en todo el backend, ejecutada y verificada con disciplina sobre 71 funciones). Dos bugs de integridad de datos genuinos descubiertos y corregidos durante trabajo aparentemente no relacionado (aislamiento de workspace en briefs, atribucion de autoria en ideas) - ambos con datos historicos reconstruidos donde fue posible hacerlo con seguridad.