# Content Intelligence Platform
## Changelog de Desarrollo — v10.0
**Stripe Integration, Checkout Flow, Customer Portal, Pricing Section & Early Access Trial · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v9 (v1.7.0). Cubre la integración completa de Stripe en modo test, el flujo de checkout end-to-end, el customer portal, la sección de pricing en la landing, y la activación del período de trial para early adopters.
 
Documentos de referencia previos:
- CHANGELOG_v9 — Subscriptions Infrastructure, Feature Gating & Pricing Modal
- CHANGELOG_v8 — Creator Profile, Admin Profiles Tab, Forgot Password, Login Redesign
- CHANGELOG_v7 — Brief System Redesign, Archived Ideas, Activity Fixes & AI Insights
**Tag de versión:** `v1.8.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 3 Edge Functions | 1 Hook checkout | 1 Sección landing | 4 Webhooks validados | 1 Decisión comercial |
|---|---|---|---|---|
 
---
 
## 3. Configuración de Stripe
 
### 3.1 Cuenta y modo test
 
Cuenta Stripe creada con email personal. Todos los cambios de esta versión operan en **modo test** (`sk_test_`, `pk_test_`). El modo live se activará cuando llegue la LLC.
 
### 3.2 Products y Prices creados en Stripe
 
| Product | Price ID | Precio | Intervalo |
|---|---|---|---|
| Creator Monthly | `price_*` | $12.00 USD | Mensual |
| Creator Annual | `price_*` | $99.00 USD | Anual |
| Creator Annual Launch | `price_*` | $79.00 USD | Anual |
 
### 3.3 Variables de entorno configuradas
 
**Supabase Edge Functions Secrets:**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_ANNUAL
STRIPE_PRICE_ANNUAL_LAUNCH
```
 
**Vercel (Production + Preview):**
```
VITE_STRIPE_PUBLISHABLE_KEY
```
 
### 3.4 Webhook configurado
 
Endpoint: `https://szpdbyuzdeluizxslugd.supabase.co/functions/v1/stripe-webhook`
 
Eventos escuchados:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
**Nota crítica:** el webhook requiere `verify_jwt = false` en `supabase/functions/stripe-webhook/config.toml` — Stripe no envía JWT de Supabase, la seguridad la maneja la verificación de firma via `stripe.webhooks.constructEventAsync`.
 
---
 
## 4. Edge Functions nuevas
 
### 4.1 `create-checkout-session`
 
Crea una sesión de Stripe Checkout para el plan seleccionado. Flujo:
 
1. Verifica autenticación del usuario
2. Obtiene o crea el `stripe_customer_id` en Stripe
3. Persiste el `stripe_customer_id` en `subscriptions`
4. Crea la sesión con `trial_period_days: 14`
5. Retorna la URL del checkout
**Price keys aceptados:** `monthly` | `annual` | `annual_launch`
 
**URLs de retorno:**
- Success: `/activity?checkout=success`
- Cancel: `/activity?checkout=cancelled`
### 4.2 `stripe-webhook`
 
Procesa los eventos de Stripe y actualiza la tabla `subscriptions`:
 
| Evento | Acción |
|---|---|
| `checkout.session.completed` | `plan = 'creator'`, `status = 'trialing'/'active'`, pobla `stripe_subscription_id`, `trial_ends_at`, `current_period_end` |
| `customer.subscription.updated` | Actualiza `plan`, `status`, `trial_ends_at`, `current_period_end`, `cancel_at_period_end` |
| `customer.subscription.deleted` | `plan = 'free'`, `status = 'canceled'`, limpia campos de Stripe |
| `invoice.payment_failed` | `status = 'past_due'` |
 
### 4.3 `customer-portal-session`
 
Crea una sesión del Stripe Billing Portal para que el usuario gestione su suscripción (cancelar, cambiar plan, actualizar tarjeta). Retorna al usuario a `/profile` después de salir del portal.
 
Requiere que el usuario tenga `stripe_customer_id` en `subscriptions`.
 
**Prerequisito:** activar el Customer Portal en Stripe Dashboard → Settings → Billing → Customer portal.
 
---
 
## 5. Frontend — App
 
### 5.1 Hook `useCheckout`
 
Nuevo hook en `src/features/subscription/hooks/useCheckout.ts`:
 
```typescript
const { startCheckout, openPortal, loading, error } = useCheckout();
 
// Iniciar checkout
startCheckout("monthly" | "annual" | "annual_launch");
 
// Abrir portal de gestión
openPortal();
```
 
### 5.2 `PricingModal` conectado al checkout
 
Los botones del modal de pricing ahora llaman a `startCheckout` con el price key correspondiente:
- Creator Mensual → `startCheckout("monthly")`
- Creator Anual → `startCheckout("annual_launch")` — precio de lanzamiento mientras esté activo
### 5.3 Banner de retorno del checkout en `Activity.tsx`
 
Al regresar de Stripe Checkout, la URL incluye `?checkout=success` o `?checkout=cancelled`. La página Activity detecta el parámetro y muestra un banner de confirmación o cancelación. El parámetro se limpia de la URL con `window.history.replaceState` sin recargar.
 
### 5.4 Sección de billing en `Profile.tsx`
 
Nueva sección "Plan y facturación" entre "Tu cuenta" y "Personalización":
 
- **Badge del plan actual** — `Free` o `Creator` con estilos diferenciados
- **Fecha de fin del trial** — visible si `trial_active === true`
- **Botón "Gestionar suscripción"** — abre el customer portal (solo visible para usuarios Creator)
- **Botón "Obtener Creator"** — abre el modal de pricing (solo visible para usuarios Free)
### 5.5 Refactoring — `profileOptions.ts`
 
Las constantes `COUNTRIES`, `TIMEZONES`, `CREATOR_ROLES`, `TIME_OPTIONS` y `SETUP_OPTIONS` fueron extraídas de `Profile.tsx` a `src/features/profile/constants/profileOptions.ts`. El componente las importa desde ahí — reutilizables desde cualquier otro lugar.
 
---
 
## 6. Frontend — Landing
 
### 6.1 Sección `Pricing` en la landing
 
Nueva sección `src/components/sections/Pricing.tsx` integrada en `Landing.tsx` antes de `FinalCTA`. Accesible via anchor `#pricing`.
 
**Estructura:**
- Header con eyebrow, título y subtítulo
- Grid de tres columnas: Free, Creator Mensual, Creator Anual
- Footer note con garantías
- FAQ con 4 preguntas frecuentes
**CTAs:**
- Free → abre el modal de early access (`onRequestAccess`)
- Creator Mensual → redirige a `app.content-intel.app/login`
- Creator Anual → redirige a `app.content-intel.app/login`
El flujo correcto es: Landing → registro en la app → onboarding → modal de pricing → checkout Stripe.
 
### 6.2 Enlace en la Navbar
 
Nuevo enlace `#pricing` en la navbar de la landing entre "Cómo funciona" y "Contacto".
 
### 6.3 Estilos
 
Nuevo archivo `src/styles/sections/_pricing.scss` con sistema de grid de filas fijas para alinear los CTAs horizontalmente entre las tres columnas — independientemente de la altura del contenido de cada plan.
 
```scss
.ps-plan {
  display: grid;
  grid-template-rows:
    24px   /* badge */
    80px   /* nombre + precio */
    24px   /* subtítulo */
    48px   /* CTA */
    20px   /* features label */
    1fr;   /* lista */
}
```
 
### 6.4 i18n
 
Nuevo namespace `pricing` registrado en `src/i18n/index.ts` con archivos `en/pricing.json` y `es/pricing.json`. Incluye todas las claves de features, FAQ y textos de UI.
 
---
 
## 7. Validación de webhooks — Resultados
 
| Evento | Simulación | BD actualizada | Resultado |
|---|---|---|---|
| `checkout.session.completed` | Checkout real con tarjeta `4242` | `plan: creator`, `status: trialing`, `stripe_subscription_id` poblado | ✅ |
| `customer.subscription.updated` | Cancelación desde customer portal | `cancel_at_period_end: true` | ✅ |
| `customer.subscription.deleted` | Portal → cancelar inmediatamente | `plan: free`, `status: canceled` | ✅ |
| `invoice.payment_failed` | Stripe CLI `stripe trigger invoice.payment_failed` + UPDATE manual | `status: past_due` | ✅ |
 
**Nota sobre `invoice.payment_failed`:** el trigger de la CLI crea un customer ficticio que no existe en `subscriptions`. La lógica del webhook es correcta — en producción el `stripe_customer_id` del customer real sí existirá en la BD. El UPDATE manual confirmó que el campo se actualiza correctamente.
 
---
 
## 8. Decisiones comerciales
 
### 8.1 Modelo de precios final
 
| Plan | Precio | Estado |
|---|---|---|
| Free | $0 | Permanente |
| Creator mensual | $12/mes | Activo en modo test |
| Creator anual | $99/año | Precio post-lanzamiento |
| Creator anual launch | $79/año | Precio especial — via Stripe Coupon al activar live |
 
### 8.2 Trial de 90 días para early adopters
 
Todos los usuarios registrados antes del 24 de mayo de 2026 tienen `trial_ends_at = 2026-08-23` y `status = trialing`. El **23 de agosto de 2026** es la fecha oficial de fin del período early access.
 
### 8.3 Trial automático para nuevos usuarios
 
`create-user-profile` crea automáticamente la fila en `subscriptions` con:
- `status: trialing`
- `trial_ends_at`: 23 de agosto de 2026 si el registro es antes de esa fecha
- `trial_ends_at`: hoy + 14 días si el registro es después del 23 de agosto
Garantiza acceso completo a la IA para todos los early adopters de la segunda campaña.
 
### 8.4 `canUseAI` y `canCreateBriefs`
 
```typescript
// Acceso a IA = Creator activo O trial activo
const canUseAI        = subscription.is_creator || subscription.trial_active;
const canCreateBriefs = subscription.is_creator || subscription.trial_active;
```
 
---
 
## 9. Herramientas instaladas
 
| Herramienta | Versión | Uso |
|---|---|---|
| Stripe CLI | 1.42.0 | Trigger de eventos de prueba para webhooks |
 
Instalada en Windows. Variable de entorno configurada en User scope via PowerShell.
 
---
 
## 10. Pendiente — Activación modo live
 
La siguiente fase de pagos se activa cuando llegue la LLC (~julio 2026):
 
1. Completar datos de negocio en Stripe (EIN, dirección legal, cuenta bancaria Mercury)
2. Crear Products y Prices en modo live con los mismos nombres
3. Crear Stripe Coupon para el precio de lanzamiento ($79 → `annual_launch`)
4. Actualizar secrets en Supabase con claves `sk_live_`
5. Actualizar variable en Vercel con `pk_live_`
6. Configurar webhook en modo live con la misma URL
7. Verificar Customer Portal activo en modo live
---
 
## 11. Roadmap — Próximas implementaciones
 
| Prioridad | Área | Tarea |
|---|---|---|
| 🔴 Alta | Negocio | LLC → activar Stripe modo live → primeras ventas reales |
| 🔴 Alta | Adquisición | Segunda campaña de early adopters |
| 🔴 Alta | Monetización | Banner de `past_due` en la app — avisar al usuario que su pago falló |
| 🟡 Media | Producto | Cambio de idioma invalida caché IA y regenera en background |
| 🟡 Media | Producto | Timezone por usuario en funciones SQL de crecimiento |
| 🟡 Media | Admin | Editor de prompts — tabla `system_prompts` |
| 🟢 Backlog | Feature | DNA Snapshots |
| 🟢 Backlog | Feature | Tags — sprint dedicado |
| 🟢 Backlog | Equipos | Invitaciones + membresía multi-usuario |
 
---
 
*Content Intelligence Platform · Changelog v10.0 · Tag v1.8.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*