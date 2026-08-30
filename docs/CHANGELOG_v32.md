# Changelog v32 - v2.14.0 (app)

## Contexto de workspace para IA + Auditoria bidireccional de i18n + Traduccion de brief

**Fecha:** Agosto 2026
**Version:** v2.14.0 (frontend + backend)
**Tipo:** Minor - funcionalidad nueva significativa (contexto de workspace inyectado en 4 funciones de IA), mas correcciones de traduccion en ambas direcciones

---

## Contexto

Continuacion directa de la sesion que cerro v2.13.0. Arranca con una tarea acotada (traducir las secciones del brief descargado/copiado) que escalo a una auditoria completa de traducciones en ambas direcciones del archivo i18n, y culmina en la construccion de una funcionalidad nueva sustancial: el contexto que el creador define a nivel de workspace ahora influye realmente en las 4 funciones de generacion con IA del producto - una capacidad que existia como columna de base de datos desde Phase 1 pero nunca se conecto a ningun flujo real.

---

## Bloque 1 - Traduccion de brief (descarga y copia)

`downloadBrief.ts` y `handleCopyBrief` (RecipePanel.tsx) tenian un `LABEL_MAP` hardcodeado en ingles para las 9 etiquetas de aspecto (Angle, Hook, Tone, etc.), ademas de mas texto hardcodeado no capturado por ese mapa: "Format:", "Role:", "Topics:", "Strategic note", y el disclaimer legal completo del documento.

**Decision de arquitectura:** `downloadBrief.ts` es una funcion de utilidad pura sin acceso a `useTranslation()` - se agrego un parametro `t` que el componente llamador (con acceso real al hook) le pasa explicitamente, en vez de intentar importar i18n directamente fuera del contexto de React.

**Fix:** ambas funciones ahora usan `t(\`briefExport.${aspect.key}\`)` para las etiquetas (aprovechando que los nombres de aspecto ya coinciden con los sufijos de clave, sin necesitar mapa intermedio), mas nuevas claves para el resto del texto hardcodeado. Verificado end-to-end: descarga y copia respetan el idioma real de la sesion.

---

## Bloque 2 - Auditoria bidireccional de i18n

Durante la verificacion del Bloque 1, el fundador detecto un bloque completo de claves de `onboarding` (WelcomeScreen) con contenido en espanol dentro de `en.json`. En vez de corregir claves sueltas segun aparecieran de casualidad (patron que se venia repitiendo en sesiones anteriores), se opto por una comparacion programatica completa de ambos archivos.

### Metodologia

Script Python comparando `es.json` y `en.json` aplanados (flatten de claves anidadas), identificando: (a) claves con valor identico entre ambos idiomas (candidatas a copia sin traducir), y (b) verificacion de paridad estructural completa de claves.

### Hallazgos y fixes

- **Bloque `onboarding` completo (17 claves)**: contenido en espanol dentro de `en.json` - corregido con las 17 traducciones correctas, preservando el sub-bloque `questions.*` que ya estaba correcto
- **`workspace.upgradeTitle`/`upgradeDesc`**: encontrado en ambas direcciones durante el proceso - primero `es.json` con texto en ingles, luego (tras corregir `es.json`) se detecto que `en.json` tambien tenia el mismo problema pero en sentido inverso (espanol dentro del archivo ingles) - ambos archivos corregidos con su idioma correcto
- **`login.errors.requiresPasswordUpdate`**: clave faltante en `es.json` (existia solo en `en.json`) - agregada
- **46 claves "identicas" evaluadas caso por caso**: la mayoria confirmadas como coincidencias legitimas (anglicismos adoptados, nombres propios, terminos tecnicos como "Admin", "Brief", "SEO", "Personal") - sin accion necesaria

**Resultado:** paridad estructural de 814/815 claves confirmada tras los fixes, sin huecos de traduccion detectables en ninguna direccion.

---

## Bloque 3 - Contexto de workspace para generacion con IA (funcionalidad nueva)

### Origen

Investigacion de tareas nuevas revelo una brecha estructural: la tabla `workspaces` tiene una columna `description` capturada desde el diseno original de `CreateWorkspaceModal.tsx`, y una columna `system_prompt` (jsonb) desde Phase 1 - ninguna de las dos se consultaba jamas en las funciones de generacion con IA, confirmado con evidencia directa (grep sin coincidencias en `generate-recipe`, `content-dna`, `me-creative-insights`).

### Proceso de diseno de campos

Discusion iterativa con el fundador, contrastando el diseno contra 4 perfiles de creador muy distintos (artista, analista politico, influencer, empleado de agencia) para evitar sesgar el diseno hacia un solo tipo de usuario. Version inicial (audiencia + tono) se descarto por generar conflicto de jerarquia con campos ya existentes a nivel de idea individual (`target_audience`, tono sugerido por el brief) - se reemplazaron por "Referentes" (migrado desde perfil de usuario, ver mas abajo) y "Puntos a tener en cuenta / especificaciones", que no compiten con ningun campo de nivel idea.

**Campos finales:**
- `description` (reutilizada, limite ampliado de 300 a 2500 caracteres tras feedback del fundador de que es donde el creador vuelca la mayor cantidad de contexto real)
- `referents` (nueva)
- `guidelines` (nueva, "puntos a tener en cuenta")
- `workspace_type` (nueva, metadato organizacional - `own_brand` / `client_brand` / `internal_team` / `other` - no se inyecta al prompt de IA, pensado para futuras metricas de Admin sobre como los creadores usan multiples workspaces)

### Migracion de campo Referentes: perfil de usuario -> workspace

Decision de arquitectura: "Referentes" vivia en `user_profiles` (global al usuario), lo cual es incorrecto para un usuario con multiples workspaces de temas distintos - un analista politico y un artista de ceramica no comparten los mismos referentes creativos, y menos si ambos "roles" viven en workspaces separados del mismo usuario. Migrado a nivel de workspace.

**Migracion `add_workspace_context_fields`:** agrega las 3 columnas nuevas a `workspaces`, mas migracion de datos que copia `user_profiles.referents` (para los usuarios que lo tenian lleno) hacia su workspace Personal - verificado modelo 1:1 usuario-tenant antes de ejecutar, 18 workspaces recibieron datos historicos reales.

**Eliminacion completa de Perfil:** `referents` removido de `Profile.tsx` (UI), `useUserProfile.tsx` (tipos `UserProfile` y `OnboardingData`), `update-user-profile` y `create-user-profile` (backend) - decision explicita del fundador de que el campo "debe desaparecer del perfil por completo", no solo quedar sin usar.

### Integracion en las 4 funciones de IA reales

Nuevo modulo compartido `_shared/workspaceContext.ts` con `getWorkspaceContext()`, reutilizado en:

- **`generate-recipe`**: seccion "## CONTEXTO DEL WORKSPACE" agregada al prompt de generacion de brief
- **`generate-ideas`**: mismo patron - identificado por el fundador como especialmente valioso para el problema de "cold start" (sugerencias genericas cuando la plataforma aun no conoce al creador, `dna.primary_topic: "unknown"`) - con un workspace bien descrito, la primera idea generada ya tiene senal real desde el primer uso
- **`me-identity-insights`**: contexto agregado al prompt narrativo de standout insights y creative style tags
- **`me-creative-report`**: contexto agregado al prompt del informe creativo profundo (la funcion con mayor potencial de beneficiarse, al ser una carta narrativa completa sobre "quien es este creador")

**Verificacion de alcance real:** `content-dna` y `me-creative-insights` fueron investigadas y confirmadas como NO necesitando el cambio - son funciones puramente estadisticas (conteos, porcentajes, reglas de umbral programadas) sin ninguna llamada a la API de Anthropic ni prompt que enriquecer. Evita trabajo innecesario sobre funciones que no aplicaban.

**Prueba end-to-end:** confirmada por el fundador generando un brief real en un workspace con descripcion detallada, verificando que el contenido generado reflejaba el contexto proporcionado.

---

## Bloque 4 - Rediseno de CreateWorkspaceModal.tsx

Formulario ampliado de 2 campos (nombre, descripcion) a 5 (nombre, tipo, descripcion, guidelines, referentes - orden final tras feedback del fundador moviendo referentes al final del formulario). Cada campo con texto de ayuda (`modal__hint`) explicando el proposito, y placeholders reescritos como ejemplos concretos en vez de repetir la instruccion del hint (deteccion de redundancia hint/placeholder corregida durante la sesion).

**Backend:** `create-workspace/index.ts` actualizado para aceptar y guardar los 3 campos nuevos. `useWorkspace.tsx`: firma de `createWorkspace()` cambiada de segundo parametro posicional (`description?: string`) a objeto de opciones (`{ description?, referents?, guidelines?, workspace_type? }`), mas extensible para futuros campos sin seguir agregando parametros posicionales.

---

## Tarea nueva identificada, no ejecutada en este ciclo

**Prompts de generacion visual sugeridos por seccion del brief:** insight recurrente en entrevistas de usuarios - esperan que Creadora no solo entregue instrucciones sino que "cree" el contenido. Propuesta: boton junto a secciones visuales del brief (imagenes, slides, video) que abra un modal con un prompt ya redactado, listo para pegar en la IA generativa de preferencia del creador (Midjourney, DALL-E, Sora, etc.) - extiende la filosofia "un paso mas alla" de ready-to-use al terreno visual, sin asumir el costo/complejidad/riesgo legal de generar imagenes directamente. Pendiente de diseno (granularidad del boton: por seccion vs. uno general por brief).

---

## Testing / Verificacion

- Descarga y copia de brief verificadas en ambos idiomas
- Auditoria de i18n verificada programaticamente, sin depender de descubrimiento manual
- Contexto de workspace verificado con prueba real: brief generado en workspace con descripcion detallada reflejo ese contexto en el resultado
- Migracion de referentes verificada: 18 workspaces con datos historicos confirmados via SQL antes y despues de la migracion
- Eliminacion de referents de Perfil verificada con grep vacio tras los 4 archivos modificados

---

## Hallazgo menor, sin accion

Comentario `/* CORS */` huerfano en el encabezado de multiples Edge Functions tras el refactor de CORS de la sesion anterior (v2.13.0) - la constante real se movio dentro del handler pero el comentario de seccion quedo en su posicion original. Puramente cosmetico, sin impacto funcional, se limpiara oportunisticamente al tocar cada archivo por otras razones.

---

## Operacional

Git tags: v2.14.0 en frontend y backend.

Migraciones aplicadas: `add_workspace_context_fields`.

Deployment: `generate-recipe`, `generate-ideas`, `me-identity-insights`, `me-creative-report`, `create-workspace` redeployed. Frontend con `CreateWorkspaceModal.tsx`, `Profile.tsx`, `useUserProfile.tsx`, `useWorkspace.tsx`, `RecipePanel.tsx`, `downloadBrief.ts` actualizados.

---

Estado: v2.14.0 completada. El contexto de workspace pasa de ser una columna sin usar desde Phase 1 a una capacidad real que mejora las 4 funciones de generacion con IA del producto, con especial valor en el problema de "cold start" de usuarios nuevos. Auditoria de traduccion cierra una categoria completa de inconsistencias que se venian descubriendo de forma reactiva. Decision de arquitectura (referentes por workspace, no por usuario) corrige un modelo de datos que no reflejaba correctamente como los creadores con multiples workspaces realmente trabajan.