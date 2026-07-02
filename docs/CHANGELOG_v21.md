# Changelog v21 — v2.6.1 (app) · v1.2.1 (landing)

## Rename de marca — "Content Intelligence" → "Creadora"

**Fecha:** Julio 2026
**Versión:** v2.6.1 (frontend + backend) · v1.2.1 (landing)
**Tipo:** Patch — sin cambios de funcionalidad ni comportamiento
**Objetivo:** Consistencia de marca en toda la superficie de producto de cara al registro de "Creadora" ante USPTO (Clase 42)

---

## Contexto

Con el registro de marca en trámite, se hizo un barrido completo de las referencias textuales al nombre anterior ("Content Intelligence") en los 3 repos del proyecto. Este cambio es puramente de texto/copy — no modifica lógica, endpoints, esquema de BD, ni infraestructura.

---

## Criterio aplicado

- **Nombre propio** — "Content Intelligence Platform", "Content Intelligence App", o "Content Intelligence" refiriéndose a la empresa/producto → reemplazado por **"Creadora"**
- **Uso genérico/categoría** — frases como "a content intelligence platform for creators and teams" o "exploring content intelligence" en minúscula, describiendo la industria/categoría de producto → **se mantiene sin cambios**, no es parte de la marca

---

## Alcance del cambio

**Lo que cambió:** texto visible en UI, emails transaccionales, metadata de páginas legales, comentarios de código.

**Lo que NO cambió (fuera de alcance intencional):**
- Dominios (`content-intel.app`) — requiere migración DNS separada, no evaluada en este ciclo
- Email `from:` en Resend — sigue siendo `andres@content-intel.app`; solo cambió el nombre visible del remitente a "Andrés from Creadora"
- Nombres de repos en GitHub
- Changelogs históricos (v1–v20) — preservados como registro histórico, no se reescribe el pasado

---

## Frontend (`content-manager-frontend`)

**Componentes y utilidades:**
- `Sidebar.tsx` — título mobile y desktop
- `FAQ.tsx`, `Identity.tsx`, `Login.tsx`, `ResetPassword.tsx`, `UpdatePassword.tsx`, `RecipePanel.tsx`
- `utils/downloadBrief.ts`, `utils/downloadReport.ts`

**i18n:**
- `i18n/en.json`, `i18n/es.json`
- `i18n/en/privacy.json`, `i18n/es/privacy.json`
- `i18n/en/terms.json`, `i18n/es/terms.json`

**Estilos:**
- `styles/tokens.scss` — comentario de encabezado

---

## Backend (privado)

**Edge Functions — campo `from:` de Resend:**
- `admin-invite-user/index.ts`
- `early-access/index.ts`
- `send-password-update-notice/index.ts`
- `tally-webhook/index.ts`

**Templates de email (React Email):**
- `early-access/emails/EarlyAccessEmailEN.tsx`, `EarlyAccessEmailES.tsx`
- `early-access/emails/EarlyAccessInviteEmailEN.tsx`, `EarlyAccessInviteEmailES.tsx`
- `send-password-update-notice/emails/PasswordUpdateEmailES.tsx`

**Scripts:**
- `scripts/import-tally-responses.ts`

---

## Landing (`content-manager-landing`)

**Reemplazo automático (nombre propio inequívoco):**
- `i18n/en/privacy.json`, `i18n/es/privacy.json`
- `i18n/en/terms.json`, `i18n/es/terms.json`

**Edición manual (nombre propio dentro de copy de marketing):**
- `pages/Privacy.tsx`, `pages/Terms.tsx`
- `i18n/es/core_insight.json`, `i18n/es/hero.json`, `i18n/es/manifesto.json`

**Estilos:**
- `styles/abstracts/_tokens.scss` — comentario de encabezado

**Preservado sin cambios (uso genérico confirmado):**
- `i18n/en/hero.json` — "A content intelligence platform for creators and teams", "exploring content intelligence"
- `i18n/en/solution.json`, `i18n/es/solution.json` — descripción de categoría de producto

---

## Notas técnicas

**Carpetas `.claude/worktrees/` detectadas en landing:** residuos de sesiones previas de Claude Code, con referencias antiguas a "Content Intelligence". Excluidas del rename por no ser contenido activo del proyecto. Queda pendiente decidir si se eliminan en una sesión de limpieza aparte.

**Verificación:** `grep -rni "content intelligence"` corrido en los 3 repos tras los cambios. Frontend y backend retornaron vacío. Landing retornó únicamente el uso genérico confirmado como intencional en `en/hero.json`.

---

## Pendiente relacionado (no incluido en este patch)

- **README.md del proyecto** — desactualizado, requiere revisión general fuera de este ciclo
- **Variable `VITE_APP_NAME` en Vercel** — pendiente de confirmar que ya refleja "Creadora" (alimenta el footer de la app vía `import.meta.env.VITE_APP_NAME`, no requiere cambio de código)
- **Bug de traducción preexistente** en `i18n/en.json`, bloque `onboarding.*` — contenido en español dentro del archivo de inglés, detectado de forma incidental durante este barrido pero fuera de alcance (no es parte del rename de marca)

---

## Operacional

**Git tags:**
- Frontend: `v2.6.1`
- Backend: `v2.6.1`
- Landing: `v1.2.1`

**Deployment:**
- Frontend — Vercel redeploy
- Backend — Edge Functions de email redeployed (`admin-invite-user`, `early-access`, `send-password-update-notice`, `tally-webhook`)
- Landing — Vercel redeploy

---

**Estado:** v2.6.1 / v1.2.1 completadas. Marca "Creadora" consistente en toda la superficie de producto activa. Sin cambios de comportamiento ni riesgo de regresión funcional.