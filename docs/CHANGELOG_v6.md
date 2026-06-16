# Content Intelligence Platform
## Changelog de Desarrollo — v6.0
**IP Protection, Legal Pages, Rate Limiting, Security Audit & API Cache · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v5 (v1.3.0). Cubre la protección de propiedad intelectual, homologación de páginas legales, rate limiting en el endpoint de early access, resolución de deuda técnica de seguridad en funciones SQL, y la implementación de caché para la API de Claude.
 
Documentos de referencia previos:
- CHANGELOG_v5 — Admin Dashboards, Survey Intelligence, Login Refinements
- CHANGELOG_v4 — Waitlist Intelligence v1, Login Redesign, Fix is_deleted
- CHANGELOG_v3 — Security Audit, Fase 3 Creator Identity
- CHANGELOG_v2 — Implementación de IA, Onboarding y Sistema de Recetas
- CHANGELOG_v1 — cambios post-auditoría inicial
**Tag de versión:** `v1.4.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 1 Repo privado | 3 Capas de protección endpoint | 1 Función migrada a INVOKER | 1 Caché API Claude |
|---|---|---|---|
 
---
 
## 3. Protección de Propiedad Intelectual
 
### 3.1 Repo backend privado
 
| Estado | Cambio | Notas |
|---|---|---|
| 🔄 MODIFICADO | `content-manager-backend` cambiado a privado en GitHub | Protege Edge Functions, migraciones SQL, prompts y lógica de negocio |
| ✅ VERIFICADO | Audit de secrets — todos via `Deno.env.get()`, ninguno hardcodeado | Grep sobre todas las Edge Functions |
| ✅ VERIFICADO | Historial de git limpio — ningún `.env` commiteado en el pasado | `git log --all --full-history` |
| 🔄 MODIFICADO | `.gitignore` limpiado — línea corrupta `cat .gitignore \| grep .claude` eliminada | Era texto literal no válido |
 
### 3.2 Decisión sobre prompts
 
Los system prompts hardcodeados en las 5 Edge Functions (`generate-ideas`, `generate-recipe`, `me-creative-report`, `me-identity-insights`, `regenerate-aspect`) **no se migraron a Supabase** en esta versión. El repo privado los protege suficientemente. La migración a tabla `system_prompts` se hará cuando se construya el editor de prompts en el Admin Panel — en ese momento tiene doble utilidad: protección + agilidad operativa sin deploy.
 
### 3.3 README del repo frontend actualizado
 
El repo frontend permanece público como portfolio. Se actualizó `README.md` con:
- Descripción del producto y core loop
- Features del MVP
- Stack técnico completo (frontend + backend privado)
- Diagrama ASCII de arquitectura
- Descripción del Admin Panel
- Descripción del design system y capacidades de theming
- Estado actual (early access, 29 creadores en waitlist)
- Frase: *"Backend repo available for review upon request"*
---
 
## 4. Páginas Legales — Homologación Landing → App
 
### 4.1 Contexto
 
Las páginas de Términos de Servicio y Política de Privacidad existían en la landing (`content-intel.app/terms` y `/privacy`) pero no en la app (`app.content-intel.app`). Se homologaron para que ambas propiedades tengan las mismas páginas legales.
 
### 4.2 Cambios implementados
 
| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | `src/app/routes/Terms.tsx` — componente idéntico al de la landing | Con TOC lateral, hero, 15 secciones |
| 🆕 NUEVO | Frontend App | `src/app/routes/Privacy.tsx` — componente idéntico al de la landing | Con TOC lateral, hero, 12 secciones |
| 🆕 NUEVO | Frontend App | `src/i18n/locales/en/terms.json` — traducción EN completa | 15 secciones |
| 🆕 NUEVO | Frontend App | `src/i18n/locales/es/terms.json` — traducción ES completa | 15 secciones |
| 🆕 NUEVO | Frontend App | `src/i18n/locales/en/privacy.json` — traducción EN completa | 12 secciones |
| 🆕 NUEVO | Frontend App | `src/i18n/locales/es/privacy.json` — traducción ES completa | 12 secciones |
| 🔄 MODIFICADO | Frontend App | Router — rutas `/terms` y `/privacy` agregadas sin autenticación | Fuera del layout protegido |
| 🔄 MODIFICADO | Frontend App | i18next config — namespaces `"terms"` y `"privacy"` registrados | |
 
---
 
## 5. Rate Limiting — Endpoint Early Access
 
### 5.1 Contexto
 
El endpoint `POST /early-access` de la landing no tenía protección contra abuso automatizado. Sin rate limit, un script puede llenar la tabla `early_access_requests` con miles de emails falsos en segundos.
 
### 5.2 Tres capas de protección implementadas
 
| Capa | Qué bloquea | Respuesta al atacante |
|---|---|---|
| Honeypot field | Bots que llenan formularios automáticamente | `{ success: true }` — no saben que fueron ignorados |
| Rate limit por IP | Scripts con múltiples emails desde la misma IP | `{ success: true }` — silencioso |
| Deduplicación por email | Registros duplicados del mismo email | `{ success: true }` — ya existente (sin cambios) |
 
Las tres capas retornan siempre el mismo response exitoso — nunca revelan al atacante que fueron bloqueados.
 
### 5.3 Configuración del rate limit
 
- Máximo: 3 intentos por IP
- Ventana: 10 minutos
- Comportamiento al expirar la ventana: reinicio del contador
### 5.4 Cambios implementados
 
| Estado | Área | Cambio |
|---|---|---|
| 🆕 NUEVO | Backend BD | Tabla `early_access_rate_limits` — `ip`, `attempts`, `window_start` con RLS estricto |
| 🔄 MODIFICADO | Backend Edge Function | `early-access/index.ts` — rate limit por IP + honeypot agregados |
| 🆕 NUEVO | Frontend Landing | Campo honeypot invisible en el formulario — `name="website"`, `display:none` |
| 🆕 NUEVO | Backend Edge Function | `cleanup-rate-limits/index.ts` — purga registros > 1 hora |
| 🆕 NUEVO | Backend Config | Cron job en `supabase/config.toml` — ejecuta cleanup diariamente a las 3am UTC |
 
---
 
## 6. Deuda Técnica — SECURITY DEFINER → SECURITY INVOKER
 
### 6.1 Contexto
 
Supabase reportaba advertencia de seguridad por 7 funciones SQL con `SECURITY DEFINER`. La tarea original decía "9 funciones" pero el audit reveló 7, y de esas 7 solo 1 requería cambio real.
 
### 6.2 Análisis de las 7 funciones
 
| Función | Decisión | Razón |
|---|---|---|
| `handle_new_user` | ✅ Mantener DEFINER | Trigger sin usuario autenticado — necesita permisos elevados para insertar en `tenants` y `users` |
| `update_updated_at` | ✅ Mantener DEFINER | Trigger genérico inofensivo — no accede a datos de usuario |
| `admin_content_growth_by_period` | ✅ Mantener DEFINER | Llamada desde service_role — INVOKER rompería acceso por RLS (`auth.uid()` = null) |
| `admin_content_growth_cumulative_by_period` | ✅ Mantener DEFINER | Ídem |
| `admin_content_growth_rate_by_period` | ✅ Mantener DEFINER | Ídem |
| `user_activity_heatmap_by_user` | ✅ Mantener DEFINER | Ídem |
| `get_current_user_tenant_id` | 🔄 **Migrada a INVOKER** | Única llamada con usuario autenticado real — RLS aplica correctamente |
 
### 6.3 Migración aplicada
 
Archivo: `supabase/migrations/[timestamp]_fix_security_invoker.sql`
 
```sql
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
  RETURNS uuid
  LANGUAGE sql
  SECURITY INVOKER
  SET search_path TO 'public'
AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$;
```
 
**Verificado:** `prosecdef = false` para `get_current_user_tenant_id`, `true` para las otras 6.
 
---
 
## 7. Caché API Claude — `me-identity-insights`
 
### 7.1 Contexto y análisis de costos
 
Sin caché, `me-identity-insights` llama a Claude en **cada carga de la página Identity**. Con Sonnet 4.5 a $15/M tokens output, cada llamada cuesta ~$0.008. Con 10 usuarios activos haciendo 5 visitas/día = 50 llamadas/día = $0.40/día solo en esta función.
 
Estado de caché por función antes de esta versión:
 
| Función | Caché | TTL | Costo/llamada |
|---|---|---|---|
| `me-creative-report` | ✅ `creative_reports` | 7 días | ~$0.015 |
| `me-identity-insights` | ❌ Sin caché | Cada request | ~$0.008 |
| `generate-recipe` | ❌ Sin caché (intencional) | Acción explícita | ~$0.010 |
| `generate-ideas` | ❌ Sin caché (intencional) | Acción explícita | ~$0.004 |
| `regenerate-aspect` | ❌ Sin caché (intencional) | Acción explícita | ~$0.008 |
 
`generate-recipe`, `generate-ideas` y `regenerate-aspect` son acciones explícitas del usuario — el cobro por uso es apropiado por diseño.
 
### 7.2 Ahorro estimado con caché
 
| Escenario | Sin caché | Con caché | Ahorro |
|---|---|---|---|
| 10 usuarios, 5 visitas/día a Identity | $0.40/día | $0.08/día | 80% |
| 100 usuarios activos/mes | ~$180/mes | ~$30/mes | 83% |
 
### 7.3 Cambios implementados
 
| Estado | Área | Cambio |
|---|---|---|
| 🆕 NUEVO | Backend BD | Tabla `identity_insights_cache` — `user_id` (unique), `tenant_id`, `content` JSONB, `dna_snapshot` JSONB, timestamps |
| 🆕 NUEVO | Backend BD | Índice único `idx_identity_insights_cache_user` en `user_id` |
| 🆕 NUEVO | Backend BD | Índice `idx_identity_insights_cache_tenant` en `tenant_id` |
| 🆕 NUEVO | Backend BD | RLS — policy de lectura por `tenant_id` del usuario autenticado |
| 🆕 NUEVO | Backend BD | Trigger `update_updated_at` en `identity_insights_cache` |
| 🔄 MODIFICADO | Backend Edge Function | `me-identity-insights/index.ts` — caché check con TTL 24h antes de llamar a Claude |
| 🆕 NUEVO | Backend Edge Function | Parámetro `force_regenerate: boolean` en el body — invalida caché manualmente |
| 🆕 NUEVO | Backend Edge Function | `serviceSupabase` con service_role para escritura en caché (bypasa RLS) |
 
### 7.4 Comportamiento del caché
 
- Si existe registro de las últimas 24h → retorna `{ ...content, is_cached: true, generated_at }` sin llamar a Claude
- Si no hay caché o expiró → llama a Claude, guarda resultado, retorna `{ ...content, is_cached: false }`
- Si `force_regenerate: true` → ignora caché, regenera siempre (útil desde el frontend para refresh manual)
- TTL de 24h en lugar de 7 días (como `creative_reports`) porque los insights de identidad cambian más frecuentemente al agregar nuevos contenidos
### 7.5 Verificado en producción
 
```json
{
  "user_id": "3c6fe2c1-8281-4eb4-a284-d1352a766d24",
  "created_at": "2026-05-20 04:43:03",
  "content_chars": 1379
}
```
 
---
 
## 8. Homologación de ramas
 
| Estado | Cambio | Notas |
|---|---|---|
| 🔄 MODIFICADO | `development` reseteada a `main` con `git reset --hard origin/main` | Rama `development` había quedado corrupta por maniobras de merge incorrectas |
 
---
 
## 9. Estado del sistema post-v6
 
| Área | Estado |
|---|---|
| Repos | Frontend público (portfolio) · Backend privado (IP protegida) · Landing público |
| Secrets | Todos via `Deno.env.get()` · Historial limpio · `.gitignore` correcto |
| Páginas legales | Terms + Privacy en landing y app — EN/ES |
| Rate limiting | 3 capas en endpoint early-access — IP + honeypot + deduplicación |
| Funciones SQL | 6 SECURITY DEFINER justificadas · 1 migrada a SECURITY INVOKER |
| Caché Claude API | `me-creative-report` (7d) + `me-identity-insights` (24h) |
| Ramas | `development` y `main` sincronizadas |
 
---
 
## 10. Roadmap Activo — Fases Pendientes
 
| Estado | Área | Cambio | Prioridad |
|---|---|---|---|
| 📋 PENDIENTE | Admin | Editor de prompts — migrar system prompts a tabla `system_prompts` | Media |
| 📋 PENDIENTE | Fase 3 — extensión | `strategy-insights` en `/identity` — cuando haya suficientes datos | Media |
| 📋 PENDIENTE | Fase 4 | Insights automáticos v2 — señales detectadas sin acción del creador | Alta |
| 📋 PENDIENTE | Fase 5 | Informe Creativo — narrativa profunda bajo demanda con Claude + web search | Media |
| 📋 PENDIENTE | Fase 6 | Content System View — vista de conjuntos idea + topics + contenidos | Media |
| 📋 PENDIENTE | Fase 7 | Pulido y lanzamiento — primer batch de early adopters | Alta |
| 📋 PENDIENTE | Feature | DNA Snapshots — fotografía del DNA en un momento dado | Backlog |
| 📋 PENDIENTE | Feature | Regeneración de aspecto específico de la Receta según feedback bajo | Backlog |
| 📋 PENDIENTE | Feature | Sistema de nomenclatura para contenidos — title_pattern en users | Backlog |
| 📋 PENDIENTE | Feature | Perfil de usuario en UI — language, country, timezone, role | Backlog |
| 📋 PENDIENTE | Feature | Tags — sprint dedicado con modelo completo | Backlog |
| 📋 PENDIENTE | Arquitectura | SECURITY DEFINER views → SECURITY INVOKER (40+ vistas) | Deuda técnica |
| 📋 PENDIENTE | Arquitectura | Migración pg_trgm a schema extensions | Baja prioridad |
| 📋 PENDIENTE | Auth | Leaked password protection — habilitar en Supabase Dashboard | Configuración |
 
---
 
*Content Intelligence Platform · Changelog v6.0 · Tag v1.4.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*