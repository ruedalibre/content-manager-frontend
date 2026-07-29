# Changelog v27 - v2.9.0 (app)

## Rediseno de modal de contenido + Indicador de ideas sin brief + Auto-logout por inactividad

**Fecha:** Julio 2026
**Version:** v2.9.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva real (auto-logout, nuevo KPI), mas mejoras de UX

---

## Contexto

Primer bloque de tareas ejecutado desde el Roadmap 2026 v4.0, consolidado tras el barrido completo de versiones anteriores del roadmap. Cubre 3 items de la lista critica: rediseno del modal de contenido, y dos tareas nuevas que surgieron durante la sesion de trabajo (indicador de ideas sin brief, auto-logout por inactividad).

---

## Bloque 1 - Rediseno del modal de creacion/edicion de contenido

Mejoras de UX identificadas directamente por el fundador al revisar el modal tras la limpieza del campo "Reusable" (v2.8.1).

### Cambios visuales

- **Cierre con clic fuera del modal** - el overlay ahora dispara el cierre (`onClick` en `.modal-overlay` + `stopPropagation()` en el contenido interior), mismo patron ya usado en `CreateWorkspaceModal.tsx`
- **Boton de cierre (X)** - icono de Lucide en la esquina superior derecha, dentro de un header fijo que no se mueve con el scroll
- **Grid de 2 columnas** - Plataforma+Formato en una fila, Estado+Rol en otra, reduciendo notablemente la altura del formulario (en la mayoria de los casos ya no requiere scroll en pantallas de escritorio)
- **Fix de scroll y bordes redondeados** - el contenido ahora vive en un contenedor `.modal__body` separado del marco exterior (`.modal`), resolviendo un problema donde el scrollbar cortaba visualmente las esquinas redondeadas del modal y el contenido quedaba pegado a los bordes superior/inferior al hacer scroll. Requirio 2 iteraciones: la primera (padding extra en el mismo contenedor con overflow) no funciono por una limitacion conocida de los navegadores con `padding-bottom` en contenedores flex+scroll; la segunda (separar header fijo, cuerpo scrollable, y marco exterior con `overflow: hidden`) si resolvio el problema de raiz

### Fuera de alcance (decision explicita)

Los `<select>` nativos del navegador no pueden estilizarse con bordes redondeados en su menu desplegado - es una limitacion del navegador/SO, no de CSS. Se evaluo migrar a componentes de dropdown custom (como `TopicCombobox`, ya existente) pero se decidio no hacerlo por ahora, dado el esfuerzo desproporcionado frente al beneficio visual.

**Archivos:** `modals.scss`, `CreateContentModal.tsx`

---

## Bloque 2 - Indicador de "ideas sin brief" en Activity

Reemplaza la card de KPI "Reutilizables" (eliminada en v2.8.1) con un indicador de mayor valor: cuantas ideas de la biblioteca del workspace todavia no tienen ningun brief generado.

### Proceso de diseno (documentado por su relevancia para decisiones futuras similares)

El diseno paso por 3 iteraciones antes de llegar a la version final, cada una descartada por una razon concreta detectada durante la implementacion o validacion con datos reales:

1. **Ubicacion inicial:** dentro del bloque de KPI cards, mismo nivel que Total de contenidos y Plataformas usadas. Descartada porque ese bloque completo depende del selector de periodo (7d/30d/90d), y el indicador de ideas conceptualmente no deberia variar con esa ventana de tiempo - mezclar ambos habria confundido al usuario.
2. **Ubicacion en el Topbar junto al selector de periodo:** descartada por sobrecargar visualmente el Topbar con controles adicionales.
3. **Ubicacion final adoptada:** el indicador vive en una fila propia dentro del cuerpo de la pagina, con `justify-content: space-between` respecto al selector de periodo - visualmente separado (fondo propio, icono de bombilla) pero sin anadir controles al Topbar. El Topbar en si paso a mostrar un subtitulo estatico ("El pulso de tu proceso creativo", con i18n) en reemplazo del texto dinamico anterior ("4 contents - Ultimos 30 dias"), que resultaba redundante con las KPI cards.

### Criterio de calculo (tambien iterado)

1. **Intento 1:** ideas sin sesion ni contenido, con mas de 30 dias de creadas. Descartado tras confirmar con el fundador que el filtro temporal no era la intencion original.
2. **Intento 2:** todas las ideas sin sesion ni contenido, sin filtro de dias. El numero resultante no coincidia con el conteo manual del fundador en su pagina de Ideas.
3. **Criterio final adoptado:** todas las ideas del workspace sin ninguna sesion de brief activa (`creative_sessions` con `status != 'discarded'`), sin considerar si tuvieron o no contenido en el pasado. Razon: es el unico criterio que el creador puede verificar visualmente por si mismo en su pagina de Ideas (ve si una idea tiene o no un brief activo), y refleja correctamente el caso de una idea cuyo brief fue borrado - vuelve a estar "esperando" desde la perspectiva de producto, sin importar que haya generado contenido en el pasado.

### Nomenclatura

El campo se nombro inicialmente `ideas_without_content`, mismo nombre engañoso identificado por el fundador tras confirmar que el criterio real es sobre briefs, no sobre contenido. Renombrado de forma consistente en backend, tipo de datos, frontend, y claves i18n a `ideas_without_brief`.

**Archivos:** `me-dashboard/index.ts` (backend), `dashboard.types.ts`, `Activity.tsx`, claves i18n `activity.subtitle`, `activity.ideaWithoutBriefSingular`, `activity.ideasWithoutBriefPlural`

---

## Bloque 3 - Auto-logout por inactividad

Feature nueva para resolver un problema reportado de usuarios reales: sesiones abiertas por largos periodos acumulan una version de JavaScript desactualizada en el navegador, causando errores al reanudar trabajo tras un deploy. El logout forzado con recarga completa de pagina garantiza que el usuario siempre reciba la version mas reciente del bundle al volver a autenticarse.

### Diseno

- **60 minutos de inactividad total** (55 minutos de espera + 5 minutos de aviso con cuenta regresiva), elegido como punto medio razonable entre productividad tipo Notion/Figma (sin timeout) y fintech (5-15 min) - dado que el motivo real es sincronizacion de version, no seguridad estricta
- **Deteccion de actividad:** eventos `mousemove`, `keydown`, `click`, `scroll`, `touchstart` a nivel de `window` - cualquier interaccion en cualquier parte de la app reinicia el temporizador
- **Aviso explicito antes del cierre:** modal sin boton de cierre ni clic-fuera, requiere confirmacion activa del usuario ("Seguir trabajando"). Decision deliberada: mientras el aviso esta visible, la actividad pasiva (ej. un movimiento accidental del mouse) no lo descarta automaticamente - solo el boton explicito
- **Cierre forzado:** `supabase.auth.signOut()` + `window.location.href = "/login?reason=idle"` (navegacion dura, no SPA) - especificamente para forzar la recarga completa del bundle, que es el proposito original de la feature
- **Mensaje en Login:** lectura del query param `?reason=idle` para mostrar "Tu sesion se cerro por inactividad. Inicia sesion de nuevo."

### Bug encontrado y corregido durante pruebas

Primera version del hook (`useIdleTimer.ts`) tenia el `useEffect` principal dependiendo de `showWarning`, causando que cada cambio de ese estado re-montara el efecto completo - el cual a su vez llamaba `resetTimer()`, que ponia `showWarning` de vuelta en `false` de inmediato. Resultado observado: el modal de aviso parpadeaba brevemente cada minuto en vez de permanecer visible. Corregido separando el efecto de montaje (dependencias `[]`, se ejecuta una sola vez) del valor de `showWarning` que el listener de actividad necesita leer - resuelto con un `useRef` espejo del estado, actualizado en paralelo pero sin formar parte de las dependencias del efecto.

**Archivos nuevos:** `src/hooks/useIdleTimer.ts` (primera carpeta de hooks globales de la app, fuera de cualquier `features/*` - hasta ahora todos los hooks vivian dentro de un dominio especifico), `src/components/ui/IdleWarningModal.tsx`

**Archivos modificados:** `AppLayout.tsx`, `Login.tsx`, claves i18n `session.idleWarningTitle`, `session.idleWarningBody`, `session.stayActive`, `login.sessionExpiredIdle`

---

## Operacional adicional (sin cambio de codigo)

**Leaked password protection habilitado** en Supabase Dashboard -> Authentication -> Attack Protection. Rechaza automaticamente contrasenas presentes en bases de datos de filtraciones conocidas (HaveIBeenPwned) en registro y cambio de contrasena. Configuracion pura, sin deployment.

**Activacion de Stripe modo live - en progreso, no completada en este ciclo.** Verificacion de negocio (Single-member LLC, Slipway LLC) enviada a Stripe, en revision (1-2 dias habiles segun el dashboard). Decisiones tomadas durante el proceso de verificacion: categoria de producto "SaaS (uso comercial)" pendiente de confirmar con asesora de comercio exterior antes de activar Stripe Tax; descriptor de estado de cuenta bancaria "CREADORA" (no "SLIPWAY LLC", para evitar contracargos por desconocimiento de marca); transferencias automaticas semanales a Mercury Checking (no Savings); telefono personal no publicado en facturas. Documentado aparte para retomar en el proximo ciclo una vez Stripe complete la revision.

**Roadmap 2026 v4.0** creado como documento consolidado, reemplazando las versiones v2.0/v2.1/v3.0 dispersas en el proyecto. Clasificacion por semaforo (critico/importante/en pausa) definida en conjunto con el fundador tras barrido completo de tareas pendientes historicas.

---

## Testing / Verificacion

- Modal de contenido: clic fuera cierra correctamente, boton X funcional, grid de 2 columnas verificado en pantalla de escritorio, scroll ya no corta bordes redondeados
- Activity: indicador de ideas sin brief verificado contra conteo manual del fundador (12 ideas, coincidencia exacta tras el ajuste de criterio final)
- Auto-logout: probado con valores reducidos (60s/10s) tras corregir el bug de parpadeo, modal permanece visible y countdown funciona correctamente

---

## Pendiente relacionado

- Activacion completa de Stripe modo live (bloqueada por revision de Stripe, 1-2 dias habiles) - incluye: crear Products/Prices en modo live, crear Stripe Coupon para precio de lanzamiento, actualizar secrets de Supabase y variable de Vercel a claves live, configurar webhook en modo live, verificar Customer Portal activo
- Confirmar categoria de Stripe Tax con asesora de comercio exterior antes de activar el calculo automatico de impuestos
- Revertir valores de testing en `useIdleTimer.ts` a los definitivos (55 min / 5 min) si quedaron con valores reducidos tras las pruebas

---

## Operacional

Git tags: v2.9.0 en frontend y backend.

Deployment: sin cambios de Edge Functions en este ciclo (todo el trabajo fue frontend + configuracion de Supabase Auth). Multiples despliegues incrementales de frontend durante la sesion.

---

Estado: v2.9.0 completada. Modal de contenido con mejor UX, nuevo indicador de valor en Activity con criterio validado contra datos reales, y feature de auto-logout resolviendo un problema activo reportado por usuarios. Activacion de Stripe live queda como trabajo en progreso para el proximo ciclo.