# Creadora
## Changelog de Desarrollo — v12.0
**User Research Fixes, UX Improvements, Tour Redesign & Copy Updates · Junio 2026 · Uso interno**

---

## 1. Propósito de este documento

Este documento registra todos los cambios implementados después del CHANGELOG_v11 (v1.9.0). Cubre las correcciones y mejoras derivadas de la primera fase de investigación de usuarios (6 entrevistas en profundidad), organizadas en tres fases de implementación: copy y naming (Fase A), bugs (Fase B) y mejoras de UX (Fase C).

Documentos de referencia previos:
- CHANGELOG_v11 — Past Due Banner, Cache Invalidation, Timezone Fix, Landing Polish & OG Image
- CHANGELOG_v10 — Stripe Integration, Checkout Flow, Customer Portal, Pricing Section
- CHANGELOG_v9 — Subscriptions Infrastructure, Feature Gating & Pricing Modal

**Tag de versión:** `v2.0.0`

---

## 2. Resumen ejecutivo

| 5 Copy/naming fixes | 4 Bugs resueltos | 8 Mejoras UX | 1 Tour rediseñado | 2 Guías de pasos nuevas |
|---|---|---|---|---|

---

## 3. Fase A — Copy y naming

Cambios de texto y etiquetas derivados de patrones observados en 5+ entrevistas de usuario. Sin cambios de lógica ni estructura de datos.

### 3.1 Estado del brief — "En producción" / "Convertida"

**Problema:** 5 de 6 participantes interpretaron el estado "En producción" o "Convertida" como que la plataforma estaba generando el contenido automáticamente.

**Cambio:** renombrado a "Guardado como contenido" — inequívoco sobre lo que ocurrió.

**Archivos afectados:** i18n (ES y EN), StatusBadge.tsx o componente equivalente.

### 3.2 Botones del modal de crear idea en inglés

**Problema:** los botones del modal de creación de idea aparecían en inglés independientemente del idioma del usuario. Reproducido en 2 sesiones de entrevista.

**Cambio:** traducidos al español en ES, verificados en EN.

**Archivos afectados:** archivos i18n del namespace de ideas, modal de creación de idea.

### 3.3 Nombres de formatos en tabla de Contenidos en inglés

**Problema:** los valores del campo "formato" en la tabla de Contenidos aparecían en inglés (video, reel, carousel, etc.) sin traducción.

**Cambio:** traducidos via i18n para ambos idiomas.

**Archivos afectados:** archivos i18n, componente de tabla de contenidos.

### 3.4 Texto guía para redactar el título de la idea

**Problema:** varios usuarios escribieron el título como un prompt de chat ("Crea 10 ideas sobre...") o como una frase descriptiva muy larga que agotaba los 500 caracteres antes de llegar al contexto.

**Cambio:** añadido subtexto bajo el label del campo título: "Una frase corta que nombre tu idea, no un prompt". Placeholder actualizado con un ejemplo concreto de buen título.

**Archivos afectados:** i18n namespace ideas (ES y EN), modal de creación de idea.

### 3.5 Rol "Curado" → "Recomendado"

**Problema:** "Curado" genera asociaciones con alimentos o medicina en español. Solo lo entendían perfiles de agencia.

**Cambio:** renombrado a "Recomendado" en ES. En EN se mantiene "Curated" que es término establecido.

**Archivos afectados:** i18n, selector de rol en card de idea y modal de creación.

---

## 4. Fase B — Bugs resueltos

### 4.1 Tour desajustado en tablet/iPad

**Problema:** el tour usaba posicionamiento absoluto calculado en JavaScript que fallaba en tablet porque las coordenadas varían según el dispositivo, zoom del navegador y tamaño del viewport. Reproducido en 2 sesiones de entrevista (ambas en iPad).

**Fix:** refactor completo del tour. Los tooltips de cada paso se integraron al JSX del sidebar como hijos directos de cada item del menú, visibles u ocultos por estado. El posicionamiento es ahora relativo al elemento padre via CSS, sin coordenadas JS.

**Mejora adicional:** añadido paso 5 al tour para la página "Mi Perfil", que no estaba cubierta en la versión anterior.

**Archivos afectados:** componente del sidebar, estilos del tour.

### 4.2 Bug de sesión expirada en tablet (cerrado como no reproducible)

**Problema reportado:** bloqueo de interfaz al editar una idea por primera vez, observado en 2 sesiones en iPad.

**Diagnóstico:** no era un bug de lógica del componente sino de sesión de Supabase expirada silenciosamente en dispositivo inactivo. Al refrescar, la sesión se renueva y todo funciona. Las sesiones se renuevan automáticamente con la app activa.

**Resolución:** cerrado como no reproducible en condiciones normales de uso. El único hardening posible sería mejorar la visibilidad del mensaje de error con el teclado abierto en iOS — diferido a backlog de baja prioridad.

### 4.3 Prellenar perfil desde onboarding

**Problema:** los datos capturados en el onboarding no rellenaban los campos de la página "Mi Perfil", obligando al usuario a repetir información.

**Fix:** los datos del onboarding ahora se persisten correctamente en los campos correspondientes del perfil. Causa raíz: `create-user-profile` usaba el cliente anon para el insert en `user_profiles` — RLS bloqueaba silenciosamente. Fix: cambiar a `supabaseAdmin`.

**Archivos afectados:** Edge Function `create-user-profile`.

### 4.4 Topbar de página de Contenidos — contador irrelevante

**Problema:** el topbar de la página de Contenidos mostraba un contador que no aportaba contexto ni valor.

**Fix:** reemplazado por subtítulo descriptivo: "Todo lo que has creado, en un solo lugar."

**Archivos afectados:** componente de topbar de la página de Contenidos, i18n.

---

## 5. Fase C — Mejoras de UX

### 5.1 Tour — modal centrado con overlay (A1)

**Cambio:** el banner delgado del tour fue reemplazado por un modal centrado con overlay oscuro que bloquea la interacción con la app. El usuario debe tomar una decisión consciente antes de entrar:

- "Muéstrame →" — inicia el tour (botón primario, slate)
- "Después" — pospone hasta el próximo login (botón secundario con borde)
- "No mostrar de nuevo" — cancela definitivamente (link de texto discreto, separado por línea)

La lógica de cuándo mostrar, cómo avanzar y cómo marcar como completado no cambió — solo la presentación.

**Archivos afectados:** componente del tour/modal de bienvenida, estilos.

### 5.2 Botón "Intentar de nuevo" — más notoriedad (A2)

**Problema:** el botón que aparece al calificar mal una sección del brief se camuflaba con el texto circundante por fondo blanco y tamaño de letra similar.

**Cambio:** ajustes visuales para darle más peso y visibilidad al botón.

**Archivos afectados:** RecipePanel.tsx, estilos del brief.

### 5.3 Scroll interno en input de temas de la card de idea (A5)

**Problema:** cuando una idea tenía muchos temas asociados, la card de idea crecía indefinidamente.

**Cambio:** añadido scroll interno al input/contenedor de temas en la card.

**Archivos afectados:** componente de card de idea, estilos.

### 5.4 Ampliar textarea de contexto 500 → 1000 caracteres (A6)

**Problema:** usuarios avanzados agotaban los 500 caracteres del contexto y tenían que simplificar sus instrucciones a la IA, perdiendo precisión en el resultado.

**Cambio:** límite ampliado a 1000 caracteres. Contador actualizado.

**Archivos afectados:** modal de creación/edición de idea, validación, i18n del contador.

### 5.5 Botón crear tema más prominente que buscar (A4)

**Problema:** 4-5 participantes intentaron crear temas en la barra de búsqueda porque el input de búsqueda tenía más peso visual que el botón de crear.

**Cambio:** buscador movido a la misma fila que el input de crear + botón Agregar. Estilos unificados — el input de agregar marca el estilo de referencia. Placeholder del buscador actualizado con ejemplos: "Buscar tema... ej. moda, alpinismo".

**Archivos afectados:** componente de la pestaña de temas, estilos, i18n.

### 5.6 Guía de 3 pasos — página de Ideas (A7)

**Nuevo componente:** franja de orientación permanente en la parte superior de la página de Ideas, junto al botón "+ Nueva idea". Comunica el flujo completo de la plataforma desde el primer uso.

Pasos:
1. **Crea una idea** y agrégale temas
2. **Elige plataforma**, formato y rol
3. **Genera el brief**, califica cada sección y apruébalo

Responsive: desktop/laptop en franja horizontal con divisores verticales; tablet apilado verticalmente.

**Archivos afectados:** nuevo componente `StepsGuide.tsx`, página de Ideas, i18n (ES y EN).

### 5.7 Guía de 3 pasos — página de Contenidos (A7 complemento)

**Nuevo componente:** misma estructura que el de Ideas, aplicado en la página de Contenidos.

Pasos:
1. **Agrega contenidos** que ya publicaste
2. **Convierte un contenido en idea** para desarrollarlo en otros formatos y plataformas
3. **Usa los filtros** para encontrar fácilmente tus contenidos

**Archivos afectados:** `StepsGuide.tsx` (reutilizado con prop `namespace`), página de Contenidos, i18n.

### 5.8 Topbar de página de Ideas — subtítulo descriptivo

**Cambio:** el topbar "Ideas y Temas" ya tenía subtítulo. Se confirma y mantiene: "Donde tus ideas se convierten en contenido."

---

## 6. Decisiones de producto documentadas

### 6.1 Campo "Ubicación" — mantener nombre, mejorar placeholder

Cuatro de seis participantes confundieron "Ubicación" con ciudad o lugar geográfico. Se decidió no renombrar el campo sino ampliar el placeholder para incluir ubicaciones digitales como Google Drive o la nube. El rename completo se abordará en el rediseño del modal de edición de contenido.

**Estado:** pendiente para rediseño modal de edición.

### 6.2 Renombrar sección "Identidad e Insights"

Tres participantes no entendieron el término "insights" o lo asociaron con identidad visual de marca. Se decidió posponer el cambio hasta completar las entrevistas restantes para validar con más perfiles antes de actuar.

**Estado:** pendiente de validación.

### 6.3 Mensaje de confirmación antes de generar brief sin temas — mantener

Se evaluó si era necesario un mensaje adicional invitando a crear temas antes del brief. Se decidió que el modal de confirmación existente es suficiente.

**Estado:** descartado. Sin cambios.

---

## 7. Backlog activo (no implementado en esta versión)

| Item | Descripción | Origen |
|---|---|---|
| V4 | Micro-copy campo Ubicación + label "Ubicación de almacenamiento" | Abordar en rediseño modal de edición de contenido |
| A3/N7 | Tooltips contextuales — requiere análisis de estrategia de implementación | Implementación inicial generó problemas; diferido |
| N8 | Dos combinaciones iguales comparten temas | Reabrir solo si se reproduce en producción |
| N9 | Extensiones de traducción del navegador rompen la UI | Investigar protección del DOM externo |

---

## 8. Pendientes activos para v2.1.0

Los siguientes cambios están especificados y aprobados pero no implementados.

| # | Cambio | Referencia |
|---|---|---|
| 1 | Bug: brief que vuelve a habilitar "Crear contenido" tras modificar calificaciones | Resumen de trabajo pendiente — chat de desarrollo |
| 2 | Eliminar modal de creación de contenido desde idea | Instrucciones de desarrollo — Rediseño del flujo de creación de contenido |
| 3 | Botón "Crear contenido" → "Ver contenido" tras conversión | Instrucciones de desarrollo — Rediseño del flujo de creación de contenido |
| 4 | Duplicación de idea (título + contexto + combinación, nuevo ID, sin brief) | Instrucciones de desarrollo — Rediseño del flujo de creación de contenido |
| 5 | N1: setear calificación a 4 al elegir alternativa del brief | Resumen de trabajo pendiente — chat de desarrollo |
| 6 | N9: extensiones de traducción rompen la UI | Backlog |

---

## 9. Investigación de usuarios — referencia

Esta versión es la primera en incorporar cambios derivados de investigación cualitativa formal.

**Fase 1 completada:** 6 entrevistas en profundidad con creadoras de contenido (mayo–junio 2026).

**Documento de referencia:** Creadora — Investigación de Usuarios Fase 1 · Documento consolidado de hallazgos y recomendaciones priorizadas · Junio 2026.

**Hallazgo central:** product-market fit confirmado en el segmento de creadores profesionales. Ninguna participante conocía una herramienta equivalente.

---

_Creadora · Changelog v12.0 · Junio 2026_
_Documento vivo. Actualizar tras cada ciclo de desarrollo._