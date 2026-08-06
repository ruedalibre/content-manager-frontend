# Changelog v29 - v2.11.0 (app)

## Recordatorio de vencimiento de trial + Cobertura completa de descarga de brief + Migracion de iconos + Fixes de UI

**Fecha:** Agosto 2026
**Version:** v2.11.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva real (sistema de envio masivo de correo), mas cierre de cobertura de verificacion pendiente y multiples fixes de UI/UX

---

## Contexto

Continuacion directa de la sesion que cerro v2.10.0 (bugs criticos de sesion + sistema de desactivacion de usuarios). Esta sesion se enfoco en cerrar tareas pendientes del Roadmap 2026 v4.0: comunicacion a la base de usuarios sobre el vencimiento del periodo de prueba, cierre de la verificacion de descarga/copia de brief en las 10 familias de formato, proteccion contra traductores automaticos del navegador, y migracion completa de emojis a iconos Lucide.

---

## Bloque 1 - Sistema de recordatorio de vencimiento de trial (nueva funcionalidad)

Envio masivo de correo a todos los usuarios activos recordando el vencimiento del periodo de acceso gratuito (23 de agosto de 2026), con un correo individual por destinatario (no BCC masivo).

### Diseno del mensaje

Se descarto incluir un CTA de pago en el correo, por dos razones: el modo live de Stripe aun no esta activo (link roto), y los destinatarios no tienen incentivo real de pagar antes de que termine su periodo gratuito. Mensaje final: recordatorio corto, sin friccion, con la unica tranquilidad relevante por adelantado (la informacion del creador nunca se pierde, actualice su plan o no).

### Definicion del universo de destinatarios (iterada)

Primer intento de filtro (`plan = 'free' AND status = 'trialing'`) arrojo 22 destinatarios, muy por debajo de la expectativa de "40+ early adopters". Investigacion confirmo que la base real activa son 28 usuarios (no 40+, numero desactualizado). De esos 28: 22 en trial real, y 6 en `plan = 'creator'` - de los cuales solo 2 corresponden al founder (cuentas personales), y los otros 4 son usuarios piloto con acceso a workspaces asignado manualmente para validacion, quienes **tambien** deben convertir a pago el 23 de agosto igual que cualquier trial. Filtro final: todos los usuarios activos excepto las 2 cuentas del founder (26 destinatarios).

### Backend - admin-send-trial-reminder (nueva)

Envio por lotes (8 destinatarios simultaneos, pausa de 1.1s entre lotes) via Resend, con plantilla React Email (`TrialEndingReminderEmail.tsx`) siguiendo el mismo estilo minimalista de las plantillas transaccionales existentes. Verificacion de rol admin, registro en `audit_logs`.

**Problema de bundling resuelto en 3 capas durante el despliegue:**
1. `supabase/config.toml` referenciaba un `import_map` (`deno.json` propio de la funcion) que causaba fallos de resolucion de `@react-email/components` - eliminado, siguiendo el patron de la funcion equivalente ya funcional (`send-password-update-notice`), que no usa `deno.json` propio
2. Un archivo `.npmrc` vacio en la carpeta de la funcion (ausente en la funcion que si funciona) fue descartado como causa tras verificacion
3. Causa real: el import `"@react-email/components"` sin prefijo requiere el prefijo explicito `npm:` para resolverse de forma robusta en Deno, independiente de configuracion implicita del entorno

### Verificacion antes del envio real

Prueba controlada con un solo destinatario (cuenta del founder) antes de disparar el envio a los 26 - confirmado exitoso, luego revertido el filtro temporal y desplegado el envio real: **26/26 enviados, 0 fallidos**, verificado en `audit_logs`.

---

## Bloque 2 - Cierre de verificacion de descarga/copia de brief (10/10 familias)

Continuacion del trabajo iniciado en sesiones previas (`reel`, `article`, `carousel` ya verificados). Verificadas hoy: `long_video`, `live`, `text_post`, `story`, `visual`, `newsletter` - las 6 restantes con contenido real, sin hallazgos.

### Familia `default` - confirmada como codigo inalcanzable en la practica

Al intentar disenar un caso de prueba para la familia fallback `default`, se determino que ninguna combinacion real de plataforma/formato del catalogo cae fuera del `FORMAT_FAMILY_MAP` - todo formato visible en el `<select>` de la UI pertenece a una de las 9 familias con mapeo explicito.

### Hallazgo colateral - plataforma "Unknown" sin proposito funcional

Al considerar la plataforma "Unknown" del catalogo (unica candidata teorica para forzar la familia `default`), se determino que nunca tuvo formatos asociados, haciendola imposible de seleccionar desde la UI real (el select de formato depende de la plataforma elegida). Decision de producto: eliminarla del catalogo visible.

**Intento de DELETE fallido:** 3 registros historicos de `early_access_requests` (waitlist) referencian esta plataforma via foreign key `NOT NULL`, sin posibilidad de anular el campo. **Solucion adoptada:** `is_active = false` en vez de DELETE - la Edge Function `platforms` ya filtraba por `is_active = true` en su query, ocultando la plataforma de los 4 puntos de consumo del frontend sin tocar codigo ni romper integridad referencial con la waitlist historica. Mismo patron de soft-delete ya adoptado para usuarios en v2.10.0.

---

## Bloque 3 - Proteccion contra traduccion automatica del navegador

Reportado durante una llamada de demostracion con una asesora externa (Diana, comercio exterior): la extension de Google Translate del navegador destrozaba el indice alfabetico de la pestana Temas, traduciendo letras sueltas del abecedario como si fueran palabras completas (`C` -> `do`, `G` -> `GRAMO`, `N` -> `norte`, `X` -> `incognita`).

### Fix puntual

`translate="no"` agregado al contenedor del indice alfabetico en `Ideas.tsx` - unico caso real de este patron encontrado en toda la aplicacion tras busqueda dirigida (texto corto generado dinamicamente sin pasar por el sistema de traducciones `t()`).

### Proteccion global

`<meta name="google" content="notranslate" />` agregado al `<head>` de `index.html` en ambos repos (app y landing) - señal estandar que reduce el riesgo de casos similares no anticipados, complementaria al fix puntual.

### Pendiente identificado, no resuelto en este ciclo

`<html lang="en">` sigue hardcodeado sin importar el idioma real de la sesion - requiere logica de React para actualizarlo dinamicamente segun `i18n.language`. Ya estaba anotado en el roadmap, no se aborda en este ciclo.

---

## Bloque 4 - Migracion completa de emojis a iconos Lucide

Cierre de la tarea de limpieza visual identificada en el Roadmap 2026 v4.0. Verificacion previa por grep de rango Unicode, refinada para excluir simbolos tipograficos ya intencionales del sistema de diseno (`✦`, `✓`, `✗`, `✕`, `⚠`, flechas de tendencia) del alcance de la tarea.

### Archivos migrados

| Archivo | Cambio |
|---|---|
| `RecipePanel.tsx` | Rating de 5 caras (`😞😕😐🙂😄` → `Angry/Frown/Meh/Smile/Laugh`), manteniendo seleccion individual no acumulativa ya existente; color de icono activo corregido a `var(--accent)` (los iconos SVG no heredan color como los emojis a color) |
| `RecipePanel.tsx` | Panel de combinacion - 4 emojis embebidos directamente en claves de traduccion (`i18n`) extraidos a iconos React separados (`Lightbulb`, `Tag`, `Smartphone`, `FileType`, `Drama`), texto de traduccion limpiado |
| `Activity.tsx` | `🎉` → `PartyPopper` (mensaje de exito de checkout) |
| `Contents.tsx` | 2 comentarios de codigo con `🔥` limpiados (sin impacto en UI, nunca se renderizaban) |
| `Identity.tsx` | `🔍` → `Search`, `✦` → `Sparkles`; componente `Collapsible` generalizado para aceptar cualquier `LucideIcon` |
| `IdeaCard.tsx` | Barra de acciones completada: `✏️` → `Pencil`, `🗑️` → `Trash2`, `⧉` → `Copy` (Archive ya estaba migrado de una sesion anterior, quedando el componente parcialmente migrado sin que se hubiera notado) |
| `Ideas.tsx` | Gestion de Topics: `✏️` → `Pencil`, `🗄️` → `Archive` |
| `BriefList.tsx` | `📄` → `FileText` (estado vacio) |
| `RecipeCard.tsx` | `🔄` → `RefreshCw` (brief descartado), `📄` → `FileText` (sin brief aun) |
| `TourInvitation.tsx` | `👋` → `Hand` |

### Hallazgo colateral - en.json con contenido en espanol

Durante el Bloque de `RecipePanel.tsx`, se confirmo que las 5 claves de traduccion del panel de combinacion en `en.json` eran identicas palabra por palabra a `es.json` (nunca traducidas). Sugiere una copia de bloque sin traducir en algun punto anterior del desarrollo - anotado como candidato a un barrido mas amplio de `en.json` en busca de otras claves con el mismo problema, no ejecutado en este ciclo.

### Decision descartada durante el trabajo

Se considero usar `❌✅` (emoji) para los botones de cancelar/confirmar en un fix de UI posterior (Bloque 5) - descartado por ir en contra directa del trabajo de este mismo bloque; se uso `X`/`Check` de Lucide en su lugar.

---

## Bloque 5 - Fix de superposicion visual en edicion de Topics

Reportado durante uso real de la pagina Ideas: al editar el nombre de un tema, el formulario inline (input + botones Cancelar/Guardar) se superponia visualmente sobre el tema de la celda vecina del grid de 4 columnas.

**Causa raiz:** el contenedor de edicion permanecia atrapado en el ancho de una sola celda del grid (`grid-template-columns: repeat(4, 1fr)`), y las clases `.topic-list-item__edit` / `.topic-list-item__edit-actions` referenciadas en el JSX no tenian ningun estilo definido en el `.scss` - el input y los botones se desbordaban con comportamiento por defecto del navegador.

**Fix:** clase modificadora `.topic-list-item--editing` con `grid-column: 1 / -1` (expande la celda a todo el ancho de la fila durante la edicion, empujando los demas temas hacia abajo en vez de superponerse), mas estilos completos para `__edit`/`__edit-actions` con `max-width: 420px` para evitar que el input se extienda de forma desproporcionada hasta el borde de la pantalla.

---

## Verificacion adicional - comportamiento de calificaciones bloqueadas

Consulta sobre si es correcto que las calificaciones de un brief no puedan modificarse una vez aprobado. Confirmado contra el historial de diseno de la funcion (sesion de junio 2026): comportamiento intencional (`ratingsLocked = approved || alreadyConverted`), parte de una progresion de estados con puntos de no-retorno deliberados - preserva la coherencia del historial una vez el brief genero contenido real. No es un bug.

---

## Testing / Verificacion

- Envio de correo verificado con prueba controlada de 1 destinatario antes del envio real a 26
- Las 10 familias de formato verificadas (9 con contenido real, 1 confirmada inalcanzable en la practica)
- Indice alfabetico de Topics probado con traductor de navegador activo tras el fix
- Los 9 archivos de iconos migrados verificados visualmente uno por uno
- Bug de superposicion de edicion de Topics verificado resuelto con capturas de pantalla antes/despues

---

## Pendiente relacionado

- Barrido de `en.json` en busca de otras claves con contenido en espanol sin traducir (mismo patron encontrado en el panel de combinacion de `RecipePanel.tsx`)
- `<html lang>` dinamico segun idioma de sesion
- Confirmar si existen otros componentes con el mismo problema de "migracion parcial silenciosa" detectado en `IdeaCard.tsx` (donde `Archive` ya estaba en Lucide pero los otros 3 botones de la misma barra seguian en emoji sin que se hubiera notado)

---

## Operacional

Git tags: v2.11.0 en frontend y backend.

Deployment: `admin-send-trial-reminder` (nueva) desplegada tras resolver 3 capas de problema de bundling. `platforms` sin cambios de codigo (fix via UPDATE de datos). Multiples despliegues incrementales de frontend durante la sesion.

---

Estado: v2.11.0 completada. Primera comunicacion masiva real a la base de usuarios activos. Cobertura de verificacion de descarga/copia de brief cerrada al 100% de las familias de formato. Proteccion contra traductores automaticos implementada tras incidente real en demostracion a asesora externa. Migracion completa de emojis a iconos Lucide en los 9 archivos identificados, con 2 hallazgos colaterales de consistencia visual y de traduccion resueltos en el camino.