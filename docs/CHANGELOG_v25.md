# Changelog v25 — v2.8.0 (app)

## Activacion de Workspaces + Modo "Listo para usar" + Fix de brief incompleto

**Fecha:** Julio 2026
**Version:** v2.8.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva real (creacion de workspaces expuesta a usuarios, nuevo modo de generacion de briefs)

---

## Bloque 1 - Activacion de "Crear workspace"

Con Phase 3.5 completa y verificada, se activo la UI de creacion de workspaces que hasta ahora estaba comentada en WorkspaceSelector.tsx, cerrando el ciclo completo de Workspaces v3.0 para Acto 1.

### Feature gating

- useSubscription.ts: nuevo helper canCreateWorkspace = is_creator - deliberadamente sin incluir trial_active, decision de producto confirmada en sesiones anteriores para evitar el escenario de un usuario en trial creando workspaces que quedarian huerfanos al vencer el trial sin conversion
- El boton "Crear workspace" en el dropdown es siempre visible, incluso para usuarios sin acceso - muestra icono de candado en vez de "+", siguiendo el mismo patron de UpgradePrompt ya usado en otras features premium. Decision explicita de mostrar la feature para generar descubrimiento/curiosidad de conversion, en vez de ocultarla

### Backend

- useWorkspace.tsx: createWorkspace() ajustado para leer la respuesta de create-workspace, recargar la lista de workspaces, y cambiar automaticamente al workspace recien creado via switchWorkspace() - antes el componente que llamaba a la funcion tenia que orquestar manualmente este flujo, ahora es autocontenido en el hook

### Frontend

- CreateWorkspaceModal.tsx (nuevo componente): formulario de nombre + descripcion, o UpgradePrompt si el usuario no tiene plan Creator. Usa createPortal(content, document.body) para renderizarse fuera del arbol del Sidebar - sin el portal, el modal quedaba visualmente atrapado dentro del contenedor del Sidebar en vez de centrarse en la pantalla completa
- WorkspaceSelector.tsx: boton "Crear workspace" descomentado y conectado al nuevo modal

### Verificacion de negocio

Consulta sobre el estado real de suscripciones de los 40+ early adopters confirmo: 1 usuario en creator/active (la cuenta de founder, actualizada manualmente para poder probar la feature), 25 usuarios en free/trialing. Es decir, en la practica solo el founder puede crear workspaces adicionales hoy - el resto de usuarios reales vera el candado hasta convertir a plan pagado (23 de agosto) o hasta que se active manualmente para algun Creator piloto especifico. Esto funciona como un freno natural que da tiempo para la validacion piloto planeada antes de un rollout mas amplio.

---

## Bloque 2 - Modo "Listo para usar" (ready-to-use)

Feature solicitada directamente por creadoras entrevistadas, que expresaron disposicion a pagar por un producto que fuera "un paso mas alla" y entregara contenido mas cercano a lo publicable, no solo una guia estructural.

### Decisiones de diseno

- El toggle vive por card de idea (seccion Avanzado), no como preferencia global - cada generacion decide su propio nivel de terminacion, consistente con que distintos formatos/ideas pueden requerir distinto nivel de elaboracion
- Se descarto deliberadamente ramificar el prompt por familia de formato - la instruccion es generica y se apoya en el contexto que cada getFormatTemplate() ya construye por familia
- El desarrollo del nivel de racionalidad de respuesta (control granular de tono/estilo de IA) se descarto por ahora a favor de educar al creador para que indique esas preferencias directamente en el campo de contexto - decision de simplicidad para poder validar con datos reales antes de construir controles dedicados

### Backend - generate-recipe

- buildPrompt(): nuevo parametro ready_to_use: boolean
- combination_hash actualizado para incluir ready_to_use en el string de combinacion - sin este cambio, generar el mismo brief en ambos modos se habria detectado como duplicado y devuelto el resultado cacheado
- Iteracion del prompt en 2 rondas, documentada porque el primer intento no funciono bien:
  - Intento 1 (descartado): instruccion "escribe el texto final y terminado, como si el creador pudiera copiarlo y publicarlo directamente", con ejemplo malo/bueno. Resultado: mejora marginal, el molde JSON (que describe cada campo como "que debe contener" en vez de "el contenido en si") pesaba mas que la instruccion
  - Intento 2 (adoptado): reformulado como nivel de desarrollo/completud en vez de finalidad absoluta - "cada seccion debe ser una propuesta de texto desarrollada, no una recomendacion", con enfasis especifico en que los campos tipo lista (structure) tengan "suficiente desarrollo para funcionar como contenido, no solo un titular". Este framing produjo mejoras consistentes y validadas en 3 formatos distintos (reel, article, carousel)

### Migracion de BD

ALTER TABLE creative_sessions ADD COLUMN ready_to_use BOOLEAN DEFAULT false;

### Frontend

- useIdeaCardState.ts: campo ready_to_use: boolean agregado al estado por card
- IdeaCard.tsx: checkbox nuevo en seccion Avanzado, con estilos propios (idea-card__advanced-field--checkbox, idea-card__checkbox-label, idea-card__checkbox-hint) alineados al sistema de diseno existente - linea divisoria superior para diferenciarlo de los campos de contenido, hint en tamano reducido y tono discreto (--text-faint)
- useIdeas.ts: ready_to_use agregado al tipo CreativeSession y a la firma de generateRecipe()
- Ideas.tsx: ready_to_use propagado en el payload de generacion

### Bug encontrado y corregido - campos prellenados con el ultimo brief

useIdeaCardState.ts tenia logica (isToday) que prellenaba platform_id/format/content_role con los valores del brief anterior de la idea, si ese brief no fue generado el mismo dia. Esto causaba confusion - el creador veia campos ya seleccionados sin haberlo hecho, en vez de un formulario en blanco. Comportamiento confirmado como no deseado: tras generar un brief, los campos deben limpiarse siempre, para que el creador entienda que puede seguir generando combinaciones distintas para la misma idea. isToday, sessions, y latest eliminados del hook - inicializacion ahora siempre vacia.

---

## Bloque 3 - Fix: secciones faltantes o vacias en brief descargado/copiado

Detectado durante las pruebas de ready-to-use con el formato article: la seccion "Hook" aparecia vacia en el brief descargado (.docx) y copiado, sin importar el modo. Investigacion revelo que no era un bug del prompt - el template de article nunca definio hook (correcto, un articulo no tiene "gancho de apertura de 3 segundos" como un video). El problema real: downloadBrief.ts y handleCopyBrief (en RecipePanel.tsx) tenian los campos Angle/Hook/Tone/Structure hardcodeados, sin verificar cuales aplicaban realmente a la familia de formato - mostrando secciones vacias para campos ausentes, y omitiendo por completo campos que si existian (cta, seo, retention, engagement, argument) para 6 de las 10 familias.

### Fix

Ambas funciones reescritas para iterar dinamicamente sobre ASPECTS_BY_FAMILY[family] - el mismo archivo de configuracion que ya usaba correctamente el panel en pantalla (renderAspect) - en vez de una lista fija de campos.

- downloadBrief.ts: nuevo parametro platformSlug, usa getFormatFamily() + ASPECTS_BY_FAMILY para construir los parrafos del documento dinamicamente, con LABEL_MAP para etiquetas legibles de campos antes no soportados (seo, cta, retention, engagement, argument)
- handleCopyBrief (RecipePanel.tsx): mismo patron, reutilizando el aspects que el componente ya calculaba para el render en pantalla
- Ideas.tsx: llamada a downloadBrief() actualizada para pasar el platformSlug de la sesion

### Verificado

Confirmado en produccion con formato article (antes: solo Angle/Structure/Tone visibles, sin SEO) y carousel (antes: sin CTA visible) - ambos ahora muestran exactamente los campos correspondientes a su familia, sin vacios ni omisiones.

---

## Testing / Verificacion general de la sesion

- Creacion de workspace end-to-end: formulario -> creacion -> auto-switch -> modal centrado correctamente
- Gating verificado: cuenta founder (Creator) ve formulario; cuentas trial verian candado + upgrade prompt
- Ready-to-use probado en 3 familias (short_video/reel, article, carousel), con mejora consistente y validada visualmente
- Combination hash confirmado que no colisiona entre modo estructura y modo ready-to-use
- Cards de ideas confirmadas en blanco tras generar, sin importar historial previo
- Brief descargado y copiado verificados con contenido completo para formatos con campos "no estandar" (SEO, CTA)

---

## Pendiente relacionado (no incluido en este ciclo)

- Etapa 2 de ready-to-use (pendiente, sin fecha): analisis exhaustivo de generate-recipe con el modelo mas capaz disponible, evaluando si conviene un rediseno estructural del JSON (no solo prompt) para lograr un resultado genuinamente "listo para copiar y publicar" - la Etapa 1 mejora notoriamente el nivel de desarrollo pero no llega a ese estandar absoluto, limite que el propio molde JSON de estructura fija impone
- Validacion de ready-to-use con creadoras reales que expresaron esta necesidad en entrevistas - pendiente de agendar
- Extender validacion de campos completos en descarga/copia a las familias no probadas explicitamente en esta sesion (faltan long_video, live, text_post, story, visual, newsletter, default)

---

## Operacional

Git tags: v2.8.0 en frontend y backend.

Migraciones aplicadas: add_ready_to_use_creative_sessions

Deployment: generate-recipe redeployed (2 iteraciones de prompt en la misma sesion). Frontend con multiples despliegues incrementales durante la sesion.

---

Estado: v2.8.0 completada. Workspaces v3.0 alcanza su ciclo completo para Acto 1 (creacion expuesta a usuarios con plan Creator). Primera feature de producto nacida directamente de entrevistas de usuarias implementada y validada. Bug de brief incompleto en descarga/copia, presente desde el diseno original del sistema de familias de formato, identificado y resuelto.