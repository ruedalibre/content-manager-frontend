# Changelog v22 — v2.6.2 (app) · v1.2.2 (landing)

## Migración de dominio a usecreadora.com + Fix crítico de seguridad RLS

**Fecha:** 4-5 de julio de 2026
**Versión:** v2.6.2 (frontend + backend) · v1.2.2 (landing)
**Tipo:** Patch — infraestructura de dominio + hallazgo crítico de seguridad
**Objetivo:** Migrar la app y landing al dominio definitivo `usecreadora.com`, y resolver un hallazgo crítico de seguridad detectado por Supabase Security Advisor

---

## 🔴 HALLAZGO CRÍTICO — RLS faltante en tablas de Workspaces

### Descubrimiento

Supabase Security Advisor detectó que las tablas `workspaces` y `workspace_members` — creadas en Phase 1 (junio 2026) — **nunca tuvieron Row Level Security habilitado**. A pesar de que las políticas RLS se documentaron y aplicaron correctamente en `creative_units`, `contents`, `creative_sessions` y `audit_logs` durante Phase 2, las dos tablas base de la infraestructura de workspaces quedaron fuera de ese barrido.

### Impacto real

Con RLS deshabilitado, ambas tablas quedaron expuestas **sin ninguna restricción** a través de la API REST pública de Supabase (PostgREST), accesible con la anon key — la misma key que está embebida públicamente en el bundle de JavaScript del frontend. Esto significaba que, desde la creación de estas tablas, técnicamente era posible para cualquier actor externo:

- Leer todos los workspaces de todos los usuarios (nombres, descripciones)
- Leer todos los registros de `workspace_members` (qué usuario pertenece a qué workspace, con qué rol)
- Insertar registros arbitrarios en `workspace_members`, incluyendo auto-asignarse como `owner` de un workspace ajeno (escalación de privilegios)
- Eliminar membresías de otros usuarios

Las validaciones de membership en las Edge Functions (`generate-recipe`, `create-content`) no mitigaban este riesgo, porque el acceso directo a la tabla vía REST API no pasa por esas funciones.

### Fix aplicado

Migración `fix_rls_workspaces_critical`:

```sql
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_own" ON workspaces
FOR SELECT USING (
  id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY "workspace_members_select_own" ON workspace_members
FOR SELECT USING (user_id = auth.uid());
```

**Diseño de la política:** solo se definieron políticas de `SELECT`. Todas las mutaciones (creación de workspace, membership) pasan exclusivamente por Edge Functions que usan `SUPABASE_SERVICE_ROLE_KEY`, la cual bypassa RLS por diseño. Al no existir política de INSERT/UPDATE/DELETE para los roles `authenticated`/`anon`, esas operaciones quedan denegadas por defecto para cualquier acceso directo a la tabla — solo las Edge Functions controladas pueden escribir.

### Verificación

```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('workspaces', 'workspace_members');
-- ambas: rls_enabled = true

SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('workspaces', 'workspace_members');
-- 1 política SELECT por tabla
```

Confirmado funcionalmente: `WorkspaceSelector` en producción sigue mostrando el workspace "Personal" correctamente tras el fix — el flujo de `me-workspaces` (que usa JWT de usuario, no service role) sigue funcionando porque la política permite `user_id = auth.uid()`.

**Lección para el proceso:** al crear nuevas tablas en el schema `public`, verificar explícitamente con Security Advisor de Supabase (o `pg_class.relrowsecurity`) que RLS quedó habilitado — no asumir que forma parte automática de la migración solo porque se documentó la intención.

---

## Migración de dominio — content-intel.app → usecreadora.com

### Contexto

Con `usecreadora.com` registrado (ver informe Slipway del 4 de julio) y el plan Hobby de Vercel limitando a un dominio custom por proyecto, se optó por remover `content-intel.app` de Vercel y configurar redirects permanentes a nivel de DNS en Namecheap, en vez de pagar upgrade de plan.

### Vercel

- Proyecto app: dominio `app.content-intel.app` removido → agregado `app.usecreadora.com`
- Proyecto landing: dominio `content-intel.app` removido → agregado `usecreadora.com`

### Namecheap — Advanced DNS de `content-intel.app`

**Registros eliminados** (huérfanos, apuntaban a un proyecto ya desconectado de Vercel):
- `A` record `@` → `216.198.79.1`
- `CNAME` `app` → `fb0fd740163a1639.vercel-dns-017.com.`
- `CNAME` `www` → `parkingpage.namecheap.com.`
- `CNAME` `www` → `1f9e0e928fbb3170.vercel-dns-017.com.`

**URL Redirect Records agregados** (Permanent 301):
- `@` (raíz) → `https://usecreadora.com`
- `www` → `https://usecreadora.com`
- `app` → `https://app.usecreadora.com`

Registros de Google Workspace (`google._domainkey`, `google-site-verification`) y de Resend (`_dmarc`, `resend._domainkey`, `send`) para `content-intel.app` se dejaron intactos durante la transición.

### MX / correo entrante

Se verificó que `usecreadora.com` usa el esquema simplificado de Google Workspace (un solo registro `MX @ → SMTP.GOOGLE.COM`, prioridad 1) en vez del esquema clásico de 5 registros. Confirmado funcional con correo de prueba a `hello@usecreadora.com`.

### Resend

- Dominio `content-intel.app` eliminado de Resend
- Dominio `usecreadora.com` agregado y verificado (SPF/DKIM/DMARC vía registros TXT/CNAME en Namecheap)
- Remitente de correos transaccionales actualizado de `"Andrés from Creadora <andres@content-intel.app>"` a **`"Creadora <hello@usecreadora.com>"`**

---

## Cambios de código

### Frontend (`content-manager-frontend`)

- `Login.tsx`, `Privacy.tsx`, `Terms.tsx`, `i18n/en.json`, `i18n/es.json` — URLs y email de contacto actualizados a `usecreadora.com` / `hello@usecreadora.com`
- `index.html` — metadata Open Graph (`og:image`, `og:url`, `twitter:image`) actualizada
- `CLAUDE.md` — URL de producción actualizada (housekeeping para futuras sesiones de Claude Code)

### Backend (privado)

- `admin-invite-user/index.ts`, `create-checkout-session/index.ts`, `customer-portal-session/index.ts`, `send-password-update-notice/emails/PasswordUpdateEmailES.tsx` — URLs de la app (`APP_URL` fallback, success/cancel URLs de Stripe, links en emails) actualizadas a `app.usecreadora.com`
- `admin-invite-user/index.ts`, `early-access/index.ts`, `send-password-update-notice/index.ts`, `tally-webhook/index.ts`, `scripts/import-tally-responses.ts` — campo `from:` actualizado a `"Creadora <hello@usecreadora.com>"`
- `CLAUDE.md` — URL de producción actualizada
- Migración `fix_rls_workspaces_critical` (ver sección de seguridad arriba)

### Landing (`content-manager-landing`)

- `index.html`, `Pricing.tsx`, `Privacy.tsx`, `Terms.tsx` — URLs y email de contacto actualizados

### Preservado intencionalmente sin cambios

- Changelogs históricos (v6, v8, v9, v10, v11, v21) — referencias a `content-intel.app` como registro histórico, no se reescriben
- Carpetas `.claude/worktrees/` en landing — residuos de sesiones previas, excluidas del barrido; pendiente decisión de limpieza en sesión aparte

---

## Testing / Verificación

- ✅ `usecreadora.com` y `app.usecreadora.com` cargando correctamente en Vercel
- ✅ `content-intel.app` (raíz, `www`, `app`) redirigiendo 301 a los dominios nuevos correspondientes, verificado vía dnschecker.org
- ✅ Correo entrante a `hello@usecreadora.com` confirmado funcional
- ✅ Dominio `usecreadora.com` verificado en Resend
- ✅ `grep -rni "content-intel.app"` en los 3 repos — vacío fuera de `/docs` (changelogs históricos) y `.claude/worktrees/` (residuos no activos)
- ✅ RLS habilitado y verificado en `workspaces` y `workspace_members`
- ✅ `WorkspaceSelector` funcional en producción tras el fix de RLS

---

## Pendiente relacionado

- README.md del proyecto — sigue desactualizado, no abordado en este ciclo
- Decisión sobre limpieza de `.claude/worktrees/` en landing
- Evaluar si conviene registrar formalmente las políticas RLS de `workspaces`/`workspace_members` con mayor granularidad (hoy solo SELECT) cuando se aborde Phase 3.5 y la gestión de miembros de equipo

---

## Operacional

**Git tags:**
- Frontend: `v2.6.2`
- Backend: `v2.6.2`
- Landing: `v1.2.2`

**Deployment:**
- Frontend, backend y landing — redeploy completo en Vercel
- Edge Functions redeployed: `admin-invite-user`, `create-checkout-session`, `customer-portal-session`, `send-password-update-notice`, `early-access`, `tally-webhook`
- Migración `fix_rls_workspaces_critical` aplicada vía `supabase db push`

---

**Estado:** v2.6.2 / v1.2.2 completadas. Dominio productivo migrado a `usecreadora.com`. Hallazgo crítico de seguridad (RLS faltante) resuelto y verificado. Sin incidentes de disponibilidad reportados durante la migración.