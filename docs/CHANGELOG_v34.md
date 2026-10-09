# Changelog v34 — v2.16.0 (app)

## Rol UGC + 3 bugs críticos de sesión y brief

**Fecha:** Octubre 2026
**Versión:** v2.16.0 (frontend + backend) · Landing sin cambios
**Tipo:** Minor — nueva funcionalidad (rol UGC) + correcciones
**Objetivo:** Soportar UGC como rol de contenido, con un brief adaptado a ese caso, y corregir fallos que afectaban a usuarios reales

---

## Nuevo: rol de contenido UGC

UGC (contenido generado por usuario) se ha vuelto central para los creadores y varias entrevistadas lo pidieron. Se modela como **rol** (intención y voz del contenido) y no como formato: un UGC puede ser un Reel, un TikTok o un video largo.

**Base de datos**

- Migración: `ALTER TYPE content_role ADD VALUE IF NOT EXISTS 'ugc'` (enum pasa de 6 a 7 valores). El valor solo se agrega, sin usarse en la misma transacción.

**Frontend**

- `ugc` agregado a los selects de `CreateContentModal.tsx`, `IdeaCard.tsx` y al filtro de `Contents.tsx`.
- i18n: `contentRoles.ugc` en `es.json` y `en.json` ("UGC").
- Estilo del badge `role--ugc` [verificar si hizo falta: depende de si existen reglas `role--*` en el SCSS].

**Backend — `generate-recipe`**

- Nueva función `getRoleGuidance(role)`, que solo aplica a `ugc` y se inyecta tras la línea "Rol del contenido". Para el resto de roles devuelve texto vacío.
- Reglas del bloque: punto de partida honesto (no atribuir resultados ni acciones que el creador no mencionó; si está empezando, el UGC es de proceso), voz hablada (gancho y cada paso con frase literal "Decir" y "Mostrar"), sin tono de anuncio ni promesas de viralidad, marcadores `[...]` donde falta un dato real, y gancho con tensión.
- Se probó con una idea de principiante (hidroponía, Reel): el brief dejó de inventar resultados y entregó frases habladas.

**Decisiones**

- `ugc` **no** se agrega a `ALL_ROLES` de `me-identity-insights`. Se evita que el insight "role_blindspot" le sugiera UGC a todo creador que no lo hace.
- Ningún Edge Function valida roles, así que la migración es el único cambio de esquema.

---

## Correcciones

**1. "Crear contenido" duplicaba el contenido con doble clic** (`RecipePanel.tsx`)

- Causa: no había guarda contra un segundo envío mientras la llamada seguía en curso.
- Fix: `useRef` como guarda síncrona + estado `creatingContent` para deshabilitar el botón y mostrar "creando...".

**2. No se podía regenerar la sección CTA (ni otras secciones según plataforma/formato/rol)**

- Causa: `regenerate-aspect` solo aceptaba un conjunto fijo de aspectos y trataba como lista solo `structure`.
- Fix en `regenerate-aspect`: `VALID_ASPECTS` completo (angle, hook, tone, structure, argument, cta, retention, engagement, seo), `LIST_ASPECTS` (structure, retention, engagement), contexto de regeneración genérico (todos los aspectos de la receta, excepto el que se regenera).
- Fix en `RecipePanel.tsx`: el fallback de listas usa `isList` del aspecto en lugar de comparar con `"structure"`.

**3. El tour guiado salía en inglés aunque el usuario eligió español**

- Causa más probable: el perfil se creaba sin el idioma elegido por el usuario en el login y la app dependía del idioma del navegador/perfil.
- Fix en `create-user-profile`: acepta `preferred_language` en el body (`es`/`en`), con la cabecera `Accept-Language` solo como respaldo.
- Fix en `useUserProfile.tsx`: `createProfile` envía `preferred_language` según `i18n.language`; `skipOnboarding` pasa por el mismo camino.
- **Validación pendiente:** prueba end-to-end con una cuenta nueva (navegador en inglés, español en el login, tour en español, `preferred_language = 'es'` en BD).

**Revisado y descartado: "la fecha de publicación desapareció del modal"**

- No es un bug: el campo solo aparece cuando el estado es "Publicado", por diseño. Sin cambios.

---

## Incluido en este ciclo [verificar]

- Extensión del trial hasta 30 de noviembre de 2026.
- Gating de creación de workspaces.
- Orden por último login en el panel Admin.

---

## Pendientes

- Prueba end-to-end del fix de idioma (arriba).
- Estilo `role--ugc`, si aplica.
- Opcional: `isRated` en `RecipePanel` para ocultar las caras de calificación en el aspecto `seo` (`requiresGoodRating: false`).
- Opcional: el system prompt de `regenerate-aspect` dice "no JSON" y contradice a los aspectos tipo lista.
- Opcional: hacer `create-content` idempotente por `session_id`.
- Opcional: `regenerate-aspect` no recibe el rol, así que regenerar gancho/CTA no conoce el contexto UGC.
- Opcional: la nota estratégica del brief cita el historial; asegurar que solo lo haga si hay contenidos relacionados.
- Selección múltiple de roles (#8 del roadmap): subirle prioridad por el solapamiento UGC / promocional / comercial.
- Opcional: campo "cómo hablo" en el perfil para capturar la voz del creador.
- Pendientes de bloques anteriores: CSP, timeout de inactividad en servidor, Roadmap v5 y actualización de las instrucciones del proyecto (aún con fechas de agosto).
- Baseline de lint: `npm run lint` pasó de 169 problemas a 41 (20 errores, 21 warnings) tras ignorar `.claude` en ESLint. Restan 15 `no-explicit-any` (14 en `Admin.tsx`), 4 `only-export-components`, 1 `set-state-in-effect` y 20 `exhaustive-deps`. Tarea aparte; los `any` se resuelven mejor junto con el desacople de `Admin.tsx`.

---

## Operacional

**Git tags:** Frontend `v2.16.0` · Backend `v2.16.0`
**Limpieza de repo (commit aparte, antes del release):**
- Eliminado el worktree de Claude que estaba versionado como repositorio embebido (`.claude/worktrees/wonderful-dijkstra-9519be`) y borradas ~70 ramas `claude/*` locales ya integradas en `main` (3 sin integrar con contenido ya reemplazado; `tooltip-component` archivada como etiqueta `archive/tooltip-component`).
- `eslint.config.js`: `.claude` agregado a los ignores.

**Despliegue:**

- Migración: `supabase db push` (enum `content_role`).
- Edge Functions: `generate-recipe`, `regenerate-aspect`, `create-user-profile`.
- Frontend: Vercel redeploy. Actualizar `VITE_APP_VERSION` a `2.16.0`.
