# Content Intelligence Platform
## Changelog de Desarrollo — v8.0
**Creator Profile, Admin Profiles Tab, Forgot Password, Login Redesign, Topbar Hierarchy, Favicon & OG · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v7 (v1.5.0). Cubre la página de perfil del creador, la pestaña de análisis de perfiles en el Admin Panel, el flujo de recuperación de contraseña, el rediseño visual del login con imagen fotográfica, la reorganización de la jerarquía de headers, y los assets de marca (favicon y Open Graph).
 
Documentos de referencia previos:
- CHANGELOG_v7 — Brief System Redesign, Archived Ideas, Activity Fixes & AI Insights
- CHANGELOG_v6 — IP Protection, Legal Pages, Rate Limiting, Security Audit & API Cache
- CHANGELOG_v5 — Admin Dashboards, Survey Intelligence, Login Refinements
**Tag de versión:** `v1.6.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 1 Página de perfil | 1 Pestaña admin | 1 Flujo forgot password | 1 Login redesign | 1 Sistema de headers | 2 Assets de marca |
|---|---|---|---|---|---|
 
---
 
## 3. Perfil del Creador
 
### 3.1 Migración SQL
 
```sql
ALTER TABLE user_profiles
  ADD COLUMN display_name              TEXT DEFAULT NULL,
  ADD COLUMN country_code              TEXT DEFAULT NULL,
  ADD COLUMN timezone                  TEXT DEFAULT 'America/Bogota',
  ADD COLUMN creator_role              TEXT DEFAULT NULL,
  ADD COLUMN profile_nudge_dismissed_at TIMESTAMPTZ DEFAULT NULL;
```
 
### 3.2 Backend — Edge Functions actualizadas
 
| Función | Cambio |
|---|---|
| `create-user-profile` | Detección automática de idioma via `Accept-Language` header del navegador — `es*` → español, todo lo demás → inglés |
| `update-user-profile` | Acepta los 5 campos nuevos: `display_name`, `country_code`, `timezone`, `creator_role`, `profile_nudge_dismissed_at` |
 
### 3.3 Frontend — Página `Profile.tsx`
 
Nueva página en `/profile` con tres secciones:
 
**Tu cuenta** — solo lectura:
- Email (desde `supabase.auth.getUser()`)
- Miembro desde (`profile.created_at`)
**Personalización** — editable:
- Nombre / cómo te llaman (`display_name`) — texto libre
- Idioma de la app (`preferred_language`) — selector EN/ES
- País (`country_code`) — selector de 26 países hispanohablantes + principales mercados
- Zona horaria (`timezone`) — selector de 10 zonas horarias relevantes
**Perfil creativo** — editable:
- Rol principal (`creator_role`) — selector: educador, entretenimiento, periodista, marketing, narrador, analista, coach, artista
- Horas semanales dedicadas a crear (`time_availability`) — selector 4 opciones
- Setup de producción (`production_setup`) — selector 3 opciones
- Referentes creativos (`referents`) — texto libre
**Barra de completitud:** porcentaje calculado sobre 6 campos clave. Se actualiza en tiempo real al completar campos.
 
**Cambio de idioma:** al cambiar el selector de idioma y guardar, se llama `i18n.changeLanguage()` inmediatamente — la app cambia de idioma sin recargar.
 
### 3.4 ProfileNudge
 
Componente `ProfileNudge` — banner no intrusivo que aparece en el Dashboard con estas condiciones:
- Onboarding completado o saltado
- `profile_nudge_dismissed_at` es null
- Perfil incompleto (`display_name`, `country_code` y `creator_role` vacíos)
- Cuenta creada hace más de 7 días
Al hacer clic en "Ahora no" se persiste `profile_nudge_dismissed_at` — no vuelve a aparecer.
 
### 3.5 `useUserProfile` — nuevos exports
 
```typescript
showProfileNudge: boolean     // condición completa calculada en el hook
dismissProfileNudge: () => void  // persiste dismissed_at
```
 
### 3.6 Decisión — LanguageToggle eliminado del topbar
 
El switch de idioma visible en el topbar fue eliminado. El idioma se gestiona exclusivamente desde la página de perfil. Motivo: evitar confusión sobre cuál control tiene precedencia y centralizar las preferencias del usuario en un solo lugar.
 
El componente `LanguageToggle.tsx` se conserva pero ya no se monta en `Topbar.tsx`.
 
---
 
## 4. Admin — Pestaña Perfiles
 
### 4.1 Endpoint `admin-profile-stats`
 
Nuevo endpoint que agrega datos de `user_profiles` con `service_role`. Retorna:
 
```typescript
{
  total_users, with_language, with_time, with_setup,
  with_role, with_country, with_display_name, with_referents,
  language_dist, time_dist, setup_dist, role_dist, country_dist
}
```
 
Labels normalizados en el backend — `less_than_2h` → "Menos de 2h", `solo` → "Solo", etc.
 
### 4.2 Pestaña en Admin.tsx
 
Condicional a `isAdmin === true` — no aparece en el DOM ni carga datos para usuarios regulares.
 
Contenido:
 
| Sección | Visualización |
|---|---|
| KPIs de completitud | 3 stat cards: total usuarios, % con perfil parcial, % con perfil completo |
| Completitud por campo | Barras horizontales — campos con < 30% en color `--accent` como alerta |
| Idioma preferido | Donut con leyenda |
| Setup de producción | Donut con leyenda |
| Horas semanales | Barras horizontales |
| Rol de creador | Donut — atenuado al 45% si < 3 datos |
| País | Donut — atenuado al 45% si < 3 datos |
 
### 4.3 Protección de acceso
 
`isAdmin` se pasa desde `AppLayout` via `useOutletContext`. El tab no se renderiza y el `useEffect` de carga no se dispara si `isAdmin === false`.
 
---
 
## 5. Forgot Password
 
### 5.1 Flujo completo
 
Tres cambios en `Login.tsx`:
 
1. **Tipo `Mode`** actualizado: `"signin" | "register" | "forgot"`
2. **Link "¿Olvidaste tu contraseña?"** — visible solo en modo signin, junto al label del campo password
3. **Handler `handleForgotPassword`** — llama `supabase.auth.resetPasswordForEmail` con `redirectTo: ${origin}/reset-password`
4. **Modo forgot** — oculta el toggle de modos, muestra solo el campo email, botón "Enviar link" y link "Volver al login"
### 5.2 Página `ResetPassword.tsx`
 
Nueva página pública en `/reset-password`. Escucha el evento `PASSWORD_RECOVERY` via `supabase.auth.onAuthStateChange` — Supabase procesa automáticamente el token del hash de la URL.
 
Al confirmar la nueva contraseña llama `supabase.auth.updateUser({ password })` y redirige a `/activity` tras 2 segundos.
 
### 5.3 Configuración Supabase
 
- URL `https://app.content-intel.app/reset-password` agregada a Redirect URLs en Authentication → URL Configuration
- Template de email actualizado en Authentication → Email Templates → Reset Password con URL explícita incluyendo token
---
 
## 6. Login — Imagen de fondo
 
### 6.1 Antes
 
Panel izquierdo con `background: var(--primary)` — color sólido azul pizarra.
 
### 6.2 Después
 
```
heroImage.jpg (B&W) + mix-blend-mode: multiply overlay
```
 
Tres capas:
1. `login-panel__hero-bg` — imagen fotográfica importada como asset estático con `filter: grayscale(100%)`
2. `login-panel__hero-overlay` — `linear-gradient(160deg, rgba(54,73,101,0.82), rgba(33,48,73,0.88), rgba(26,31,39,0.94))` con `mix-blend-mode: multiply`
3. Contenido textual con `z-index: 2`
El `mix-blend-mode: multiply` replica exactamente el efecto del hero de la landing page — imagen en blanco y negro con tinte azul-pizarra profundo y saturado.
 
**Nota técnica:** la imagen se importa con `import heroImage from "../../assets/images/heroImage.jpg"` para que Vite la incluya en el bundle con hash correcto. Una ruta relativa como string no funciona en producción.
 
---
 
## 7. Jerarquía de Headers — Topbar unificado
 
### 7.1 El problema
 
Todas las páginas tenían dos niveles de título:
- Topbar: título de la página
- Header secundario en el body: título repetido o diferente + subtítulo
Esto creaba redundancia visual, consumía 60–100px de espacio vertical por página, y los estilos tipográficos eran inconsistentes entre páginas.
 
### 7.2 La solución
 
**Regla:** el topbar es el único nivel de título. El subtítulo va en `topbar__context` como texto secundario en línea, separado por `·`.
 
**Cambios en `Topbar.tsx`:**
```tsx
// Antes: apilados verticalmente
<h1>{title}</h1>
{context && <span>{context}</span>}
 
// Después: en línea con separador
<h1>{title}</h1>
{context && <>
  <span aria-hidden="true">·</span>
  <span>{context}</span>
</>}
```
 
**Tipografía unificada:**
- Título: `font-family: var(--font-display)` · `font-size: var(--fs-18)` · italic
- Contexto: `font-family: var(--font-sans)` · `font-size: var(--fs-13)` · color texto secundario
### 7.3 Headers eliminados por página
 
| Página | Header eliminado | Subtítulo movido a |
|---|---|---|
| Ideas y Temas | "Tu motor creativo" + subtítulo | `topbar__context` estático |
| Identidad e Insights | "Identidad del Creador" + "Tu huella creativa" | `topbar__context` estático |
| Admin | "Admin" + "Gestión e inteligencia de la plataforma" | `topbar__context` estático |
| Mi perfil | "Mi perfil" + "Personaliza tu experiencia" | `topbar__context` estático |
| Actividad | "Desempeño" + "Actividad en el período seleccionado" | Ya tenía contexto dinámico — se conserva |
| Contenidos | Header estático | Contexto dinámico con conteo |
 
**Activity y Contents conservan dinamismo:** el contexto sigue siendo dinámico (`14 contenidos · Últimos 30 días`), solo se eliminó el header secundario redundante en el body.
 
### 7.4 Topbar altura fija
 
`min-height` fijo en `.topbar` para evitar el salto visual (layout shift) que ocurría cuando `topbar__context` tardaba en cargar en páginas con datos asincrónicos.
 
---
 
## 8. Assets de marca
 
### 8.1 Favicon
 
`public/favicon.svg` — diseño basado en el design system:
 
```svg
<rect width="64" height="64" rx="12" fill="#364965"/>
<text fill="#c47859">✦</text>
```
 
- Fondo: `--primary` (#364965) — azul pizarra
- Símbolo `✦`: `--accent` (#c47859) — terracota
- Border radius: 12px — consistente con el design system
- El símbolo `✦` ya era el logo de marca en el login
Aplicado en app y landing via `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.
 
### 8.2 Open Graph Image
 
`public/og-image.png` — 1200×630px generado con script Python + Pillow:
 
Técnica:
- Imagen fotográfica en escala de grises
- Overlay con `mix-blend-mode: multiply` simulado — mismo gradiente que hero de landing
- Marco decorativo con esquinas en `--accent`
- Tipografía: título "Content Intelligence App", tagline, URL en terracota
Meta tags aplicados en `index.html` de app y landing:
```html
<meta property="og:title" content="Content Intelligence App" />
<meta property="og:image" content="https://[dominio]/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```
 
`twitter:card` es la única etiqueta de Twitter necesaria — las demás hacen fallback automático a `og:*`.
 
### 8.3 App name corregido
 
En `vite.config.ts`:
```typescript
// Antes: leía pkg.name del package.json → "content-manager-app"
'import.meta.env.VITE_APP_NAME': JSON.stringify(pkg.name)
 
// Después: string literal
'import.meta.env.VITE_APP_NAME': JSON.stringify('Content Intelligence Platform')
```
 
---
 
## 9. Limpieza de datos
 
4 registros de prueba eliminados de `early_access_requests`:
- `borramedetuvida80980913@gmail.com`
- `lanegra92837467647383@gmail.com`
- `mauricioduques@gmail.com` (usuario creó nueva cuenta con email correcto)
- `astridyaneth73646477378383@gmail.com`
---
 
## 10. Modelo de precios — decisión estratégica
 
Definido en esta versión como base para la implementación del sistema de pagos:
 
| | **Free** | **Creator — $12/mes · $96/año** |
|---|---|---|
| Ideas | Hasta 10 | Ilimitadas |
| Contenidos registrados | ✅ Ilimitados | ✅ Ilimitados |
| Briefs con IA | 3 durante trial, luego 0 | Ilimitados |
| Content DNA | Vista básica sin IA | Completo + IA |
| Insights estadísticos | ✅ Limitados | ✅ Completos |
| Insights IA | 🔒 Visible pero bloqueado | ✅ Activo |
| Informe creativo | 🔒 Visible pero bloqueado | ✅ Activo |
| Idea Generator | 🔒 Visible pero bloqueado | ✅ Activo |
| Recetas / Briefs | 🔒 Bloqueado post-trial | ✅ Activos |
| Trial | 14 días Creator completo | — |
 
**Principio de diseño del feature gating:** features bloqueadas visibles pero degradadas con CTA de upgrade — no ocultarlas. El creador debe ver constantemente el valor que se está perdiendo.
 
**Contenidos ilimitados en free:** decisión deliberada. Los contenidos registrados no usan IA, alimentan el DNA (moat de datos), y permiten mostrar insights básicos que motivan la conversión.
 
**Breakeven:** 35 usuarios pagos cubren todos los costos operativos fijos (~$400/mes).
 
---
 
## 11. Roadmap — Próximas implementaciones
 
| Prioridad | Área | Tarea |
|---|---|---|
| 🔴 Alta | Monetización | Tabla `subscriptions` en BD + hook `useSubscription` |
| 🔴 Alta | Monetización | Feature gating + upgrade prompts contextuales |
| 🔴 Alta | Monetización | Pricing page en app y landing |
| 🔴 Alta | Monetización | Edge Functions Stripe (modo test mientras llega LLC) |
| 🟡 Media | Pulido | Cambio de idioma invalida caché IA y regenera en background |
| 🟡 Media | Pulido | Timezone por usuario en funciones de crecimiento |
| 🟡 Media | Admin | Editor de prompts — tabla `system_prompts` |
| 🟢 Backlog | Feature | DNA Snapshots |
| 🟢 Backlog | Feature | Tags — sprint dedicado |
| 🟢 Backlog | Arquitectura | SECURITY DEFINER views → INVOKER (40+ vistas) |
 
---
 
*Content Intelligence Platform · Changelog v8.0 · Tag v1.6.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*