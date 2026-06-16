# Content Intelligence Platform
## Changelog de Desarrollo — v4.0
**Admin Intelligence, Login Redesign, Borrado Lógico & Limpieza de Producción · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v3. Cubre la construcción del tab Waitlist Intelligence en el Admin Panel, el rediseño del flujo de Login, la corrección sistémica del borrado lógico de contenidos, y la limpieza de datos de prueba en producción.
 
Documentos de referencia previos:
- CHANGELOG_v3 — Security Audit, Fase 3 Creator Identity & Limpieza de datos
- CHANGELOG_v2 — Implementación de IA, Onboarding y Sistema de Recetas
- CHANGELOG_v1 — cambios post-auditoría inicial
- AUDIT_EXECUTIVE_SUMMARY_v1 — estado inicial del sistema
---
 
## 2. Resumen Ejecutivo
 
| 1 Nueva pestaña admin | 1 Rediseño de pantalla | 1 Fix sistémico BD | 1 Migración SQL |
|---|---|---|---|
 
---
 
## 3. Admin Panel — Waitlist Intelligence
 
Nueva pestaña en el Admin Panel dedicada al análisis estadístico de la lista de espera. Complementa la pestaña Operaciones (que conserva la gestión operativa del waitlist) con una vista analítica orientada a decisiones de producto.
 
### 3.1 Estructura del tab
 
El tab se compone de cinco secciones en orden vertical:
 
| Sección | Descripción |
|---|---|
| KPIs | Total registrados, invitados, tasa de invitación, semanas activas |
| Crecimiento acumulado | AreaChart con dos series: total acumulado (línea continua) y nuevos por semana (línea punteada) |
| Distribución por plataforma | Barras horizontales con porcentaje relativo |
| Distribución por idioma | Donut chart ES/EN con leyenda de valores absolutos y porcentaje |
| Early Access Waitlist | Tabla completa de solo lectura con columnas: email, plataforma, creator focus, idioma, estado, fecha |
 
### 3.2 Cambios en el frontend
 
| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | Tab `"waitlist"` agregado a `Admin.tsx` entre Operaciones y Ecosistema | Navegación |
| 🆕 NUEVO | Frontend App | Estado `allEarlyAccess` — carga lazy de todos los registros sin paginación al activar el tab | Estado |
| 🆕 NUEVO | Frontend App | `groupByWeek()` — agrupa registros por semana ISO y calcula acumulado | Helper |
| 🆕 NUEVO | Frontend App | `countBy()` — conteo genérico por campo para distribuciones | Helper |
| 🆕 NUEVO | Frontend App | `AreaChart` con `ResponsiveContainer` de recharts — series `cumulative` y `count` | Componente |
| 🆕 NUEVO | Frontend App | `PieChart` donut con `Cell` coloreado por tokens `--primary` / `--accent` | Componente |
| 🆕 NUEVO | Frontend App | Tabla de solo lectura de early access con columna `lang` agregada | Componente |
| 🆕 NUEVO | Frontend App | Imports de recharts ampliados: `AreaChart`, `Area`, `PieChart`, `Pie`, `Cell`, `Legend` | Dependencias |
| 🆕 NUEVO | Frontend App | Claves i18n: `waitlistIntelligence`, `waitlistOverview`, `totalRegistered`, `inviteRate`, `weeksActive`, `weeklyGrowth`, `platformBreakdown`, `languageDistribution`, `totalAccumulated`, `newThisWeek` | i18n |
| 🆕 NUEVO | Frontend App | Estilos nuevos en `Admin.scss`: `.admin-two-col`, `.admin-card--chart`, `.admin-chart-legend`, `.admin-chart-legend__item`, `.admin-section-hint` | Estilos |
 
### 3.3 Decisiones de diseño
 
**Carga lazy del tab:** `allEarlyAccess` solo se fetcha cuando el usuario navega al tab por primera vez, usando el mismo patrón de `ecosystem`. Evita un request innecesario si el admin nunca abre esa pestaña.
 
**Separación operaciones / inteligencia:** La tabla con botón de invite permanece en Operaciones. El tab de Inteligencia es de solo lectura — su propósito es análisis, no gestión. Esta separación intencional reduce el riesgo de invitaciones accidentales durante el análisis.
 
**Donut sobre pie:** Con solo dos segmentos (ES/EN) un pie sólido se ve pesado. El donut con `innerRadius={54}` y leyenda lateral comunica la distribución de forma más limpia y deja espacio visual para los valores absolutos.
 
**Creator focus eliminado como nube de keywords:** Se descartó el keyword cloud porque la información ya está disponible en la tabla completa de early access. Mostrar los textos completos es más útil para análisis cualitativo que extraer términos frecuentes.
 
---
 
## 4. Rediseño del flujo de Login
 
### 4.1 Cambios implementados
 
| Estado | Área | Cambio | Notas |
|---|---|---|---|
| 🆕 NUEVO | Frontend App | Rediseño visual de la pantalla Login | UI |
| 🆕 NUEVO | Frontend App | Lógica de acceso restringido post-registro — el creador no puede entrar a la app inmediatamente después de crear su cuenta | Auth |
| 🆕 NUEVO | Frontend App | Toast de confirmación al completar el sign up — informa al creador que puede loguearse | UX |
| 🆕 NUEVO | Frontend App | Mensajes diferenciados de bienvenida para sign in vs sign up | Copy |
 
### 4.2 Decisión de producto
 
El flujo anterior permitía acceso inmediato tras el registro. El nuevo flujo introduce una separación intencional entre crear cuenta y entrar a la app — el creador recibe confirmación por toast y debe hacer sign in explícitamente. Esto alinea la experiencia con el modelo de invitación controlada del early access y reduce el riesgo de usuarios que entren a un estado incompleto del producto.
 
---
 
## 5. Fix sistémico — Borrado lógico de contenidos
 
### 5.1 Contexto
 
La plataforma implementa borrado lógico en la tabla `contents` mediante el campo `is_deleted: boolean`. La decisión arquitectónica original es correcta y se mantiene — permite recuperación de registros y trazabilidad para auditorías. El problema identificado fue que varios endpoints no aplicaban el filtro de forma consistente, causando que contenidos eliminados contaminaran el DNA, los insights y los KPIs del admin.
 
### 5.2 Causa raíz del bug visible
 
El KPI "Total de contenidos" en el Admin Panel mostraba 25 en lugar de 15. Diagnóstico:
 
- `admin-users-summary` contaba `contents` sin filtrar `is_deleted` → incluía 10 contenidos borrados de `test@test.com`
- `admin-users-list` sí filtraba `.eq("is_deleted", false)` → mostraba 0 para ese usuario
- La inconsistencia entre KPI y tabla era visible en producción
### 5.3 Cambios en Edge Functions
 
Regla aplicada en todos los endpoints: reemplazar `.eq("is_deleted", false)` por `.neq("is_deleted", true)`. La diferencia es que `neq` incluye registros donde el campo es `null` — cubre registros legacy anteriores a la existencia de la columna.
 
| Estado | Endpoint | Cambio | Tipo |
|---|---|---|---|
| ✅ RESUELTO | `me-contents` | Filtro `is_deleted` verificado/aplicado | me-* |
| ✅ RESUELTO | `me-contents-history` | Filtro `is_deleted` verificado/aplicado | me-* |
| ✅ RESUELTO | `me-contents-by-platform` | Filtro `is_deleted` verificado/aplicado | me-* |
| ✅ RESUELTO | `me-contents-reusable` | Filtro `is_deleted` verificado/aplicado | me-* |
| ✅ RESUELTO | `content-dna` | Filtro `is_deleted` verificado/aplicado | Analytics |
| ✅ RESUELTO | `me-insights` | Filtro `is_deleted` verificado/aplicado | Analytics |
| ✅ RESUELTO | `admin-users-summary` | Filtro aplicado — fix del KPI visible | Admin |
| ✅ RESUELTO | `admin-users-list` | Filtro `.eq` reemplazado por `.neq` | Admin |
| ✅ RESUELTO | `admin-content-growth` | Filtro `is_deleted` verificado/aplicado | Admin |
| ✅ RESUELTO | `admin-content-growth-cumulative` | Filtro `is_deleted` verificado/aplicado | Admin |
| ✅ RESUELTO | `admin-content-growth-rate` | Filtro `is_deleted` verificado/aplicado | Admin |
 
### 5.4 Migración SQL aplicada
 
Archivo: `[timestamp]_fix_is_deleted_filters.sql`
 
| Objeto | Cambio |
|---|---|
| Vista `admin_users_summary` | `COUNT(c.id)` ahora filtra `is_deleted IS DISTINCT FROM true` en la condición del JOIN |
| Función `admin_content_growth_by_period` | WHERE agregado: `is_deleted IS DISTINCT FROM true` |
| Función `admin_content_growth_cumulative_by_period` | WHERE agregado: `is_deleted IS DISTINCT FROM true` |
| Función `admin_content_growth_rate_by_period` | WHERE agregado: `is_deleted IS DISTINCT FROM true` |
 
**Resultado post-migración verificado:** KPI "Total de contenidos" muestra 15, consistente con la tabla de usuarios activos.
 
---
 
## 6. Limpieza de datos de producción
 
Operaciones ejecutadas directamente en el SQL Editor de Supabase. No requieren migración — son manipulaciones de datos puntuales (DML), no cambios de esquema.
 
### 6.1 early_access_requests — 7 registros eliminados
 
| Email | Motivo |
|---|---|
| `siquiero0393848458@gmail.com` | Registro de prueba |
| `enanofeliz983848584@terra.com` | Registro de prueba |
| `test_usuario@test.com` | Registro de prueba |
| `nuevotestlocoloquisimo@loco.com` | Registro de prueba |
| `astridyanethramirezvelasquez@gmail.com` | Registro de prueba |
| `mariaoliviadiaz1950@gmail.com` | Registro de prueba |
| `mapedi21@hotmail.com` | Registro de prueba |
 
### 6.2 public.users + auth.users — 2 usuarios eliminados
 
| Email | user_id | tenant_id |
|---|---|---|
| `siquiero0393848458@gmail.com` | `bc8b3491` | `95aed176` |
| `enanofeliz983848584@terra.com` | `8d602f2e` | `19128370` |
 
Ambos usuarios tenían 0 contenidos y 0 ideas. Borrado sin riesgo de pérdida de datos reales.
 
### 6.3 tenants — 22 tenants eliminados
 
Eliminados todos los tenants con nombres de prueba o demo, más tenants huérfanos sin usuario correspondiente en `public.users`. Se preservó explícitamente el tenant `935015a9` (`test@test.com`).
 
Tenants eliminados: `siquiero`, `enanofeliz`, `test_usuario`, `nuevotestlocoloquisimo`, `dantealigieri8094808`, `mariaoliviadiaz1950`, `borrar_tambien`, `eliminame`, `borrame`, `test_new`, `pablo`, `lamuneca`, `karmakunsangdorje`, `demo_mail1` through `demo_mail9` (9 tenants).
 
### 6.4 Tenant de producción renombrado
 
| tenant_id | Nombre anterior | Nombre nuevo |
|---|---|---|
| `fdd42921-a240-4f25-aa35-38807d69179c` | `test@demoruedalibre.com` | `andresruedalibre` |
 
### 6.5 Contenidos de prueba purgados físicamente
 
10 contenidos de `test@test.com` con `is_deleted = true` fueron eliminados físicamente de la tabla `contents`. Eran registros de prueba sin valor real — ya estaban marcados como eliminados lógicamente.
 
---
 
## 7. Estado del sistema post-v4
 
| Tabla | Registros reales | Notas |
|---|---|---|
| `auth.users` | 9 usuarios | Andrés + 8 early adopters reales + test@test.com |
| `public.users` | 9 usuarios | Ídem |
| `tenants` | 9 tenants | Uno por usuario, todos limpios |
| `contents` | 15 activos | 13 Andrés + 1 anamariaq51 + 1 matias_toro |
| `early_access_requests` | 28 registros | Solo early adopters reales |
 
---
 
## 8. Roadmap Activo — Fases Pendientes
 
| Estado | Área | Cambio | Notas |
|---|---|---|---|
| ✅ COMPLETADO | Admin | Waitlist Intelligence tab | Esta versión |
| ✅ COMPLETADO | Frontend App | Rediseño Login + flujo de acceso post-registro | Esta versión |
| ✅ COMPLETADO | Backend | Fix sistémico borrado lógico — Edge Functions + migración SQL | Esta versión |
| 📋 PENDIENTE | Fase 3 — extensión | `strategy-insights` en `/identity` — cuando haya suficientes datos | Media prioridad |
| 📋 PENDIENTE | Fase 4 | Insights automáticos v2 — señales detectadas sin acción del creador | Alta prioridad |
| 📋 PENDIENTE | Fase 5 | Informe Creativo — narrativa profunda bajo demanda con Claude + web search | Media prioridad |
| 📋 PENDIENTE | Fase 6 | Content System View — vista de conjuntos idea + topics + contenidos | Media prioridad |
| 📋 PENDIENTE | Fase 7 | Pulido y lanzamiento — primer batch de early adopters | Baja prioridad |
| 📋 PENDIENTE | Feature futura | DNA Snapshots — fotografía del DNA en un momento dado | Backlog |
| 📋 PENDIENTE | Feature | Regeneración de aspecto específico de la Receta según feedback bajo | Fase 2 extensión |
| 📋 PENDIENTE | Feature | Sistema de nomenclatura para contenidos — title_pattern en users | Backlog |
| 📋 PENDIENTE | Feature | Perfil de usuario en UI — language, country, timezone, role | Backlog |
| 📋 PENDIENTE | Feature | Tags — sprint dedicado con modelo completo | Backlog |
| 📋 PENDIENTE | Arquitectura | SECURITY DEFINER views → SECURITY INVOKER (9 funciones) | Deuda técnica |
| 📋 PENDIENTE | Arquitectura | Migración de historial externo | Futuro |
 
---
 
*Content Intelligence Platform · Changelog v4.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*