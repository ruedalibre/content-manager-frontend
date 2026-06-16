# Content Intelligence Platform
## Changelog de Desarrollo — v3.0
**Security Audit, Fase 3 Creator Identity, Refactoring & Mejoras · Abril 2026 · Uso interno**

---

## 1. Propósito de este documento

Este documento registra todos los cambios implementados después del CHANGELOG_v2. Cubre el security audit de los tres repositorios del proyecto, los fixes de vulnerabilidades detectadas, la implementación completa de la Fase 3 — Creator Identity, el refactoring de Ideas.tsx, nuevas features en RecipePanel, mejoras en la tabla de Contents y correcciones de lógica de negocio.

Documentos de referencia previos:
- CHANGELOG_v2 — Implementación de IA, Onboarding y Sistema de Recetas
- CHANGELOG_v1 — cambios post-auditoría inicial
- AUDIT_EXECUTIVE_SUMMARY_v1 — estado inicial del sistema

---

## 2. Resumen Ejecutivo

| **1** Fase completada | **3** Nuevos endpoints | **6** Tipos actualizados | **18** Bugs resueltos |
|---|---|---|---|

---

## 3. Security Audit — Tres Repositorios

Auditoría de seguridad de solo lectura ejecutada por Claude Code sobre los repos backend (47 Edge Functions), frontend app y landing page. Se identificaron 2 críticos y 19 importantes. Todos los críticos e importantes fueron resueltos.

### 3.1 Hallazgos y resolución

| Severidad | Hallazgo | Archivo | Estado |
|---|---|---|---|
| 🔴 Crítico | JWT decode manual sin verificar firma | `me-contents/index.ts:18-23` | ✅ RESUELTO |
| 🔴 Crítico | console.log expone tokens de sesión en producción | `Login.tsx:39` | ✅ RESUELTO |
| 🟡 Importante | JWT validación ausente | `platforms/index.ts` | ✅ RESUELTO |
| 🟡 Importante | JWT validación ausente | `platform-formats/index.ts` | ✅ RESUELTO |
| 🟡 Importante | Endpoint público sin documentar intención | `early-access-stats/index.ts` | ✅ RESUELTO |
| 🟡 Importante | Header `apikey` enviado a Edge Functions | `useDashboardData.ts:45`, `CreateIdeaModal.tsx:78` | ✅ RESUELTO |
| 🟡 Importante | RLS faltante en `content_topics`, `content_tags`, `tags`, `topics` | Migraciones SQL | ✅ RESUELTO |

### 3.2 Estado post-audit

**Backend:** 0 críticos, 0 importantes activos. Las 9 funciones SECURITY DEFINER permanecen como deuda técnica documentada — todas tienen `SET search_path = public` como mitigación.

**Frontend App:** 0 críticos. Los importantes de hooks sin estado de error y fetch directo en componentes se mantienen en backlog.

**Landing:** 0 críticos. Los 4 items de mejora (headers HTTP, `.env.example`, etc.) están en backlog.

---

## 4. Extensión del Endpoint content-dna

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Backend Functions | `format_distribution`: distribución de formatos con count y percentage | Nuevo campo |
| 🆕 NUEVO | Backend Functions | `role_distribution`: top 3 roles con porcentaje | Nuevo campo |
| 🆕 NUEVO | Backend Functions | `platform_distribution`: plataformas con nombre resuelto y porcentaje | Nuevo campo |
| 🆕 NUEVO | Backend Functions | `top_ideas` cambiado de `string[]` a `{ title, content_count }[]` — slice ampliado a 5 | Breaking change tipado |
| 🆕 NUEVO | Backend Functions | `publishing_rhythm`: `{ avg_per_week, total_contents, weeks_active }` | Nuevo campo |
| ✅ RESUELTO | Backend Functions | Queries migrados de `supabaseAdmin+join` a `supabase+.in(contentIds)` | Bug crítico datos cruzados |
| ✅ RESUELTO | Backend Functions | Filtro por `user_id` agregado — excluye contenidos de otros usuarios del mismo tenant | Bug datos |

Se detectó que el endpoint filtraba por `tenant_id` únicamente, trayendo contenidos de todos los usuarios del tenant. En el caso del founder, el tenant contenía 594 registros de un usuario de prueba creados con script de poblado masivo, generando un DNA incorrecto de 645 contenidos en lugar de los 51 reales. El filtro por `user_id` fue agregado para que el DNA refleje exclusivamente la producción del creador autenticado.

---

## 5. Fase 3 — Creator Identity

### 5.1 Concepto

La página `/identity` es el espejo donde el creador se mira periódicamente para ver cómo ha evolucionado su identidad creativa. Describe quién es el creador — sus patrones, temas dominantes, formatos, ritmo — con inteligencia artificial generando interpretaciones personalizadas.

### 5.2 Estructura de la página — 8 secciones

1. **Content DNA** — 4 stat cards: total contents, ideas linked, topics active, avg/week
2. **Standout Insights** — 3 frases generadas por Claude con skeleton loaders
3. **Top Topics + Formats** — dos columnas con barras de distribución y expandible de insight
4. **Top Ideas + Platforms** — ideas rankeadas por contenidos generados y distribución de plataformas con expandibles
5. **Content Roles** — top 3 roles con porcentaje y expandible
6. **Publishing Activity** — card siempre visible con insight de `content_production`
7. **Creative Style** — tags generados por Claude

### 5.3 Cambios implementados

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | `src/app/routes/Identity.tsx` — página completa con 8 secciones | Componente principal |
| 🆕 NUEVO | Frontend App | `src/app/routes/Identity.scss` — estilos consistentes con la app | Estilos |
| 🆕 NUEVO | Frontend App | `src/features/insights/hooks/useIdentityAI.ts` — llama a `me-identity-insights` | Hook nuevo |
| 🆕 NUEVO | Frontend App | Tipos `TopIdea`, `PublishingRhythm` en `insights.types.ts` | Tipado |
| 🆕 NUEVO | Frontend App | `InsightExpander` — toggle inline "See insight / Hide insight" por sección | Componente |
| 🆕 NUEVO | Frontend App | Sección "Publishing activity" siempre expandida | UX |
| ✅ RESUELTO | Frontend App | `ContentDNA` type extendido con todos los nuevos campos | Tipado |
| ✅ RESUELTO | Frontend App | Sidebar: `Brain` → `Sparkles`, `/insights` → `/identity`, label `Identity & Insights` | Navegación |
| ✅ RESUELTO | Frontend App | `Insights.tsx` redirige a `/identity` con `<Navigate replace />` | Deprecación |
| ✅ RESUELTO | Frontend App | `App.tsx`: ruta `/identity` registrada con `AuthGuard` | Routing |

### 5.4 Nueva Edge Function: me-identity-insights

Recibe el DNA completo via POST y llama a Anthropic para generar `standout_insights` (3 frases personalizadas) y `creative_style_tags` (5-6 tags). Modelo: `claude-sonnet-4-5`. Max tokens: 800.

### 5.5 Integración de me-insights en /identity

| Sección | Code |
|---|---|
| Top Topics | `dominant_topic` |
| Formats | `best_format` |
| Platforms | `top_platform` |
| Top Ideas | `idea_reuse` |
| Content Roles | `content_role` |
| Publishing Activity | `content_production` (siempre visible) |

---

## 6. Refactoring — Ideas.tsx

`Ideas.tsx` tenía 1192 líneas. Se desacoplaron los componentes a archivos independientes.

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | `src/features/ideas/components/StatusBadge.tsx` | Extraído |
| 🆕 NUEVO | Frontend App | `src/features/ideas/components/RecipeCard.tsx` | Extraído |
| 🆕 NUEVO | Frontend App | `src/features/ideas/components/RecipePanel.tsx` | Extraído + nuevas features |
| 🆕 NUEVO | Frontend App | `src/features/ideas/components/EditIdeaModal.tsx` | Extraído |
| ✅ RESUELTO | Frontend App | `Ideas.tsx` reducido a lógica de estado + render principal | Limpieza |

---

## 7. RecipePanel — Nuevas Features

### 7.1 Emojis de rating con tooltips

| Rating | Emoji | Tooltip | Acción |
|---|---|---|---|
| 1 | 😞 | "Completely off — needs a different approach" | Regenerar |
| 2 | 😕 | "Not convincing — try again" | Regenerar |
| 3 | 😐 | "Could be better — suggest an adjustment" | Regenerar |
| 4 | 🙂 | "Good — keeping this" | Solo guardar |
| 5 | 😄 | "Excellent — love it" | Solo guardar |

### 7.2 Regeneración por aspecto

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Backend Functions | `regenerate-aspect` — genera alternativa para aspecto específico via Claude | Nuevo endpoint |
| 🆕 NUEVO | Frontend App | Botón "↺ Try again" por aspecto cuando rating ≤ 3 | UX |
| 🆕 NUEVO | Frontend App | Máximo 3 alternativas por aspecto apiladas para comparar | UX |
| 🆕 NUEVO | Frontend App | "Use this" elige alternativa, limpia las demás y guarda en BD | UX |
| 🆕 NUEVO | Frontend App | "No more suggestions for this aspect" al agotar intentos | UX |
| 🆕 NUEVO | Backend Functions | `update-creative-session` acepta campo `recipe` para guardar aspecto elegido | Extensión |
| 🆕 NUEVO | Frontend App | `updateRecipeAspect` y `regenerateAspect` en `useIdeas` | Hook |
| ✅ RESUELTO | Backend Functions | Fix parsing `structure` — limpiar markdown, max_tokens aumentado a 800 | Bug |

### 7.3 Approve sin cerrar modal

Botón "Approve" cambia a verde ✓ y se desactiva. "Create content →" permanece visible.

### 7.4 Mensaje de discard

Al descartar, el recipe card muestra: "Try varying your combination — change topics, platform or format to get a different recipe."

---

## 8. Mejoras en Contents

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | Columnas `published_at` y `archived_at` en tabla de Contents | Feature |
| 🆕 NUEVO | Backend Functions | `me-contents-history` devuelve `archived_at` | Extensión |
| ✅ RESUELTO | Backend Functions | `update-content`: lógica correcta de fechas para todas las transiciones | Bug lógica |

### 8.1 Lógica de fechas por transición de status

| Transición | `published_at` | `archived_at` |
|---|---|---|
| → published | Auto-fill si no existe | null |
| → archived | Sin tocar — dato histórico | Auto-fill si no existe |
| → draft | null | null |
| Edición manual | Respeta valor enviado | Respeta valor enviado |

---

## 9. Limpieza de Datos de Desarrollo

- 594 contenidos del usuario `test@demoruedalibre.com` eliminados
- 51 contenidos de prueba del founder eliminados
- 15 ideas de prueba eliminadas
- 9 topics con nombres inválidos eliminados
- Usuario auth `test@demoruedalibre.com` eliminado
- 5 topics válidos conservados: Artificial Intelligence, Content Strategy, Creator Economy, Productivity, Marketing

---

## 10. Fixes Técnicos

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ RESUELTO | Frontend App | ESLint `tsconfigRootDir` apuntando a `tsconfig.app.json` — resuelve conflicto con worktrees | Config |
| ✅ RESUELTO | Frontend App | `insights.types.ts` restaurado con tipos completos tras merge que lo revirtió | Bug |

---

## 11. Decisiones Arquitectónicas Tomadas en v3

**11.1 Un endpoint, dos consumidores**

`content-dna` sirve tanto a `/identity` (cards) como a `me-identity-insights` (prompt de IA). No se duplicó lógica. Base para Fase 5 — Informe Creativo, donde `me-creative-report` llamará internamente al mismo DNA.

**11.2 Insights de IA en carga de página**

Standout insights y creative style tags se generan en la carga con skeleton loaders. Latencia de Claude (~2-3s) aceptable con skeleton loaders.

**11.3 /insights deprecada sin eliminar**

Redirigida a `/identity` con `<Navigate replace />`. `Insights.tsx` se elimina en Fase 7.

**11.4 DNA Snapshots — feature futura documentada**

El creador podrá "fotografiar" su DNA en momentos específicos para ver evolución creativa en el tiempo. Requiere tabla `dna_snapshots`. Agendado post-lanzamiento.

**11.5 Informe Creativo — visión documentada**

Fase 5: carta que Claude escribe al creador con 4 capas — identidad, estado actual, oportunidad sin explotar y pregunta provocadora. Incluirá web search del estado del arte del topic dominante.

**11.6 Flexibilidad total en transiciones de status**

El creador tiene control completo sobre el status de sus contenidos. Las fechas se manejan automáticamente según la transición pero respetan ediciones manuales.

---

## 12. Roadmap Activo — Fases Pendientes

| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ COMPLETADO | Fase 3 | Creator Identity — `/identity` con DNA completo + IA + insights expandibles | Esta versión |
| 📋 PENDIENTE | Fase 3 — extensión | DNA completeness indicator — % de contenidos con topics e ideas vinculadas | Alta prioridad |
| 📋 PENDIENTE | Fase 3 — extensión | `strategy-insights` en `/identity` — cuando haya suficientes datos | Media prioridad |
| 📋 PENDIENTE | Fase 4 | Insights automáticos v2 — señales detectadas sin acción del creador | Alta prioridad |
| 📋 PENDIENTE | Fase 5 | Informe Creativo — narrativa profunda bajo demanda con Claude + web search | Media prioridad |
| 📋 PENDIENTE | Fase 6 | Content System View — vista de conjuntos idea + topics + contenidos | Media prioridad |
| 📋 PENDIENTE | Fase 7 | Pulido y lanzamiento — primer batch de early adopters | Baja prioridad |
| 📋 PENDIENTE | Feature futura | DNA Snapshots — fotografía del DNA para ver evolución creativa en el tiempo | Backlog |
| 📋 PENDIENTE | Feature | Design system — variables CSS, tokens, colores, tipografía, escalas | Antes de Fase 7 |
| 📋 PENDIENTE | Feature | Sistema de nomenclatura para contenidos | Backlog |
| 📋 PENDIENTE | Feature | Perfil de usuario en UI — language, country, timezone, role | Backlog |
| 📋 PENDIENTE | Feature | Tags — sprint dedicado con modelo completo | Backlog |
| 📋 PENDIENTE | Feature | Market Intelligence Dashboard | Backlog |
| 📋 PENDIENTE | Arquitectura | SECURITY DEFINER → SECURITY INVOKER (9 funciones) | Deuda técnica |
| 📋 PENDIENTE | Arquitectura | Migración de historial externo | Futuro |
| 📋 PENDIENTE | Limpieza | Eliminar `Insights.tsx` | Fase 7 |

---

_Content Intelligence Platform · Changelog v3.0 · Abril 2026_
_Documento vivo. Actualizar tras cada ciclo de desarrollo._