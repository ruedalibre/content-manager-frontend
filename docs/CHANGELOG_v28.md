# Changelog v28 - v2.10.0 (app)

## Bugs criticos de sesion de usuario nuevo + Migracion de 3 hooks a Context + Sistema de desactivacion de usuarios

**Fecha:** Julio-Agosto 2026
**Version:** v2.10.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva real (sistema de desactivacion de usuarios), mas correccion de multiples bugs criticos en produccion detectados durante llamadas con usuarias piloto

---

## Contexto

Dos llamadas de validacion con creadoras del grupo piloto revelaron 2 bugs criticos activos en produccion el mismo dia. La investigacion de ambos, seguida de una auditoria preventiva, revelo un patron estructural repetido (condiciones de carrera entre hooks de estado global y el flujo de onboarding) que afectaba a 3 sistemas distintos de la aplicacion. Se resolvio cada uno de raiz, no solo el sintoma reportado, y se aprovecho el trabajo para construir un sistema de gestion de usuarios que no existia (activar/desactivar en vez de eliminar).

---

## Bloque 1 - Bug critico: usuarios nuevos sin workspace personal

**Sintoma reportado:** un usuario completamente nuevo, registrado durante una llamada de validacion, no podia ver ideas sugeridas de IA ni guardar ideas nuevas ("Algo salio mal, intenta de nuevo").

**Causa raiz:** `create-user-profile` creaba el perfil y la suscripcion del usuario nuevo, pero **nunca creaba su workspace personal ni la fila en `workspace_members`** - un agujero que existia desde que Phase 1 (junio 2026) creo los workspaces personales de los usuarios ya existentes via migracion retroactiva, sin actualizar el flujo de registro para usuarios nuevos.

**Alcance real:** 4 usuarios afectados (registrados entre el 18 y 29 de julio), reparados manualmente. Se descarto la existencia de un segundo camino de registro sin pasar por `create-user-profile` (verificado: `admin-invite-user` solo pre-aprueba el correo, no crea usuario).

**Fix:** `create-user-profile/index.ts` ahora crea el workspace personal (`is_personal: true`) y el `workspace_members` con rol `owner` inmediatamente despues de crear el perfil, antes de calcular el trial.

---

## Bloque 2 - Hallazgo colateral: integridad referencial de usuarios

Durante la limpieza de 2 cuentas de prueba (`borrar@test.com`, `eliminame@test.com`), se descubrio que **`public.users` nunca tuvo foreign key declarada hacia `auth.users`**. Consecuencia: eliminar un usuario desde el panel de Supabase Auth borraba `auth.users` pero dejaba huerfanas las filas de `public.users` y, en cascada, `contents`, `tags`, `user_profiles`, `creative_sessions` (las 4 tablas que dependen de `public.users`, no de `auth.users` directamente).

**Verificacion exhaustiva realizada:** de las 11 tablas con columna `user_id`, 5 dependen de `public.users` y 6 de `auth.users` directamente - estas ultimas si tenian CASCADE correcto y nunca tuvieron el problema. Se encontro y limpio ademas un tercer huerfano historico (cuenta de mayo 2026, autorizada su eliminacion por el usuario real).

**Fix:** migracion `add_users_auth_fkey_cascade` - FK con `ON DELETE CASCADE` de `public.users.id` hacia `auth.users.id`. `creative_units` se dejo deliberadamente con `SET NULL` en vez de CASCADE (decision de producto: las ideas deben sobrevivir a la salida de su creador, para que el resto del workspace pueda seguir usandolas en un contexto colaborativo).

---

## Bloque 3 - Bug critico: ENUM content_role sin valor "sales"

**Sintoma reportado (segunda llamada de validacion):** al crear contenido desde un brief con rol "Ventas", error en consola: `invalid input value for enum content_role: "sales"`.

**Causa raiz:** el rol "sales" se agrego al frontend/backend en una fase posterior del desarrollo por peticion de usuarios, pero nunca se sincronizo con el tipo ENUM de PostgreSQL, que seguia con solo 5 de los 6 valores esperados.

**Fix:** migracion `add_sales_to_content_role_enum` - `ALTER TYPE content_role ADD VALUE 'sales'`.

**Accion de seguimiento identificada:** se sospecha que puede haber otros ENUMs con el mismo tipo de desalineacion frontend/backend vs. base de datos - queda pendiente un barrido general (ver seccion Pendiente).

---

## Bloque 4 - Migracion de 3 hooks a Context Provider (patron repetido)

Tras resolver el Bloque 1, se detecto que el mismo tipo de condicion de carrera (estado cargado antes de que `create-user-profile` termine de crear los datos del usuario nuevo) afectaba tambien a `useSubscription` y `useUserProfile` - ambos hooks simples sin mecanismo de sincronizacion entre instancias, el mismo patron que ya se habia corregido para `useWorkspace` en una sesion anterior.

### useSubscription -> Context

**Sintoma:** usuario nuevo con trial activo en base de datos veia el banner "Obtener Creator" al intentar generar un brief, pese a tener acceso legitimo.

**Fix:** `useSubscription.tsx` convertido a `SubscriptionProvider`/Context, con `loadSubscription()` expuesto y disparado explicitamente tras completar/saltar onboarding.

### useUserProfile -> Context

**Hallazgo durante la auditoria:** 6 componentes consumian `useUserProfile()` de forma independiente (`AppLayout`, `Sidebar`, `Profile`, `LanguageToggle`, `ProfileNudge`, `Identity`). `Sidebar.tsx` ya tenia un **parche manual construido para este mismo problema** - un `CustomEvent("profile-updated")` disparado desde `Profile.tsx` al guardar cambios, evidencia de que alguien ya se habia topado con la desincronizacion antes y la resolvio de forma puntual en vez de estructural.

**Fix:** `useUserProfile.tsx` convertido a `UserProfileProvider`/Context. Sistema de eventos manual eliminado por completo (`Sidebar.tsx`, `Profile.tsx`) - reemplazado por la fuente unica de verdad del Context.

**Cambio de arquitectura en AppLayout.tsx:** dado que React Context solo fluye hacia descendientes, y `AppLayout` (el componente externo) es quien *crea* los 3 Providers (no puede consumirlos el mismo), toda la logica de onboarding y tour (que depende de `useUserProfile`) se extrajo a un nuevo componente interno `AppLayoutContent`, unico lugar donde los 3 hooks (`useWorkspace`, `useSubscription`, `useUserProfile`) pueden consumirse legitimamente.

### Bug de tipos encontrado durante la migracion

`showProfileNudge` (expresion booleana con multiples `&&` terminando en comparacion de fechas) inferia como `false | Date` en vez de `boolean`, por contaminacion de tipo de un operando intermedio no estrictamente booleano. Resuelto envolviendo la expresion completa en `Boolean(...)`.

---

## Bloque 5 - Incidente de produccion: LanguageToggle rompia rutas publicas

Al desplegar la migracion de `useUserProfile` a Context, la aplicacion completa quedo inaccesible (`Uncaught Error: useUserProfile must be used within a UserProfileProvider`) para cualquier visitante no autenticado.

**Causa raiz:** `LanguageToggle.tsx` (que llama a `useUserProfile()` para persistir la preferencia de idioma) se usa tambien en `Login.tsx` y `UpdatePassword.tsx` - ambas rutas **publicas**, fuera del arbol de `AppLayout`/`UserProfileProvider`. El guard `throw new Error(...)` que el Context agrega deliberadamente (para detectar este tipo de uso incorrecto) se disparaba de inmediato al cargar cualquiera de esas 2 paginas.

**Analisis de UX antes del fix:** se determino que la persistencia de idioma en paginas publicas probablemente nunca funciono de forma confiable (no hay perfil de usuario antes de autenticarse) - el bug simplemente paso de fallar en silencio a fallar de forma ruidosa.

**Fix:** nuevo componente `LanguagePublicToggle.tsx`, sin dependencia de `useUserProfile` - solo cambia el idioma de la sesion actual del navegador via `i18n.changeLanguage()`, sin intentar persistir nada. Usado en `Login.tsx` y `UpdatePassword.tsx` en reemplazo de `LanguageToggle`. `LanguageToggle.tsx` original se mantiene sin cambios para su uso dentro de `Profile.tsx` (unico lugar donde si existe un perfil autenticado al que persistir la preferencia).

**Tiempo de resolucion:** identificado y desplegado en menos de 30 minutos desde el reporte del error en consola.

---

## Bloque 6 - Sistema de desactivacion de usuarios (nueva funcionalidad)

Nacio de un problema operativo concreto: la limpieza de cuentas de prueba via eliminacion directa dejaba `early_access_requests` en un estado inconsistente (`status: 'invited'` para cuentas que ya no existian), bloqueando la re-invitacion sin intervencion manual en SQL. La discusion se amplio a una decision de producto de cara al crecimiento: reemplazar la eliminacion directa de usuarios por un mecanismo de activar/desactivar con trazabilidad completa, preservando la posibilidad de reutilizar cuentas de prueba sin recrearlas.

### Diseno

- Columna `deactivated_at` en `public.users` (soft delete, nunca se pierde informacion)
- Cuenta desactivada no puede volver a iniciar sesion (verificado en el proximo intento de login, no interrumpe una sesion ya en curso - decision explicita del fundador)
- Reactivable en cualquier momento, sin recrear ningun dato
- Cada accion (activar/desactivar) registrada en `audit_logs` con quien la ejecuto, sobre quien, y cuando

### Backend

- Migracion `add_deactivated_at_to_users`
- `admin-users-list`: incluye `deactivated_at` en la respuesta
- `admin-toggle-user-status` (nueva): verificacion de rol admin, bloqueo de auto-desactivacion, registro en `audit_logs`

**Bug encontrado durante pruebas:** el `INSERT` a `audit_logs` fallaba silenciosamente porque `workspace_id` es `NOT NULL` en esa tabla, y la accion de desactivar un usuario no esta asociada a ningun workspace especifico. Resuelto usando el workspace personal del usuario afectado como referencia, envuelto en `try/catch` explicito (un fallo en el log de auditoria no debe impedir que la accion principal se complete, pero tampoco debe fallar en silencio sin dejar rastro en los logs de la funcion).

### Frontend

- `Admin.tsx` (pestana Operations): columna "Cuenta" con badge Habilitada/Desactivada, boton con modal de confirmacion
- `AuthGuard.tsx`: verifica `deactivated_at` en cada carga de sesion; si esta poblado, cierra la sesion activa y redirige a `/login?reason=deactivated`
- `Login.tsx`: mensaje explicativo para el caso de cuenta desactivada, mismo patron que `?reason=idle` del auto-logout

### Decision de arquitectura registrada

El fundador identifico la necesidad, de cara al crecimiento del producto, de eventualmente construir un panel de administracion separado de la aplicacion de creadores (dominio propio, diseno 100% enfocado en administracion/estadisticas/salud del sistema) en vez de seguir creciendo `Admin.tsx` dentro del mismo bundle. Se acordo posponerlo - el sistema de desactivacion resuelve la necesidad inmediata sin ese nivel de inversion.

---

## Testing / Verificacion

- Los 4 usuarios afectados por el Bloque 1 verificados con workspace personal funcional
- Flujo completo de registro nuevo verificado de punta a punta: workspace visible, trial reconocido, nombre/perfil correcto en Sidebar, edicion de perfil reflejada sin recargar - todo sin necesidad de logout/login manual
- Sistema de desactivacion verificado en produccion: desactivar bloquea login con mensaje correcto, reactivar restaura acceso normal, ambas acciones visibles en `audit_logs`
- Waitlist verificada: cuenta reactivada desde Admin no requiere re-invitacion; cuenta nunca registrada correctamente reseteada a `pending` para permitir nueva invitacion

---

## Pendiente relacionado

- Barrido de otros ENUMs con posible desalineacion frontend/backend vs. base de datos (mismo patron que "sales" en `content_role`)
- Confirmar los 10 hooks de "riesgo medio" identificados en la auditoria (dependientes de `workspaceId`, ya reciben el valor correctamente desde `WorkspaceProvider` pero sin verificacion explicita uno por uno)
- Desacoplar `Admin.tsx` (~1775 lineas, 5 pestanas) en componentes independientes por pestana - se suma a `Ideas.tsx` en la lista de componentes "espagueti" pendientes de dividir
- Limpieza tecnica: separar Context/hook de Provider en archivos distintos para `useWorkspace.tsx`, `useSubscription.tsx`, `useUserProfile.tsx` (warning cosmetico de `react-refresh/only-export-components`, sin impacto funcional, pospuesto deliberadamente 3 veces durante esta sesion)

---

## Operacional

Git tags: v2.10.0 en frontend y backend.

Migraciones aplicadas: `add_users_auth_fkey_cascade`, `add_sales_to_content_role_enum`, `add_deactivated_at_to_users`.

Deployment: `create-user-profile`, `admin-users-list`, `admin-toggle-user-status` (nueva) redeployed. Multiples despliegues incrementales de frontend durante la sesion, incluyendo un incidente de produccion resuelto en menos de 30 minutos (Bloque 5).

---

Estado: v2.10.0 completada. Dos bugs criticos reportados por usuarias piloto resueltos de raiz, no solo en su sintoma - la investigacion revelo y corrigio un patron estructural repetido en 3 sistemas de estado global de la aplicacion. Sistema de gestion de usuarios (activar/desactivar con trazabilidad) construido como respuesta directa a una necesidad operativa real, sentando una decision de producto de cara al crecimiento: preservar datos de usuario siempre, nunca eliminar sin dejar rastro.