# Changelog v19 — v2.5.0-phase-2

## Row Level Security + Auditoría — Phase 2 de Arquitectura Multi-User

**Fecha:** Junio 2026  
**Versión:** v2.5.0-phase-2 (backend)  
**Objetivo:** Implementar seguridad workspace-scoped, role-aware y logging automático para preparar Acto 2 (equipos) sin cambios de BD futuro

---

## Backend

### BD — Nueva tabla `audit_logs`

**Tabla para registro inmutable de auditoría:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

**Índices:** `idx_audit_logs_workspace`, `idx_audit_logs_user`, `idx_audit_logs_resource`, `idx_audit_logs_created_at DESC`

**RLS:**
- `SELECT`: Solo miembros del workspace pueden ver su audit log
- `INSERT`: Solo `service_role` (Edge Functions) pueden escribir
- `UPDATE/DELETE`: Bloqueadas (audit log es immutable)

### RLS Policies — Reemplazadas

**Antes:** 9 políticas tenant-scoped  
**Ahora:** 12 políticas workspace-scoped + role-aware

**`creative_units` (ideas):**
- `Users can view ideas in their workspaces` (SELECT)
- `Users can create ideas in their workspaces` (INSERT, role != 'viewer')
- `Users can update ideas in their workspaces` (UPDATE, role != 'viewer')
- `Users can delete ideas in their workspaces` (DELETE, role != 'viewer')

**`contents`:**
- `Users can view contents in their workspaces` (SELECT)
- `Users can create contents in their workspaces` (INSERT, role != 'viewer')
- `Users can update contents in their workspaces` (UPDATE, role != 'viewer')
- `Users can delete contents in their workspaces` (DELETE, role != 'viewer')

**`creative_sessions` (colaborativas):**
- `Users can view creative sessions in their workspaces` (SELECT)
- `Users can update creative sessions in their workspaces` (UPDATE, role != 'viewer' — permite crear contenido desde brief)
- `Users can delete creative sessions in their workspaces` (DELETE, role != 'viewer')

**Nota importante:** Cualquier editor/owner del workspace puede crear contenido desde un brief, no solo el creador original.

### Edge Functions — Actualizado

#### `generate-recipe` (Generar brief)

**Cambios:**
- `workspace_id` parámetro requerido en request body
- Validación: usuario es miembro del workspace
- Logging automático: inserta en `audit_logs` con action `'generate_recipe'`
- Payload logging: `idea_id`, `platform_id`, `format`, `content_goal`, `cta_intent`, `target_audience`

#### `create-content` (Crear contenido)

**Cambios:**
- `workspace_id` parámetro requerido en request body
- Validación: usuario es miembro AND role != 'viewer'
- Logging automático: inserta en `audit_logs` con action `'generate_content'`
- Payload logging: `title`, `platform_id`, `format`, `status`, `content_goal`, `cta_intent`, `target_audience`

### Verificación post-deployment

**Checkpoint 2.1:**
- ✅ Tabla `audit_logs` creada (14 columnas)
- ✅ 5 índices en lugar
- ✅ RLS policies SELECT + INSERT protegidas
- ✅ Tabla vacía (0 logs)

**Checkpoint 2.2:**
- ✅ 12 políticas RLS nuevas en lugar
- ✅ Todas workspace-scoped + role-aware
- ✅ 0 políticas antiguas (tenant-based eliminadas)

**Checkpoint 2.3:**
- ✅ `generate-recipe` desplegado (validación + logging)
- ✅ `create-content` desplegado (validación + logging)

---

## Operacional

**Cambios en Edge Functions:**
1. `supabase functions deploy generate-recipe`
2. `supabase functions deploy create-content`

**Git tags:**
- v2.5.0-phase-2 (backend)

---

## Transición Acto 1 → Acto 2 (Nov-Dic 2026)

**Sin cambios de BD:**
- `audit_logs` ya existe → historial completo desde el inicio
- `workspace_members` tabla lista → solo agregar nuevos rows
- RLS policies agnósticas → funcionan para 1 o N miembros
- Edge Functions listas para equipos

**Qué se agrega:**
- Invitaciones por email (feature)
- Admin dashboard (UI)
- Roles UI (UI)
- Billing multiuser (lógica)

---

## Próximas fases

- **Phase 3** (Julio-Agosto 2026): Workspace selector en navbar (frontend)
- **Phase 4** (Agosto): Admin dashboard — gestionar miembros, roles
- **Phase 5** (Agosto-Septiembre): Activity log UI — visualizar audit_logs
- **Phase 6** (Futuro): Roles granulares (creative director, PM, creator, viewer)

---

**Estado:** Phase 2 completada. Backend totalmente workspace-scoped, role-aware y con logging automático. Sistema listo para Phase 3 (UI) y Acto 1 (octubre 2026).
