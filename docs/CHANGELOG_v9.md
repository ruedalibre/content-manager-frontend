# Content Intelligence Platform
## Changelog de Desarrollo — v9.0
**Subscriptions Infrastructure, Feature Gating & Pricing Modal · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v8 (v1.6.0). Cubre la infraestructura completa del sistema de suscripciones, el feature gating de las funcionalidades de IA, el modal de pricing con tres planes, y la activación del período de trial para los early adopters.
 
Documentos de referencia previos:
- CHANGELOG_v8 — Creator Profile, Admin Profiles Tab, Forgot Password, Login Redesign, Topbar Hierarchy, Favicon & OG
- CHANGELOG_v7 — Brief System Redesign, Archived Ideas, Activity Fixes & AI Insights
- CHANGELOG_v6 — IP Protection, Legal Pages, Rate Limiting, Security Audit & API Cache
**Tag de versión:** `v1.7.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 1 Tabla BD | 1 Endpoint | 1 Hook | 2 Componentes gating | 1 Modal pricing | 1 Decisión comercial |
|---|---|---|---|---|---|
 
---
 
## 3. Paso 1 — Infraestructura de suscripciones
 
### 3.1 Migración SQL
 
Nueva tabla `subscriptions` con RLS, constraints y trigger de `updated_at`:
 
```sql
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id              UUID NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
  stripe_customer_id     TEXT UNIQUE DEFAULT NULL,
  stripe_subscription_id TEXT UNIQUE DEFAULT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free',
  status                 TEXT NOT NULL DEFAULT 'active',
  trial_ends_at          TIMESTAMPTZ DEFAULT NULL,
  current_period_end     TIMESTAMPTZ DEFAULT NULL,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE,
  ...
  CONSTRAINT subscriptions_plan_check   CHECK (plan IN ('free', 'creator')),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete'))
);
```
 
Todos los usuarios existentes insertados con `plan = 'free'` y `status = 'active'` via INSERT inicial.
 
### 3.2 Endpoint `me-subscription`
 
Nuevo endpoint que retorna el estado de suscripción del usuario autenticado con campos computados:
 
```typescript
{
  plan, status, trial_ends_at, current_period_end, cancel_at_period_end,
  trial_active,   // calculado: trial_ends_at > NOW()
  is_creator,     // plan === 'creator' && status activo o trialing
  is_free         // !is_creator
}
```
 
Si no existe registro para el usuario (edge case de usuarios muy nuevos), retorna valores `free` por defecto.
 
### 3.3 Hook `useSubscription`
 
Nuevo hook en `src/features/subscription/hooks/useSubscription.ts`:
 
```typescript
const {
  subscription, loading, plan,
  isCreator, isFree, trialActive, trialEndsAt,
  canUseAI, canCreateBriefs,
} = useSubscription();
```
 
`canUseAI` y `canCreateBriefs` son helpers directos para el feature gating — ambos equivalen a `is_creator`.
 
---
 
## 4. Paso 2 — Feature gating
 
### 4.1 Principio de diseño
 
Las features bloqueadas son **visibles pero degradadas** — nunca se ocultan. El creador debe ver constantemente el valor que se está perdiendo para motivar la conversión.
 
### 4.2 Componente `UpgradePrompt`
 
Nuevo componente reutilizable en `src/components/ui/UpgradePrompt.tsx`:
 
- Banner con símbolo `✦`, título, descripción y botón CTA
- Prop `compact` para versiones inline dentro de cards
- Al hacer clic en el CTA abre el `PricingModal` via contexto global
### 4.3 Feature gating en `Ideas.tsx`
 
| Feature | Condición | Comportamiento bloqueado |
|---|---|---|
| Botón generar brief | `canCreateBriefs` | Botón atenuado con badge "Creator" y `disabled` |
| Banner upgrade | `isFree && !trialActive` | `UpgradePrompt` compact sobre el toolbar |
 
### 4.4 Feature gating en `Identity.tsx`
 
| Feature | Condición | Comportamiento bloqueado |
|---|---|---|
| Standout Insights | `canUseAI` | `UpgradePrompt` reemplaza la sección |
| Creative Style tags | `canUseAI` | Tags con blur + opacidad reducida |
| Worth Reflecting | `canUseAI` | `UpgradePrompt` compact dentro del collapsible |
| Deep Analysis / Informe | `canUseAI` | `UpgradePrompt` dentro del collapsible |
 
---
 
## 5. Paso 3 — Modal de pricing
 
### 5.1 Arquitectura
 
Patrón Context + Provider para estado global del modal:
 
```
PricingModalContext → usePricingModal() → { isOpen, open, close }
PricingModalProvider → envuelve el árbol de la app
PricingModal → montado una sola vez en el root
```
 
Cualquier componente de la app puede abrir el modal con `usePricingModal().open()` sin prop drilling.
 
### 5.2 Estructura del modal
 
Tres columnas comparativas:
 
| | Free | Creator · Mensual | Creator · Anual |
|---|---|---|---|
| Badge | — | Flexible | Recomendado |
| Precio | $0 | $12/mes | $79/año ~~$99~~ |
| Sub | Para siempre | Cancela cuando quieras | Ahorras $65 · Precio lanzamiento |
| CTA | Plan actual (disabled) | Prueba 14 días gratis | Prueba 14 días gratis |
 
**Notas de diseño:**
- CTA del plan anual en `--accent` (terracota) para diferenciarlo visualmente
- Precio $99 tachado con badge "Recomendado" en el plan anual
- Features bloqueadas en Free aparecen atenuadas con ícono de candado
- Dashboard de actividad incluido en Free — comunica generosidad
- Footer: "Sin tarjeta de crédito para el trial · Cancela cuando quieras · Precios en USD"
### 5.3 Modelo de precios definitivo
 
| Plan | Precio | Notas |
|---|---|---|
| Free | $0 | Permanente |
| Creator mensual | $12/mes | Cancela cuando quieras |
| Creator anual | $99/año | Precio definitivo post-lanzamiento |
| Creator anual lanzamiento | $79/año | Precio especial por tiempo limitado (Stripe Coupon) |
 
**Breakeven:** 35 usuarios en plan Creator mensual cubren todos los costos operativos (~$400/mes).
 
**Precio de lanzamiento:** se implementará via Stripe Coupon cuando la LLC esté activa. El código de descuento aplica solo al primer pago anual y expira en fecha definida.
 
---
 
## 6. Período de trial — Early adopters
 
### 6.1 Decisión comercial
 
Todos los usuarios early adopters (registrados antes del 24 de mayo de 2026) recibieron un período de trial de **90 días** desde la fecha de activación del sistema de suscripciones.
 
**Justificación:** el producto está siendo construido por un solo fundador con múltiples frentes simultáneos (desarrollo, legal, marketing). Los early adopters merecen acceso completo mientras el producto madura y se prepara la segunda campaña de adquisición.
 
### 6.2 SQL ejecutado
 
```sql
UPDATE subscriptions
SET
  trial_ends_at = NOW() + INTERVAL '90 days',
  status = 'trialing',
  updated_at = NOW()
WHERE plan = 'free'
AND user_id != '3c6fe2c1-8281-4eb4-a284-d1352a766d24'; -- excluir admin
```
 
### 6.3 Resultado
 
| Campo | Valor |
|---|---|
| Usuarios en trial | 11 early adopters |
| Fecha de vencimiento | 23 de agosto de 2026 |
| Status | `trialing` |
| Admin | `creator` / `active` (sin trial) |
 
**El 23 de agosto de 2026 es la fecha oficial de fin del período early access.** A partir de esa fecha, los usuarios free sin suscripción perderán acceso a las features de IA.
 
---
 
## 7. Correcciones menores implementadas
 
| Área | Fix |
|---|---|
| `Ideas.tsx` | Ternario como statement → `if/else` explícito (ESLint `no-unused-expressions`) |
| `RecipePanel` | Tipo `onDownload: () => void` → `() => void \| Promise<void>` para aceptar handlers async |
| `Ideas.scss` | `.topics-toolbar .ideas-search` con `max-width: 100%` — input de búsqueda más ancho en pestaña Temas |
| `PricingModal` | Ícono de cerrar con `<X>` de lucide-react (Tabler Icons no está cargado en la app) |
| `PricingModal` | Bloques de precio con `min-height` fijo para alinear CTAs horizontalmente entre columnas |
 
---
 
## 8. Roadmap — Próximas implementaciones
 
| Prioridad | Área | Tarea |
|---|---|---|
| 🔴 Alta | Monetización | Stripe modo test — Edge Functions `create-checkout-session`, `stripe-webhook`, `customer-portal-session` |
| 🔴 Alta | Monetización | Pricing page pública en la landing (`content-intel.app/pricing`) |
| 🔴 Alta | Negocio | LLC en proceso (~2 meses) → activar Stripe modo live |
| 🔴 Alta | Adquisición | Segunda campaña de early adopters |
| 🟡 Media | Producto | Cambio de idioma invalida caché IA y regenera en background |
| 🟡 Media | Producto | Timezone por usuario en funciones SQL de crecimiento |
| 🟡 Media | Admin | Editor de prompts — tabla `system_prompts` |
| 🟢 Backlog | Feature | DNA Snapshots |
| 🟢 Backlog | Feature | Tags — sprint dedicado |
| 🟢 Backlog | Equipos | Invitaciones + membresía multi-usuario (roadmap definido) |
 
---
 
*Content Intelligence Platform · Changelog v9.0 · Tag v1.7.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*