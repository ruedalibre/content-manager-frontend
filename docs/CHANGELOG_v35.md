# CHANGELOG v35 — v2.17.0

**Fecha:** 2026-10-09
**Tipo:** cambio de regla de producto (estados de contenido) + limpieza de código muerto

## Origen

Entrevistas con creadoras de contenido. Un contenido registrado desde el modal de
Contenidos es algo que la creadora ya publicó fuera de Creadora; no tiene sentido
que nazca como borrador ni que pueda editarse como si fuera un trabajo en curso.

## Regla de estados (nueva)

| Estado actual      | Con brief        | Sin brief                          |
| ------------------ | ---------------- | ---------------------------------- |
| draft              | cualquier estado | cualquier estado                   |
| published          | solo a archived  | estado fijo (la fecha sí se edita) |
| archived           | solo a published | solo a published                   |
| cualquiera → draft | bloqueado        | bloqueado                          |

- Los contenidos creados desde el modal nacen siempre `published`, con la fecha de hoy
  (editable).
- Solo nacen `draft` los contenidos que vienen de un brief (con `session_id`).
- Un publicado sin brief no puede archivarse (decisión: estado fijo).
- "Con brief" = tiene una fila en `creative_sessions` con `content_id`.

## Backend (desplegado)

- `create-content`: el servidor decide el estado (`session_id ? status ?? "draft" : "published"`).
  `status` deja de ser obligatorio en el body. Si llega publicado sin fecha, usa la de hoy.
  El audit log registra el estado final guardado.
- `update-content`: antes de actualizar lee el estado actual y valida la transición.
  Bloquea volver a `draft` y cambiar el estado de un publicado sin brief (HTTP 409).
  Si el estado enviado es igual al actual no se bloquea nada.

## Frontend

- `CreateContentModal.tsx`: en creación el estado es fijo `published` (selector
  deshabilitado) con fecha de hoy; en edición el selector solo ofrece las
  transiciones permitidas (`statusOptions`) y se deshabilita si solo hay una.
- Al pasar un borrador a publicado, la fecha se rellena sola con la de hoy.
- Nuevo helper `todayLocal()`: corrige un bug previo; `toISOString()` usa UTC y
  después de las 7 pm en Colombia devolvía el día siguiente.
- `Contents.tsx`: la ruta `?edit=` (Ver contenido desde un brief) ahora calcula
  `has_session` con un conteo en `creative_sessions`; antes no lo traía.

## Limpieza (commit aparte)

- Eliminado el flujo muerto "Crear desde combinación" (`/contents?idea=`): efecto y
  estado `selectedIdea` en `Contents.tsx`; prop `idea`, tipo `Idea`, recuadro de
  contexto, prellenado y llamada a `update-content-ideas` en `CreateContentModal.tsx`;
  claves i18n `createFromCombination` y `usingCombination`; estilos `.idea-context`.
- Verificado: ningún `contents?idea` en frontend, backend ni landing.

## Datos

- Conversión de 3 contenidos legacy de `draft` a `published` (creados desde el modal,
  sin idea ni brief): "batidos verdes", "5 variaciones de peso muerto…" y
  "Navidades 2026". `published_at` = fecha de creación en hora de Bogotá.
- Contenidos de prueba eliminados desde la app (borrado suave).
- Estado final: 36 publicados, 1 archivado, 64 borradores.

## Pruebas manuales

Crear desde el modal; editar publicado sin brief; publicado con brief (desde la
lista y desde `?edit=`); borrador con brief; archivado. Todas correctas.

## Decisiones y notas de producto

- El estado "Archivado" se mantiene por ahora. Considerar seriamente eliminarlo: quien
  sube un contenido lo hace para alimentar la inteligencia, y si no quiere eso lo
  borraría. Reintroducirlo solo si los usuarios lo piden. No invertir esfuerzo en
  explicarlo en la interfaz.
- Ningún contenido vuelve a `draft` una vez que sale de ahí.

## Pendientes

- Endpoint `update-content-ideas`: huérfano en el frontend; verificar que ninguna
  función lo invoque y evaluar eliminarlo (sumar a la lista de código muerto).
- El fallback de fecha de `create-content` usa UTC; el frontend siempre envía fecha,
  pero conviene unificarlo.
- Formato de `published_at` distinto entre `create-content` (fecha) y
  `update-content` (ISO completo); la columna es `timestamptz`.
- Lint: línea base 40 problemas (20 errores, 20 warnings); incluye el
  `exhaustive-deps` de `fetchContents` en `Contents.tsx`.
- Verificar con una cuenta distinta del fundador que `has_session` en `?edit=` se
  calcula bien (depende de RLS de `creative_sessions`).

## Notas operativas

- El backend se desplegó antes que el frontend, así que durante un rato producción
  tuvo el servidor nuevo con la interfaz vieja. Efecto: el modal viejo ofrecía
  Borrador pero el servidor guardaba `published`; una transición no permitida habría
  mostrado un error en inglés. Para próximos cambios de regla, desplegar ambos juntos.
