# Content Intelligence Platform
## Changelog de Desarrollo — v5.0
**Admin Dashboards, Survey Intelligence, Login Refinements & Design System Extensions · Mayo 2026 · Uso interno**
 
---
 
## 1. Propósito de este documento
 
Este documento registra todos los cambios implementados después del CHANGELOG_v4 (v1.2.0). Cubre la construcción completa de los dashboards del Admin Panel — reorganización de Operaciones, refinamiento de Waitlist Intelligence, rediseño visual del Login y creación de la nueva pestaña Encuesta Creadores con integración a Google Sheets.
 
Documentos de referencia previos:
- CHANGELOG_v4 — Waitlist Intelligence v1, Login Redesign, Fix is_deleted, Limpieza de producción
- CHANGELOG_v3 — Security Audit, Fase 3 Creator Identity & Limpieza de datos
- CHANGELOG_v2 — Implementación de IA, Onboarding y Sistema de Recetas
- CHANGELOG_v1 — cambios post-auditoría inicial
- AUDIT_EXECUTIVE_SUMMARY_v1 — estado inicial del sistema
**Tag de versión:** `v1.3.0`
 
---
 
## 2. Resumen Ejecutivo
 
| 1 Pestaña nueva (Encuesta) | 1 Integración externa (Google Sheets) | 3 Pestañas admin refinadas | 2 Ajustes visuales Login |
|---|---|---|---|
 
---
 
## 3. Admin Panel — Operaciones (reorganización)
 
### 3.1 Cambios implementados
 
| Estado | Cambio | Notas |
|---|---|---|
| 🔄 MODIFICADO | Tabla de usuarios activos movida al final del tab | Prioriza métricas visuales arriba |
| 🆕 NUEVO | Donut de estado activo/inactivo usando `WaitlistDonut` | `--accent` para activos, `--bg-muted` para inactivos |
| 🔄 MODIFICADO | Distribución de plataformas migrada de barras horizontales a donut | Reutiliza `WaitlistDonut` y `PLATFORM_COLORS` |
| 🆕 NUEVO | Dos donuts lado a lado en `admin-two-col` | Estado + Plataformas |
 
---
 
## 4. Admin Panel — Waitlist Intelligence (refinamiento)
 
### 4.1 Cambios estructurales
 
| Estado | Cambio | Notas |
|---|---|---|
| 🔄 MODIFICADO | Tab movido después de Ecosistema | Orden: Operaciones → Ecosistema → Waitlist → Encuesta |
| 🔄 MODIFICADO | Sección de plataformas migrada de barras horizontales a donut | Consistencia visual con Operaciones |
| 🆕 NUEVO | Donuts de idioma y plataforma lado a lado en `admin-two-col` | Colapsan en columna bajo 900px |
| 🔄 MODIFICADO | Creator focus — tabla de texto completo reemplazada por donut de distribución por idioma | La tabla completa ya existe en la lista de espera |
 
### 4.2 Componente `WaitlistDonut` — extraído y reutilizable
 
Componente interno de `Admin.tsx` usado en Operaciones, Waitlist Intelligence y Encuesta.
 
Características:
- Layout: donut SVG (recharts) + leyenda en grid de 4 columnas: dot · label · count · porcentaje
- Labels sin truncamiento: `white-space: normal`, `overflow: visible`, `textOverflow: unset`
- `gridTemplateColumns: "8px auto 1fr auto"` — label toma ancho natural, no comprimido
- Props: `data: { name, value }[]`, `colors: string[]`, `total: number`
- Colores adaptativos: acepta tokens CSS — cambia automáticamente con el tema y la paleta de tweaks
### 4.3 Paleta extendida — variables pastel derivadas
 
Agregadas en `Admin.scss` usando `color-mix()` nativo de CSS:
 
```scss
--pastel-primary:    color-mix(in srgb, var(--primary) 45%, var(--bg-canvas));
--pastel-accent:     color-mix(in srgb, var(--accent) 45%, var(--bg-canvas));
--pastel-primary-d:  color-mix(in srgb, var(--primary) 65%, var(--bg-canvas));
--pastel-accent-d:   color-mix(in srgb, var(--accent) 65%, var(--bg-canvas));
--pastel-text:       color-mix(in srgb, var(--text) 35%, var(--bg-canvas));
--pastel-border:     color-mix(in srgb, var(--border-strong) 55%, var(--bg-canvas));
```
 
Coherentes con cualquier combinación de primary/accent/neutrals del design system. Se recalculan automáticamente cuando el usuario cambia la paleta desde el panel de tweaks.
 
### 4.4 `PLATFORM_COLORS` — array de tokens del design system
 
```tsx
const PLATFORM_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--primary-hover)",
  "var(--accent-hover)",
  "var(--pastel-primary-d)",
  "var(--pastel-accent-d)",
  "var(--pastel-border)",
];
```
 
---
 
## 5. Admin Panel — Encuesta Creadores (nueva pestaña)
 
Nueva pestaña de análisis estadístico de la encuesta bilingüe de Tally. Última pestaña del Admin Panel.
 
### 5.1 Arquitectura de la integración
 
```
Tally → Google Sheets (sync automático existente)
         ↓
    Edge Function admin-survey-responses
    (Google Sheets API v4 — solo lectura, API key)
         ↓
    Admin.tsx — tab "survey"
```
 
**Decisión de seguridad:** La hoja de Sheets es pública de solo lectura. Los emails de los respondentes son **omitidos deliberadamente** en la normalización del endpoint — la hoja pública hace que exponerlos sería un riesgo de privacidad.
 
### 5.2 Backend — Edge Function `admin-survey-responses`
 
| Aspecto | Detalle |
|---|---|
| Autenticación | Mismo patrón admin que otros endpoints — JWT + admin role check |
| Fetch | Google Sheets API v4 con API key (no service account — política org bloqueaba key creation) |
| Secrets | `GOOGLE_API_KEY`, `SURVEY_SHEET_ID` en Supabase secrets |
| Normalización | 70 columnas bilingües → 28 campos unificados |
| Filtrado | Filas sin plataforma eliminadas (`.filter(r => r.platform !== null)`) |
| Privacidad | Campos de email excluidos explícitamente del response |
 
**Test plan ejecutado y aprobado:**
- ✅ Endpoint retorna array normalizado de 29 objetos
- ✅ Sin campos ni valores con formato email en la respuesta
- ✅ Todas las filas tienen plataforma
### 5.3 Diccionario de normalización bilingüe `EN_TO_ES`
 
Diccionario centralizado que mapea cada respuesta EN a su equivalente ES canónico. Se aplica en `normalizeSurveyRow()` antes de cualquier agregación, garantizando que los `countBy` downstream no produzcan duplicados por idioma.
 
Cubre: frecuencia de publicación, reutilización de ideas, series, organización de ideas, mayor dificultad, feature más valiosa, respuesta de early access.
 
Los campos boolean-string (`TRUE`/`FALSE`) y multi-check son consistentes en ambos idiomas — no requieren normalización.
 
### 5.4 Estructura del tab
 
| Sección | Tipo de visualización | Datos |
|---|---|---|
| KPIs | 4 stat cards | Total respuestas, quieren acceso, tasa de interés, respuestas abiertas |
| Perfil del creador | 2 donuts en `admin-two-col` | Plataforma principal, frecuencia de publicación |
| Frecuencia de publicación | BarChart vertical con custom tick | Barras coloreadas por token, labels con word wrap |
| Comportamiento creativo | 3 donuts en `admin-three-col` | Organización de ideas, reutilización, series |
| Tipo de contenido | Barras horizontales | Multi-select, nota de disclaimer |
| Generación de ideas | Barras horizontales | Multi-select |
| Cómo miden qué funciona | Barras horizontales | Multi-select |
| Pain points | Barras horizontales con `--accent` | Mayor dificultad rankeada |
| Feature más valiosa | RadarChart 520px | Custom PolarAngleAxis con word wrap |
| Respuestas abiertas | Tabla paginada (5/página) | Idioma · plataforma · respuesta completa |
 
### 5.5 Componentes y estilos nuevos
 
| Estado | Elemento | Notas |
|---|---|---|
| 🆕 NUEVO | `admin-three-col` en `Admin.scss` | Grid 3 columnas, colapsa a 2 bajo 1100px, a 1 bajo 700px |
| 🆕 NUEVO | `.admin-bar-fill--accent` | Variante de barra con `var(--accent)` para pain points |
| 🔄 MODIFICADO | `.admin-bar-label` en `Admin.scss` | `width: auto`, `max-width: 220px`, `white-space: normal` — sin truncamiento |
| 🆕 NUEVO | RadarChart con custom `PolarAngleAxis` | Word wrap manual a 16 chars por línea, labels posicionados por coordenada relativa al centro |
| 🆕 NUEVO | BarChart vertical con custom `XAxis` tick | Word wrap a 10 chars, texto horizontal sin rotación diagonal |
 
### 5.6 i18n
 
38 claves nuevas agregadas en `en.json` y `es.json` bajo el prefijo `admin.survey*`.
 
### 5.7 Carga lazy
 
`surveyData` solo se fetcha cuando el usuario navega al tab por primera vez — mismo patrón que `ecosystem` y `allEarlyAccess`. Evita un request innecesario si el admin no abre esa pestaña.
 
---
 
## 6. Login — Refinamientos visuales
 
### 6.1 Cambios implementados
 
| Estado | Cambio | Notas |
|---|---|---|
| 🔄 MODIFICADO | Línea separadora inclinada hacia la derecha | `clip-path: polygon(0 0, 100% 0, 96% 100%, 0 100%)` o SVG con x1 < x2 |
| 🆕 NUEVO | Círculos concéntricos adicionales en fondo azul | 3 círculos nuevos con radios irregulares (340px, 560px, 620px) — opacidad 0.07 |
| 🔄 MODIFICADO | Mobile: sección azul como header delgado | `height: auto`, `padding: var(--s-4) var(--s-5)`, subtítulo y cita ocultos |
| 🔄 MODIFICADO | Mobile: lema destacado | `font-size: clamp(1.6rem, 6vw, 2rem)`, logo subordinado con `opacity: 0.7` |
| 🔄 MODIFICADO | Mobile: formulario ocupa el resto de la pantalla | Panel derecho con `flex: 1`, `overflow-y: auto` |
| 🔄 MODIFICADO | SVG de separación oculto en mobile | `display: none` bajo 768px — no aplica en layout vertical |
 
### 6.2 Decisión de producto
 
El header azul en mobile es un banner de marca mínimo — suficiente para comunicar identidad sin aplastar el formulario. El lema *"Tus ideas ven la luz."* es visible aunque sea brevemente, evitando que la pantalla se vea genérica en mobile.
 
---
 
## 7. Estado del sistema post-v5
 
| Área | Estado |
|---|---|
| Admin Panel | 4 pestañas: Operaciones, Ecosistema, Waitlist Intelligence, Encuesta Creadores |
| Integración externa | Google Sheets API — encuesta Tally conectada en solo lectura |
| Design system | Paleta extendida con 6 variables pastel derivadas |
| Componentes reutilizables | `WaitlistDonut` usado en 3 pestañas del admin |
| Login | Split layout con inclinación, círculos decorativos, mobile adaptado |
 
---
 
## 8. Roadmap Activo — Fases Pendientes
 
| Estado | Área | Cambio | Prioridad |
|---|---|---|---|
| 📋 PENDIENTE | Fase 3 — extensión | `strategy-insights` en `/identity` — cuando haya suficientes datos | Media |
| 📋 PENDIENTE | Fase 4 | Insights automáticos v2 — señales detectadas sin acción del creador | Alta |
| 📋 PENDIENTE | Fase 5 | Informe Creativo — narrativa profunda bajo demanda con Claude + web search | Media |
| 📋 PENDIENTE | Fase 6 | Content System View — vista de conjuntos idea + topics + contenidos | Media |
| 📋 PENDIENTE | Fase 7 | Pulido y lanzamiento — primer batch de early adopters | Baja |
| 📋 PENDIENTE | Feature | DNA Snapshots — fotografía del DNA en un momento dado | Backlog |
| 📋 PENDIENTE | Feature | Regeneración de aspecto específico de la Receta según feedback bajo | Backlog |
| 📋 PENDIENTE | Feature | Sistema de nomenclatura para contenidos — title_pattern en users | Backlog |
| 📋 PENDIENTE | Feature | Perfil de usuario en UI — language, country, timezone, role | Backlog |
| 📋 PENDIENTE | Feature | Tags — sprint dedicado con modelo completo | Backlog |
| 📋 PENDIENTE | Arquitectura | SECURITY DEFINER views → SECURITY INVOKER (9 funciones) | Deuda técnica |
| 📋 PENDIENTE | Arquitectura | Migración de historial externo | Futuro |
 
---
 
*Content Intelligence Platform · Changelog v5.0 · Tag v1.3.0 · Mayo 2026*
*Documento vivo. Actualizar tras cada ciclo de desarrollo.*