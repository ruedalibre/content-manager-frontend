# Changelog v26 - v2.8.1 (app)

## Simplificacion de fecha de publicacion + eliminacion de campo "Reusable"

**Fecha:** Julio 2026
**Version:** v2.8.1 (frontend + backend)
**Tipo:** Patch - simplificacion de UI, eliminacion de feature sin valor validado, sin cambios estructurales de BD

---

## Contexto

Dos ajustes de bajo riesgo intercalados con el trabajo de Phase 3.5 y ready-to-use, orientados a reducir friccion en el modal de creacion/edicion de contenido.

---

## Bloque 1 - Fecha de publicacion sin selector de hora

El campo de fecha de publicacion en `CreateContentModal.tsx` usaba `type="datetime-local"`, exigiendo al creador seleccionar tambien una hora especifica sin que aportara valor real al flujo de trabajo.

### Cambios

- `CreateContentModal.tsx`: input cambiado de `type="datetime-local"` a `type="date"`
- Prellenado en modo edicion ajustado de `.slice(0, 16)` a `.slice(0, 10)` (de `YYYY-MM-DDTHH:mm` a `YYYY-MM-DD`)
- Fallback en `handleSubmit` cuando el campo queda vacio ajustado de `new Date().toISOString()` (timestamp completo) a `new Date().toISOString().split("T")[0]` (solo fecha), por consistencia con que la hora ya no es visible ni elegible en la UI

### Decision de BD

La columna `published_at` en la tabla `contents` se mantiene como `timestamp` sin cambios de tipo. Las fechas nuevas se guardan con hora `00:00:00`; registros historicos con hora real quedan intactos. No se considero necesario ni conveniente migrar el tipo de columna para una simplificacion puramente de UI.

### Bug encontrado y corregido - corrimiento de un dia en la tabla de Contents

Tras el cambio, la columna "Publicado" en la tabla de Contents mostraba un dia anterior al seleccionado (ej. seleccionar 3 de junio mostraba 2 de junio). Causa: `new Date("2026-06-03")` (fecha sin hora) se interpreta en JavaScript como medianoche UTC; al convertir de vuelta a hora local para mostrarla via `.toLocaleDateString()`, zonas horarias negativas respecto a UTC (como Colombia, UTC-5) retroceden un dia. El dato en base de datos y en el propio modal de edicion eran correctos en todo momento; el bug era exclusivamente de renderizado en la tabla.

**Fix:** `Contents.tsx`, columna `published_at`, parseo manual del string a componentes `year/month/day` y construccion de la fecha con el constructor `new Date(year, month, day)` (argumentos numericos), que si respeta zona horaria local en vez de interpretar el string como UTC. Las columnas `created_at` y `archived_at` no requirieron el mismo fix porque siempre llevan timestamp completo con hora real generada por el backend.

---

## Bloque 2 - Eliminacion del campo "Reusable"

Decision de producto: la utilidad de reutilizacion de una idea deberia emerger de la observacion directa de multiples contenidos generados desde la misma idea (ya visible en la card), reforzada por el insight de IA existente de "ideas reutilizadas" (`me-creative-insights`), en vez de depender de un flag manual que el creador tiene que recordar marcar. El campo `is_reusable` se elimino de todos los puntos de lectura y escritura activos.

### Alcance verificado por grep antes de intervenir

7 archivos identificados con referencias activas (frontend y backend), mas 1 Edge Function de codigo muerto (`me-contents-reusable`, ya documentada como huerfana desde Phase 3.5, sin tocar).

### Frontend

- `CreateContentModal.tsx`: checkbox eliminado del formulario, del `form` state inicial, y de `resetForm`
- `Contents.tsx`: eliminado del tipo `ContentItem`, de la query directa `loadContentForEdit`, del encabezado de columna en la tabla, y de la celda correspondiente

### Backend

- `create-content/index.ts`: eliminado de la desestructuracion del body y del INSERT
- `update-content/index.ts`: eliminado de la desestructuracion del body y del objeto `updates`
- `me-contents-history/index.ts`: eliminado del tipo `ContentRow`, del SELECT, y del objeto de respuesta formateado

### Bloque de Activity - KPI "Reutilizables"

- `me-dashboard/index.ts`: eliminado el calculo de `reusable_contents` (SELECT, filtro, y objeto de respuesta)
- `KPISection.tsx`: eliminada la card completa de "Reutilizables"; el dashboard de Activity pasa de 4 a 3 KPI cards (Total, Plataformas usadas, Tasa de crecimiento)

### i18n

Eliminadas 5 claves relacionadas directamente con el campo (`contents.colReusable`, `contents.reusableYes`, `contents.reusableNo`, `contents.reusable`, `activity.reusable`) en `es.json` y `en.json`.

**Verificacion importante realizada antes de borrar:** se revisaron 2 claves adicionales que tambien contenian la palabra "reusable" (`insights.idea_reuse.powerful`, `insights.idea_reuse.not_leveraging`) y se confirmo que **no** estan relacionadas con el campo eliminado - pertenecen al insight de IA sobre ideas que generaron multiples piezas de contenido, feature activa e independiente. Se preservaron intactas.

### Decision de BD

La columna `is_reusable` en la tabla `contents` se mantiene sin eliminar. Las filas nuevas usaran el valor `DEFAULT` de la columna; registros historicos no se ven afectados. Eliminacion de la columna queda como candidata a limpieza de schema futura, sin urgencia.

---

## Hallazgo colateral - sin resolver en este ciclo

Durante la revision de `Contents.tsx` se detecto que el `colSpan` usado en las filas de estado vacio y skeleton de la tabla (`colSpan={9}`) no coincide con el numero real de columnas de la tabla (12 antes de este cambio, 11 despues) - descuadre preexistente, no introducido por este trabajo. Queda documentado como pendiente de limpieza tecnica, sin impacto funcional visible reportado.

---

## Testing / Verificacion

- Fecha de publicacion: verificado que el input ya no muestra selector de hora, que el valor se guarda y se refleja correctamente al reabrir el modal, y que la tabla de Contents muestra la fecha correcta sin corrimiento
- Contents: confirmado que la tabla ya no muestra columna "Reusable" y que las 11 columnas restantes se ven alineadas
- CreateContentModal: confirmado que el checkbox ya no aparece, crear y editar contenido funciona sin error
- Activity: confirmado que el KPI de "Reutilizables" ya no aparece y el layout de 3 cards se ve correctamente
- Sin errores nuevos en consola en ningun punto de la verificacion

---

## Operacional

Git tags: v2.8.1 en frontend y backend.

Deployment: `create-content`, `update-content`, `me-contents-history`, `me-dashboard` redeployed. Frontend con multiples despliegues incrementales durante la sesion (fecha, is_reusable, i18n).

---

Estado: v2.8.1 completada. Modal de creacion/edicion de contenido simplificado en 2 puntos de friccion identificados como de bajo valor. Feature "Reusable" retirada de produccion tras decision de producto de que la senal de reutilizacion debe emerger de datos observados, no de un flag manual.