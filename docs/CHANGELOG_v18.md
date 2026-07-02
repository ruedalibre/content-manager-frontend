# Changelog v18 — v2.5.0-phase-1

## Infraestructura de Workspaces — Phase 1 de Arquitectura Multi-User

**Fecha:** Junio 2026  
**Versión:** v2.5.0-phase-1 (backend + frontend)  
**Objetivo:** Establecer arquitectura de BD agnóstica para Acto 1 (creadores individuales), Acto 2 (equipos) y Acto 3 (agencias) sin reproceso futuro

---

## Backend

### BD — Nuevas tablas (Multi-user ready)

**Tabla `workspaces`:**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_personal BOOLEAN DEFAULT false,
  system_prompt JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(tenant_id, name)
);
```
- `is_personal = true` para workspace personal de cada usuario
- `system_prompt` JSONB para IA controls a nivel workspace (futuro)
- Índices: `idx_workspaces_tenant`, `idx_workspaces_creator`

**Tabla `workspace_members`:**
```sql
CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
```
- Diseñada para 1-N miembros por workspace (agnóstica a multi-user)
- `role` soporta 'owner' | 'editor' | 'viewer' (granularidad para futuro Phase 6)
- Índice: `idx_workspace_members_user`

### BD — Cambios en tablas existentes

**`creative_units` (ideas):**
- `ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE`
- Todas las 76 ideas migraron exitosamente a su workspace personal

**`contents`:**
- `ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE`
- Todas las 75 contenidos migraron exitosamente a su workspace personal

**`creative_sessions`:**
- `ADD COLUMN aia_voice_override TEXT DEFAULT NULL`
- `ADD COLUMN aia_rationality_balance_override TEXT DEFAULT NULL`
- `ADD COLUMN aia_completeness_level_override TEXT DEFAULT NULL`
- (Preparación para controles granulares de IA por idea — Phase 4-5)

**`user_profiles`:**
- `ADD COLUMN current_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL`
- (Preparación para selector de workspace en UI — Phase 3)

**`tenants`:**
- `ADD COLUMN account_type TEXT DEFAULT 'personal'`
- Valores soportados: 'personal' | 'team' | 'agency' | 'brand'
- Agnóstico para evolución sin cambios de BD

### Migración de datos — Phase 1

**Proceso:**
1. Creadas 25 workspaces personales (1 por usuario)
2. Migrradas 76 ideas a su workspace personal (0 huérfanas)
3. Migradas 75 contenidos a su workspace personal (100% coverage)
4. Agregados 25 workspace_members (cada usuario = owner de su workspace personal)
5. Corregida inconsistencia: 7 ideas de `soto1779@gmail.com` tenían tenant_id incorrecto → reasignadas al tenant correcto

**Verificación post-migración:**
- ✅ 76 ideas con workspace_id asignado
- ✅ 75 contenidos con workspace_id asignado
- ✅ 25 workspaces personales creados
- ✅ 25 workspace_members (1 owner per workspace)
- ✅ 0 registros huérfanos

### Frontend

**Cambios mínimos (non-breaking):**
- No requiere cambios en componentes existentes para funcionar con workspace
- Preparación: ID de workspace será pasado en requests futuros (Phase 2)
- IdeaCard y ContentRow mantienen look & feel idéntico

### Documentación

**Archivo nuevo:** `/ARCHITECTURE_Workspaces_v3.0.md`
- Esquema BD completo
- Plan 6 fases de implementación
- Timeline de los 3 Actos (creadores → equipos → agencias)
- Estrategia de backups y rollback

---

## Operacional

**Backups Supabase:**
- Upgrade a PRO ($25/mes)
- Daily backups activos, 7 días retención
- Backup manual ejecutado antes de Phase 1

**Git tags:**
- Frontend: `v2.5.0-phase-1`
- Backend: `v2.5.0-phase-1`

**Verificaciones ejecutadas:**
- ✅ Baseline de datos (76 ideas, 75 contenidos, 25 usuarios)
- ✅ Integridad post-migración
- ✅ Resolución de inconsistencias (tenant_id)
- ✅ Coverage 100% en ideas y contenidos

---

## Notas técnicas

**Agnóstico a multi-user:**
- El schema de BD ya soporta 1-N usuarios/workspace
- Hoy: 1 usuario/workspace (Acto 1)
- Futuro (Nov-Dic 2026): N usuarios/workspace (Acto 2) — sin cambios de BD, solo datos nuevos en `workspace_members`
- Futuro (Q1 2027): Agencias con roles granulares (Acto 3) — sin cambios de BD

**Escalabilidad:**
- RLS policies diseñadas para workspace-scoped access
- Índices en `tenant_id` y `workspace_id` para performance
- Estructura lista para audit logging y roles (Phase 2 en adelante)

**Próximas fases:**
- **Phase 2** (Julio 2026): RLS policies + audit_logs + Edge Functions updated
- **Phase 3** (Julio-Agosto): UI workspace selector
- **Phase 4-5** (Agosto-Septiembre): Admin panel + Activity log
- **Lanzamiento Acto 1** (Octubre 2026): Creadores individuales con workspaces personales

---

## Apéndice: Decisiones de diseño

| Decisión | Razonamiento |
|----------|--------------|
| `workspace_members` agnóstica a count | Hoy 1 usuario, mañana N usuarios — estructura lista desde el inicio |
| `is_personal = true` flag | Diferencia workspace personal (privado) de workspace de proyecto/cliente (compartible) |
| `system_prompt JSONB` | Controles de IA a nivel workspace sin multiplicar columnas |
| `current_workspace_id` en user_profiles | Recuerda el último workspace visitado (UX) |
| `account_type` en tenants | No en workspace — define nivel de cuenta, no propiedades del workspace |
| Migración 1-1 (idea → workspace) | Cada idea exactamente en 1 workspace (no duplicadas) |

---

**Estado:** Phase 1 completada y verificada. Sistema listo para Phase 2 (RLS + Auditoría).