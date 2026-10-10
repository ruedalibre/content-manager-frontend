# CHANGELOG v36 — v2.17.1

Fecha: 10 octubre 2026
Tipo: corrección (solo frontend)

## Corregido

**El panel del brief trabajaba sobre una copia desactualizada.**
`Ideas.tsx` guardaba el brief abierto como una copia tomada al abrirlo, y
`RecipePanel` la usaba para copiar, descargar, regenerar y guardar
alternativas, aunque la lista de ideas ya estaba actualizada.

Efectos que tenía:

- Al elegir alternativas en dos secciones, solo se guardaba la última; la
  anterior volvía a su texto original.
- "Copiar brief" y "Descargar brief" entregaban los textos originales, no
  los elegidos.
- La regeneración de una sección no veía las secciones ya cambiadas.

Solución: `Ideas.tsx` deriva `liveSession` desde el estado de `ideas` y se lo
pasa a `RecipePanel` y a `downloadBrief`. `RecipePanel.tsx` no cambia.

## Verificación

Prueba manual: elegir alternativa en dos secciones, copiar el brief, recargar
con F5 y descargar. En los tres casos aparecen los textos elegidos.

## Notas

- Los briefs descargados antes de esta corrección por usuarias que habían
  elegido alternativas traían los textos originales. No es posible
  identificar cuáles sesiones se vieron afectadas.
- Pendiente (reingeniería del brief, Fase 2): un doble clic muy rápido en
  "Usar esta" podría usar el estado anterior, y si un guardado falla la
  pantalla muestra el texto elegido sin haberlo guardado. Se resuelve
  guardando solo la sección cambiada desde el servidor.
- Backend sin cambios.
