# Creadora
## Changelog de Desarrollo — v14.0
**Avatar con Iniciales, FAQ, Cards Colapsables, Desacoplamiento Ideas.tsx & Bug Fixes · Junio 2026 · Uso interno**

---

## 1. Propósito de este documento

Este documento registra todos los cambios implementados después del CHANGELOG_v13 (v2.1.0). Cubre la personalización del sidebar con avatar de iniciales y saludo con nombre, la página de preguntas frecuentes, las cards colapsables de ideas, el desacoplamiento de `Ideas.tsx` en componentes reutilizables, y una serie de bugs resueltos.

Documentos de referencia previos:
- CHANGELOG_v13 — Brief Flow Redesign, Idea Duplication, Audit v2 & Bug Fixes
- CHANGELOG_v12 — User Research Fixes, UX Improvements, Tour Redesign & Copy Updates

**Tag de versión:** `v2.2.0`

---

## 2. Resumen ejecutivo

| 5 Features nuevas | 4 Bugs resueltos | 2 Refactors | 1 Decisión de producto |
|---|---|---|---|

---

## 3. Features nuevas

### 3.1 Avatar con iniciales + saludo personalizado en sidebar

El sidebar ahora muestra el nombre del creador con un saludo personalizado y un avatar de iniciales con color único derivado del `user_id`.

**Comportamiento:**
- Las iniciales se calculan así: dos palabras → primera letra de cada una (`AR`); una sola palabra → primeras dos letras (`RU`)
- El color de fondo es inmutable — se deriva del `user_id` mediante hash, no del nombre
- El saludo se actualiza automáticamente al guardar cambios en el perfil, via evento `profile-updated` en `globalThis`
- En sidebar colapsado: solo el círculo de iniciales, sin texto
- El campo `avatar_config JSONB DEFAULT '{}'` fue agregado a `user_profiles` via migración — reservado para uso futuro

**Archivos afectados:** `Sidebar.tsx`, `Sidebar.scss`, `Profile.tsx`, `useUserProfile.ts`, migración `add_avatar_config_to_user_profiles`, `es.json` / `en.json`

---

### 3.2 Página de preguntas frecuentes (FAQ)

Nueva página pública en `/faq` con 6 categorías y acordeón interactivo. El contenido fue desarrollado a partir de los hallazgos de las entrevistas de usuario de Fase 1.

**Categorías:**
1. El producto
2. El flujo de trabajo
3. Ideas y contenidos
4. Identidad e Insights
5. Planes y precios
6. Privacidad y datos

**Comportamiento:** acordeón de apertura única — al abrir una pregunta se cierra la anterior. Reutiliza los estilos de `Legal.scss` para consistencia con Términos y Privacidad.

**Acceso:** link en el footer de la app junto a Términos y Privacidad.

**Archivos afectados:** `FAQ.tsx` (nuevo), `FAQ.scss` (nuevo), `App.tsx` (ruta `/faq`), `Footer.tsx` (link), `es.json` / `en.json`

---

### 3.3 Cards colapsables de ideas

Las cards de ideas ahora son colapsables para reducir el scroll vertical en creadores con muchas ideas.

**Comportamiento:**
- Estado por defecto: colapsado para creadores con >10 ideas, expandido para ≤10 (umbral `COLLAPSE_THRESHOLD = 10`)
- Estado colapsado: muestra badge (Manual/Sugerida) + título completo sin recortar + conteo de contenidos
- El título trunca con `...` solo en una línea en estado colapsado
- Los controles de acción (editar, duplicar, archivar, eliminar) aparecen al hacer hover
- Estado expandido: descripción + temas + selectores de plataforma/formato/rol + footer con botón Generar
- Botón "Expandir todas / Colapsar todas" en el toolbar
- Las cards de brief se colapsan junto con las de ideas, con altura fija equivalente a 3 filas de brief

**Layout del estado colapsado (Opción A — dos líneas):**
```
[ chevron ] [ Manual ]                    [ controles al hover ]
La debilidad e incoherencia de los líderes de centro izquierda
2 contenidos
```

**Archivos afectados:** `IdeaCard.tsx`, `Ideas.tsx`, `Ideas.scss`, `es.json` / `en.json`

---

### 3.4 Toolbar de ideas rediseñado

El buscador de ideas ocupa el 50% del ancho del toolbar (alineado con la columna de ideas). Los filtros y estadísticas se ubican a la derecha. En pantalla angosta los filtros bajan a una segunda línea.

**Archivos afectados:** `Ideas.scss`

---

### 3.5 Último login en panel de administración

La tabla de usuarios del admin panel ahora muestra la fecha de último login de cada usuario, obtenida desde `auth.users` via `serviceSupabase.auth.admin.getUserById`.

**Archivos afectados:** `admin-users-list/index.ts`, `Admin.tsx`, `es.json` / `en.json`

---

## 4. Refactors

### 4.1 Desacoplamiento de `Ideas.tsx`

`Ideas.tsx` fue desacoplado en componentes y hooks reutilizables para reducir su tamaño (~1500 líneas) y facilitar el mantenimiento.

**Extracciones realizadas:**

| Archivo | Contenido |
|---|---|
| `useIdeaCardState.ts` | Estado de `recipeState` e `ideaFormats` — inicialización por idea, `getRecipeStateForIdea`, `updateRecipeState`, `handlePlatformChange` |
| `IdeaCard.tsx` | Componente de card de idea completo — todos los modos (normal, edición, selector de temas, controles, footer) |

**Pendiente para próximo ciclo:** `TopicsTab.tsx`, `ArchivedTab.tsx`, `TopicSystemModal.tsx`, `useArchivedIdeas.ts`

**Archivos afectados:** `useIdeaCardState.ts` (nuevo), `IdeaCard.tsx` (nuevo), `Ideas.tsx` (reducido)

---

### 4.2 Migración de BD — `avatar_config`

```sql
ALTER TABLE user_profiles
ADD COLUMN avatar_config JSONB DEFAULT '{}';
```

Aplicada via `supabase migration new add_avatar_config_to_user_profiles` + `supabase db push`.

---

## 5. Bugs resueltos

### 5.1 Nudge de perfil incompleto aparecía con perfil al 100%

**Problema:** la condición `profileIncomplete` en `Identity.tsx` verificaba `idea_sources`, un campo del onboarding que no aparece en la barra de progreso de perfil. Un creador con perfil "100% completo" según la barra de progreso podía ver el nudge igualmente si `idea_sources` estaba vacío.

**Fix:** alinear los campos verificados por `profileIncomplete` con los mismos 5 campos que mide la barra de progreso: `time_availability`, `production_setup`, `display_name`, `country_code`, `creator_role`.

**Archivo afectado:** `Identity.tsx`

---

### 5.2 Ideas generadas se duplicaban como "Manual"

**Problema:** al duplicar una idea con `source: "generated"`, la copia recibía `source: "manual"` independientemente del origen de la idea original.

**Fix:** en `duplicateIdea`, cambiar `source: "manual"` por `source: idea.source ?? "manual"`.

**Archivo afectado:** `useIdeas.ts`

---

### 5.3 Avatar del sidebar no se actualizaba al guardar perfil

**Problema:** `useUserProfile` es un hook independiente por instancia. Al guardar en `Profile.tsx`, solo se actualizaba la instancia local del hook — el sidebar tenía su propia instancia que no se enteraba del cambio.

**Fix:** `Profile.tsx` dispara `globalThis.dispatchEvent(new CustomEvent("profile-updated"))` al guardar. `Sidebar.tsx` escucha el evento y llama `loadProfile()` para recargar.

**Archivos afectados:** `Profile.tsx`, `Sidebar.tsx`

---

### 5.4 Nombre largo en sidebar aparecía recortado

**Problema:** `.sidebar__greeting` tenía `white-space: nowrap` y `overflow: hidden`, recortando nombres largos.

**Fix:** reemplazar por `overflow-wrap: break-word` y `word-break: break-word`.

**Archivo afectado:** `Sidebar.scss`

---

## 6. Decisión de producto documentada

### 6.1 Avatar personalizable tipo personaje — pausado

Se investigó e intentó implementar un editor de avatar tipo personaje con DiceBear (estilo `avataaars`), incluyendo controles para tono de piel, cabello, vello facial, ojos, cejas, boca, ropa y accesorios.

**Bloqueante técnico:** incompatibilidad entre el caché del navegador y la API HTTP de DiceBear — la imagen no se re-renderizaba al cambiar parámetros aunque la URL cambiaba correctamente. El paquete npm `@dicebear/styles` tiene conflictos de compatibilidad con Vite.

**Decisión:** pausado indefinidamente. Se implementó el avatar de iniciales como solución definitiva para esta fase. El campo `avatar_config` en BD queda reservado para una implementación futura cuando se resuelva la compatibilidad técnica.

**Nota adicional:** el seed del avatar no debe depender del `display_name` (mutable) sino del `user_id` (inmutable) para evitar que un cambio de nombre rompa el avatar guardado.

---

## 7. Backlog activo (no implementado en esta versión)

| Item | Descripción | Origen |
|---|---|---|
| N9 | Extensiones de traducción del navegador rompen la UI — pendiente de identificar términos específicos | Entrevistas de usuario |
| Avatar personaje | DiceBear avataaars — bloqueado por incompatibilidad browser cache + API HTTP | Esta sesión |
| TopicsTab.tsx | Extraer pestaña de temas de Ideas.tsx | Deuda técnica |
| ArchivedTab.tsx | Extraer pestaña de archivados de Ideas.tsx | Deuda técnica |
| TopicSystemModal.tsx | Extraer modal de sistema de temas | Deuda técnica |
| useArchivedIdeas.ts | Extraer hook de ideas archivadas | Deuda técnica |
| V4 | Micro-copy campo Ubicación + label "Ubicación de almacenamiento" | Rediseño modal de edición |
| B-02 a B-07 | Mejoras de auditoría backend | AUDIT_v2_Junio2026 |
| F-01 a F-04 | Mejoras de auditoría frontend | AUDIT_v2_Junio2026 |
| Pantalla elección de perfil | Pre-login — diferida | Roadmap Fase 1 |
| Demo del producto | Tour interactivo o video — diferido | Roadmap Fase 1 |
| Revisión profunda de prompts IA | Calidad de briefs e insights | Roadmap Fase 1 |

---

_Creadora · Changelog v14.0 · Junio 2026_
_Documento vivo. Actualizar tras cada ciclo de desarrollo._
