# Content Intelligence Platform — Contexto para Claude Code

## Qué es este proyecto

SaaS dirigido a creadores de contenido independientes, equipos de marketing y profesionales
de la creator economy. Ayuda a los creadores a entender cómo sus ideas evolucionan en
sistemas de contenido escalables.

La unidad central de análisis es la idea, no el post ni la métrica de engagement.

Loop central: Ideas → Contenido → Patrones → Insights → Estrategia → Nuevas ideas

---

## Stack técnico

**Frontend App**
- React + TypeScript + Vite
- SCSS modular con @use (no CSS-in-JS)
- lucide-react para iconos
- react-i18next para internacionalización

**Frontend Landing**
- React + TypeScript + Vite + SCSS modular
- lucide-react + react-i18next
- Desplegada en producción: https://content-intel.app

**Backend**
- Supabase (PostgreSQL + RLS + Edge Functions en Deno/TypeScript)
- Vercel para deploy (CD automático desde main)

**IA**
- Claude (claude-sonnet-4-5) para generación de Recetas de Contenido
- Llamada desde Edge Function `generate-recipe`
- Temperatura: default — Max tokens: 1000

---

## Estructura de carpetas

```
src/
  auth/               # AuthGuard y lógica de autenticación
  app/
    layout/           # AppLayout, Sidebar, Topbar, Footer
    routes/           # Páginas: Activity, Contents, Ideas, Insights, Admin, Login
  features/
    contents/         # Modal de creación/edición de contenido
    dashboard/        # Componentes y hooks de Activity
    ideas/            # Componentes, hooks de Ideas, RecipeCard, RecipePanel
    insights/         # Componentes y hooks de Insights/DNA
  utils/              # chartDate.ts, growthRate.ts
  constants/          # earlyAccessOptions.ts y otros catálogos
  supabaseClient.ts   # Singleton del cliente Supabase ← importar siempre desde aquí

supabase/
  functions/          # Edge Functions (Deno + TypeScript)
```

---

## Convenciones de código

- Componentes en PascalCase: `CreateContentModal.tsx`, `RecipeCard.tsx`
- Hooks con prefijo use: `useIdeas.ts`, `useContentDNA.ts`, `usePlatforms.ts`, `useFormats.ts`
- Edge Functions en kebab-case: `create-content`, `generate-recipe`
- SCSS modular: cada componente tiene su propio archivo `.scss`
- Variables de entorno con prefijo `VITE_` para el cliente
- Secrets de Edge Functions se gestionan en Supabase (nunca en código)

---

## Reglas críticas

### Siempre
- Importar el cliente Supabase desde `src/supabaseClient.ts` — nunca llamar `createClient()`
  directamente en otro archivo
- Los fetch a Edge Functions solo necesitan `Authorization: Bearer <token>`
  No agregar el header `apikey` — no es necesario en Edge Functions
- Todo código nuevo debe respetar el modelo multi-tenant: filtrar por `tenant_id`
  en consultas directas a la DB
- La relación idea ↔ contenido es many-to-many — siempre usar la tabla pivote
  `content_creative_units`, nunca una FK directa en `contents`
- El timezone del usuario se pasa como parámetro `p_timezone` en funciones analíticas
  El default es 'UTC'. Leerlo desde `users.timezone`

### Nunca
- No modificar archivos de la landing page ni el sistema de Early Access salvo
  instrucción explícita — está en producción
- No modificar la tabla `early_access_requests` salvo instrucción explícita
- No usar `alert()` para errores — usar estados de error inline o toasts
- No commitear `VITE_ACCESS_TOKEN` — es un JWT de testing local únicamente
- No crear una segunda instancia de `createClient()` en ningún archivo
- No agregar límites de topics por contenido — el trigger `enforce_topic_limit`
  fue eliminado intencionalmente

---

## Base de datos — tablas principales

| Tabla | Propósito |
|-------|-----------|
| `contents` | Contenidos publicados por el creador |
| `creative_units` | Ideas — entidad central (tiene `user_id`, `status`: active/archived/exhausted) |
| `content_creative_units` | Pivote many-to-many idea ↔ contenido (ON DELETE CASCADE en content_id) |
| `topics` | Temas del tenant (máx 100 chars en BD, 50 en UI) |
| `content_topics` | Relación contenido ↔ tema |
| `idea_topics` | Pivote many-to-many idea ↔ topic |
| `tags` | Etiquetas de usuario |
| `content_tags` | Relación contenido ↔ tag |
| `tenants` | Tenants del sistema (uno por usuario independiente) |
| `users` | Usuarios — incluye campo `timezone` |
| `user_profiles` | Perfil extendido del creador con datos de onboarding |
| `creative_sessions` | Historial de Recetas generadas con feedback (tiene `combination_hash`) |
| `early_access_requests` | Lista de espera — NO TOCAR |

**Campos importantes en `contents`:**
- `entry_channel`: 'manual' | 'recipe' | 'migration' | 'api'
- `content_role`: rol del contenido en la estrategia
- `is_deleted`: soft delete — siempre filtrar con `is_deleted = false`
- `published_at`: requerido cuando status es 'published'

**Campos importantes en `creative_sessions`:**
- `combination_hash`: SHA-256 de idea_id + topic_ids + platform_id + format + content_role
  Garantiza unicidad — si el hash ya existe, mostrar la sesión existente

---

## Edge Functions activas

**Escritura contenidos:** `create-content`, `update-content`, `delete-content`,
`restore-content`

**Escritura ideas:** `create-idea`, `update-idea`, `delete-idea`

**Topics:** `me-topics`, `create-topic`, `update-topic`, `archive-topic`,
`update-idea-topics`, `me-idea-topics`, `update-content-topics`,
`update-content-ideas`, `me-content-associations`

**Lectura contenidos:** `me-contents`, `me-contents-history`, `me-contents-by-platform`,
`me-contents-reusable`, `me-ideas-counts`

**Onboarding / perfil:** `me-user-profile`, `create-user-profile`, `update-user-profile`

**Analytics:** `me-dashboard`, `me-activity-heatmap`, `me-insights`, `content-dna`,
`strategy-insights`

**IA / Recetas:** `generate-recipe`, `me-creative-sessions`, `update-creative-session`

**Admin:** `admin-content-growth`, `admin-content-growth-cumulative`,
`admin-content-growth-rate`, `admin-platform-usage`, `admin-users-summary`

**Público:** `early-access`, `early-access-stats`, `platforms`, `platform-formats`

**Sistema:** `health`, `version`

---

## Decisiones arquitectónicas tomadas — no revertir

**Tabla pivote `content_creative_units`**
La relación idea → contenido es many-to-many. La FK directa `creative_unit_id`
fue eliminada de `contents`. ON DELETE CASCADE en `content_id`,
ON DELETE SET NULL en `creative_unit_id`.

**Timezone parametrizado por usuario**
Las funciones analíticas reciben `p_timezone` con default 'UTC'.
El frontend envía el timezone del usuario en cada request.

**Un tenant por usuario independiente**
`handle_new_user` crea un tenant nuevo por cada usuario. El modelo soporta múltiples
usuarios por tenant (equipos/agencias) pero el flujo de invitación es una feature futura.

**Generación de ideas en backend exclusivamente**
`generateIdeasFromDNA.ts` fue eliminado del frontend. Toda la lógica de generación
vive en las Edge Functions `generate-ideas` y `generate-recipe`.

**Arquetipos invisibles**
Los arquetipos de creador son orientadores internos — no se muestran al usuario.
Se calculan en el onboarding y se refinan con el comportamiento real.

**Unicidad de Recetas por `combination_hash`**
Una receta es única por combinación idea_id + topic_ids + platform_id + format +
content_role. Si el hash ya existe, mostrar la sesión existente en lugar de generar una nueva.

---

## Estado actual del proyecto

MVP avanzado. Dos changelogs completados con 47+ cambios resueltos post-auditoría.
IA ya integrada (Recetas de Contenido con Claude).

**Completado:**
- Fase 1: Seguridad crítica ✅
- Fase 2: Estabilización y calidad ✅
- Fase 3: Ciclo de vida de ideas y arquitectura ✅
- Sprint Topics e Ideas ✅
- Sistema de Recetas de Contenido con IA ✅

**Roadmap activo:**
- Creator Identity — página /identity con DNA creativo completo
- Insights automáticos v2 — señales detectadas sin acción del creador
- Informe Creativo — análisis profundo bajo demanda con Claude
- Content System View — vista de conjuntos idea + topics + contenidos
- Pulido y lanzamiento — primer batch de early adopters

**Deuda técnica conocida:**
- 40+ vistas con SECURITY DEFINER pendientes de migrar a SECURITY INVOKER
- `pg_trgm` en schema público pendiente de migrar a schema extensions
- Leaked password protection deshabilitado en Supabase Dashboard
- Sistema de tags pendiente (sprint dedicado)
- Market Intelligence Dashboard pendiente
- Perfil de usuario en UI pendiente (language, country, timezone, role)
- Sistema de nomenclatura para contenidos sin título pendiente