# Content Intelligence Platform
## Changelog de Desarrollo — v11.0
**Past Due Banner, Cache Invalidation, Timezone Fix, Landing Polish & OG Image · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v10 (v1.8.0). Cubre el banner de pago fallido, el fix de caché de IA al cambiar idioma, la corrección de timezone por usuario en las funciones de crecimiento, y mejoras visuales en la landing.
 
Documentos de referencia previos:
- CHANGELOG_v10 — Stripe Integration, Checkout Flow, Customer Portal, Pricing Section
- CHANGELOG_v9 — Subscriptions Infrastructure, Feature Gating & Pricing Modal
- CHANGELOG_v8 — Creator Profile, Admin Profiles Tab, Forgot Password, Login Redesign
**Tag de versión:** `v1.9.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 1 Banner billing | 1 Fix logout | 1 Fix caché IA | 3 Edge Functions timezone | 1 OG image | 2 Landing fixes |
|---|---|---|---|---|---|
 
---
 
## 3. Banner de pago fallido (`past_due`)
 
### 3.1 Componente `PastDueBanner`
 
Nuevo componente `src/components/ui/PastDueBanner.tsx` — banner de alerta visible en todas las páginas de la app cuando `subscription.status === 'past_due'`.
 
**Comportamiento:**
- Se monta en `AppLayout` entre el `Topbar` y el `<main>`
- Visible en todas las páginas sin excepción
- Botón "Actualizar método de pago" abre el Customer Portal de Stripe via `openPortal()`
- Si no hay `past_due`, el componente retorna `null` — sin impacto en el render
**Diseño:** fondo `--danger-soft`, texto y borde en `--danger`, botón con borde sutil. No intrusivo pero claramente visible.
 
### 3.2 i18n
 
```json
// es.json + en.json — nueva sección "billing"
"billing": {
  "pastDueMessage": "Tu último pago falló. Actualiza tu método de pago...",
  "pastDueCta": "Actualizar método de pago"
}
```
 
---
 
## 4. Fix — 401 en logout
 
### Problema
 
Al hacer sign out, el hook `useUserProfile` intentaba hacer una última llamada a `me-user-profile` antes de desmontarse — sin token válido → `401 Unauthorized` en consola.
 
### Fix
 
En `useUserProfile.ts`, agregar guard de sesión antes de la llamada al endpoint:
 
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) return; // no llamar si no hay sesión activa
```
 
El error era cosmético (no afectaba funcionalidad) pero generaba ruido en consola y podía confundir en debugging.
 
---
 
## 5. Fix — Caché de IA al cambiar idioma
 
### Problema
 
Cuando un usuario cambiaba el idioma en su perfil (ES → EN o EN → ES), los insights de IA y el informe creativo seguían apareciendo en el idioma anterior hasta que expiraba la caché:
- `identity_insights_cache` — TTL 24 horas
- `creative_reports` — TTL 7 días
### Fix Backend — `me-creative-report`
 
La función no verificaba el idioma del reporte en caché. Se agregaron dos cambios:
 
**1. Check de idioma en la validación del caché:**
```typescript
const isSameLang = existing?.user_lang === userLang;
if (isRecent && isSameLang && !force_regenerate) { ... }
```
 
**2. Persistir `user_lang` al guardar el reporte:**
```typescript
// En INSERT y UPDATE
user_lang: userLang,
```
 
**3. Migración SQL:**
```sql
ALTER TABLE creative_reports
  ADD COLUMN IF NOT EXISTS user_lang TEXT DEFAULT 'en';
```
 
La función `me-identity-insights` ya tenía este fix implementado desde una versión anterior — solo faltaba `me-creative-report`.
 
### Fix Frontend — Invalidar caché al guardar perfil
 
En `Profile.tsx`, cuando el usuario cambia el idioma y guarda, se invalida inmediatamente la entrada de `identity_insights_cache` marcándola con `user_lang = 'stale_${lang}'`:
 
```typescript
supabase
  .from("identity_insights_cache")
  .update({ user_lang: `stale_${form.preferred_language}` })
  .eq("user_id", userId)
```
 
El valor `stale_*` nunca coincide con `userLang` en el endpoint, forzando regeneración en la próxima visita a Identity sin bloquear el guardado del perfil.
 
---
 
## 6. Fix — Timezone por usuario en funciones de crecimiento
 
### Problema
 
Tres Edge Functions tenían el timezone hardcodeado en `"America/Bogota"`:
- `me-content-growth`
- `me-content-growth-cumulative`
- `me-content-growth-rate`
Esto afectaba la precisión de los datos para usuarios en otras zonas horarias — un contenido publicado a las 11pm en España aparecía como del día siguiente, los gráficos de crecimiento semanal no correspondían al calendario real del usuario.
 
Las funciones de admin (`admin-content-growth`, `admin-content-growth-cumulative`) y el heatmap (`me-activity-heatmap`) ya leían el timezone de `user_profiles` correctamente.
 
### Fix
 
En cada una de las tres funciones, agregar query a `user_profiles` antes de la llamada RPC:
 
```typescript
const { data: profileData } = await supabase
  .from("user_profiles")
  .select("timezone")
  .eq("user_id", user.id)
  .single();
 
const timezone = profileData?.timezone ?? "UTC";
 
// Reemplazar en la llamada RPC:
p_timezone: timezone,  // antes: "America/Bogota"
```
 
**Fallback:** si el usuario no tiene timezone configurado en su perfil, se usa `"UTC"` — neutral y sin desplazamientos.
 
---
 
## 7. OG Image actualizada
 
### Cambios respecto a la versión anterior
 
- **Texto:** reemplaza el nombre de la app por el tagline del hero — *"En un mundo donde todos usan la IA, tus ideas son irreemplazables."*
- **Tipografía:** EB Garamond Italic — más cercana a Cormorant Garamond que las fuentes anteriores
- **Layout:** texto posicionado más abajo para no tapar la cara de la modelo
- **Recorte:** anclado al top de la imagen — espacio sobre el pelo, recorte por la parte inferior
- **Color:** "irreemplazables." en `--accent` (terracota) para énfasis
- **URL:** `content-intel.app` a 32px — legible a tamaño de preview
- **Eliminado:** franja naranja superior y nombre de la app en el eyebrow
Archivo: `public/og-image.png` — aplicado en repo app y repo landing.
 
---
 
## 8. Landing — Mejoras visuales
 
### 8.1 Hero — imagen y texto
 
**Imagen reposicionada:** `background-position: 20% center` — la modelo queda más centrada visualmente con espacio a ambos lados.
 
**Texto bajado:** `padding-top` del `.hero__content` aumentado para que el título no tape la cara de la modelo.
 
**Especificidad CSS:** el selector `.hero .hero__content` resuelve el conflicto con `.container` que sobreescribía el padding con menor especificidad.
 
**Título más compacto:** `max-width: 580px` (antes 820px) y `font-size: clamp(32px, 4.2vw, 52px)` para que el título rompa en 3 líneas más equilibradas.
 
### 8.2 Pricing section — alineación de CTAs
 
Los botones CTA de las tres columnas de pricing quedaban desalineados porque el contenido de precio + subtítulo tenía alturas variables. Fix: sistema de grid de filas fijas en `.ps-plan`:
 
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
 
---
 
## 9. Roadmap actualizado
 
| Prioridad | Área | Tarea |
|---|---|---|
| 🔴 Alta | Negocio | LLC → activar Stripe modo live → primeras ventas reales |
| 🔴 Alta | Adquisición | Segunda campaña de early adopters |
| 🟡 Media | Admin | Editor de prompts — tabla `system_prompts` |
| 🟢 Backlog | Feature | DNA Snapshots |
| 🟢 Backlog | Feature | Tags — sprint dedicado |
| 🟢 Backlog | Equipos | Invitaciones + membresía multi-usuario |
 
---
 
*Content Intelligence Platform · Changelog v11.0 · Tag v1.9.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*
 