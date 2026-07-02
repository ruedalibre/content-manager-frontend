# Changelog v17 — v2.5.0

## Campos avanzados de intención en el brief — Control granular de contenido

**Fecha:** Junio 2026  
**Versión:** v2.5.0 (frontend + backend)  
**Objetivo:** Agregar campos de intención granular al brief para que el creador pueda especificar objetivo, CTA e audiencia objetivo de forma explícita

---

## Backend

### BD — Nuevas columnas en tablas principales

**`creative_sessions`:**
- `ADD COLUMN content_goal TEXT DEFAULT NULL` — Objetivo principal del contenido (ej: "Generar awareness", "Convertir a cliente")
- `ADD COLUMN cta_intent TEXT DEFAULT NULL` — Llamada a la acción específica (ej: "Suscribirse a newsletter", "Comprar ahora")
- `ADD COLUMN target_audience TEXT DEFAULT NULL` — Audiencia objetivo detallada (ej: "Emprendedores 25-40 años, tech-savvy")

**`contents`:**
- `ADD COLUMN content_goal TEXT DEFAULT NULL` — Hereda del brief o se especifica en el contenido
- `ADD COLUMN cta_intent TEXT DEFAULT NULL` — Hereda del brief o se especifica en el contenido
- `ADD COLUMN target_audience TEXT DEFAULT NULL` — Hereda del brief o se especifica en el contenido

### Edge Function — `generate-recipe` actualizada

**Cambios en request body:**
- Nuevos parámetros opcionales: `content_goal`, `cta_intent`, `target_audience`
- Estos parámetros se pasan desde el frontend (sección Avanzado del IdeaCard)

**Cambios en prompt building:**
- Nueva sección `## INTENCIÓN DEL CONTENIDO` en el prompt a Claude
- Si alguno de estos campos está presente, se incluyen en el prompt:
  ```
  Objetivo: {content_goal}
  Llamada a la acción: {cta_intent}
  Audiencia objetivo: {target_audience}
  
  Incorpora esta información en el brief. El ángulo, tono y estructura deben estar alineados con este objetivo y audiencia.
  ```
- El brief resultante es más preciso y contextualizado a la intención real del creador

**Cambios en INSERT de creative_sessions:**
- Los tres campos se guardan en la BD: `content_goal`, `cta_intent`, `target_audience`
- Se devuelven en el response `session` object

**Cambios en Edge Function — `create-content` actualizada:**
- Nuevos parámetros opcionales en request body: `content_goal`, `cta_intent`, `target_audience`
- Se guardan en la tabla `contents` al insertar
- Heredan del brief si no se especifican en el contenido

---

## Frontend

### Componente `IdeaCard.tsx` — Sección "Avanzado"

**Nueva sección colapsable:**
- Header: "Avanzado" con chevron toggle
- Ubicación: debajo de Platform + Format
- Background: `var(--bg-muted)` (color de fondo suave)
- Grid layout: 2 columnas (respira en mobile)

**Campos incluidos:**
1. **Objetivo del contenido** (select o text input)
   - Placeholder: "Ej: Generar awareness, Convertir, Educar"
   - Vinculado a `content_goal`

2. **Llamada a la acción** (select o text input)
   - Placeholder: "Ej: Suscribirse, Comprar, Descargar"
   - Vinculado a `cta_intent`

3. **Audiencia objetivo** (text input)
   - Placeholder: "Ej: Emprendedores 25-40, Tech-savvy"
   - Vinculado a `target_audience`

**Comportamiento:**
- Sección contraída por defecto
- Se expande al hacer click en "Avanzado"
- Chevron rota indicando estado (colapsado/expandido)
- Botón "Generar" en el footer a la derecha (ya existía)
- Campos se **limpian automáticamente** después de generar el brief (UX: no dejar valores obsoletos)

### Hook `useIdeaCardState.ts` — Tipo actualizado

```typescript
interface IdeaCardState {
  // ... campos existentes
  content_goal?: string;
  cta_intent?: string;
  target_audience?: string;
}
```

### Hook `useIdeas.ts` — Métodos actualizados

**Tipo CreativeSession:**
```typescript
interface CreativeSession {
  // ... campos existentes
  content_goal?: string | null;
  cta_intent?: string | null;
  target_audience?: string | null;
}
```

**Método `generateRecipe`:**
- Parámetros nuevos opcionales: `content_goal?`, `cta_intent?`, `target_audience?`
- Se pasan en el payload de la request a `generate-recipe`
- Se guardan en el estado de la sesión

### Componente `Ideas.tsx` — Handlers nuevos

**Nuevos handlers:**
- `onGoalChange(id: string, value: string)` — Actualiza `content_goal` en el estado local
- `onCtaIntentChange(id: string, value: string)` — Actualiza `cta_intent` en el estado local
- `onAudienceChange(id: string, value: string)` — Actualiza `target_audience` en el estado local

**Flujo:**
1. Usuario escribe en campo de Avanzado
2. Handler actualiza estado local inmediatamente (UI responsiva)
3. Al generar brief, se envían los valores al backend
4. Después de generar exitosamente, se limpian los campos

### i18n — Claves nuevas ES/EN

**Nuevas claves en `locales/es.json` y `locales/en.json`:**

```json
{
  "ideas.advanced": "Avanzado",
  "ideas.contentGoalLabel": "Objetivo del contenido",
  "ideas.ctaIntentLabel": "Llamada a la acción",
  "ideas.targetAudienceLabel": "Audiencia objetivo",
  "ideas.targetAudiencePlaceholder": "Ej: Emprendedores 25-40, Tech-savvy",
  "ideas.contentGoalEmpty": "No especificado",
  "ideas.ctaIntentEmpty": "No especificado",
  "ideas.contentGoals.awareness": "Generar awareness",
  "ideas.contentGoals.conversion": "Convertir a cliente",
  "ideas.contentGoals.education": "Educar",
  "ideas.contentGoals.entertainment": "Entretener",
  "ideas.contentGoals.engagement": "Aumentar engagement",
  "ideas.ctaIntents.subscribe": "Suscribirse",
  "ideas.ctaIntents.buy": "Comprar",
  "ideas.ctaIntents.download": "Descargar",
  "ideas.ctaIntents.share": "Compartir",
  "ideas.ctaIntents.comment": "Comentar",
  "ideas.ctaIntents.click": "Hacer click"
}
```

### Estilos SCSS — Sección Avanzado

**Nuevas clases en `IdeaCard.module.scss`:**

```scss
.idea-card__advanced {
  background: var(--bg-muted);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-2);
  margin-top: var(--spacing-2);
  
  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    
    &-title {
      font-size: var(--fs-12);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
    }
    
    &-chevron {
      transition: transform 0.2s ease;
      
      &.collapsed {
        transform: rotate(0deg);
      }
      
      &.expanded {
        transform: rotate(180deg);
      }
    }
  }
  
  &-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-2);
    margin-top: var(--spacing-2);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  &-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    
    label {
      font-size: var(--fs-10);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-tertiary);
    }
    
    input, select {
      height: 32px;
      font-size: var(--fs-12);
      padding: var(--spacing-1) var(--spacing-1-5);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-xs);
      background: var(--bg-primary);
      color: var(--text-primary);
      
      &::placeholder {
        color: var(--text-tertiary);
      }
    }
  }
}

.idea-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--border-color);
}
```

### Componente `RecipePanel.tsx` — Actualizado

**Cambios:**
- Tipo `recipe` ahora es `Record<string, string | string[]>` (no hardcodeado)
- `recipe_context` parámetro actualizado para soportar contexto variable por familia
- Si `session.content_goal` / `session.cta_intent` / `session.target_audience` existen, se muestran en contexto (opcional, para futuro)

---

## UX/Product

**Flujo del usuario:**

1. Crea idea (como antes)
2. Selecciona Platform + Format (como antes)
3. **[NUEVO]** Hace click en "Avanzado" si quiere especificar intención
4. Completa campos: Objetivo, CTA, Audiencia (opcionales)
5. Genera brief (como antes, pero ahora más preciso)
6. Brief ya incluye la intención del usuario en el prompt
7. Campos Avanzado se limpian automáticamente
8. Crea contenido desde el brief
9. Campos se guardan también en `contents`

**Beneficio:**
- El creador tiene control granular sobre qué espera del contenido
- El brief es más personalizado y menos genérico
- La IA tiene más contexto para sugerencias
- Los contenidos guardados documentan la intención original

---

## Testing

**Checkpoints de validación:**

1. ✅ Crear idea sin rellenar Avanzado — brief debe funcionar (campos opcionales)
2. ✅ Crear idea + rellenar Avanzado — brief debe incorporar la intención en el prompt
3. ✅ Generar brief → campos Avanzado se limpian automáticamente
4. ✅ Contenido creado desde brief → campos `content_goal`, `cta_intent`, `target_audience` guardados en `contents`
5. ✅ i18n ES/EN funciona en todos los nuevos labels
6. ✅ Responsive: grid 2 cols en desktop, 1 col en mobile
7. ✅ Sección se colapsa/expande al hacer click en "Avanzado"

---

## Operacional

**BD Migrations:** 3 migrations aplicadas
- `add_content_goal_cta_target_audience_creative_sessions`
- `add_content_goal_cta_target_audience_contents`
- (columnas se crean con DEFAULT NULL, non-breaking)

**Git tags:**
- Frontend: `v2.5.0`
- Backend: `v2.5.0`

**Deployment:**
- `generate-recipe` Edge Function redeployed
- `create-content` Edge Function redeployed
- Frontend Vercel redeploy

---

## Notas técnicas

**Por qué opcional:**
- Muchos creadores generan briefs sin especificar intención (flujo natural)
- Los campos no bloquean generación
- BD nullable para backward compatibility

**Por qué se limpian después de generar:**
- UX: evitar que el usuario regenere brief con valores obsoletos
- Claridad: cada brief tiene su propia intención
- Futuro: si se regenera, se pide que re-especifique (más intención explícita)

**Próximas fases:**
- **Phase 3 (futuro):** Mostrar intención en RecipePanel (opcional)
- **Phase 4 (futuro):** Analytics — rastrear intención vs performance
- **Phase 5 (futuro):** Sugerencias basadas en intención histórica

---

**Estado:** v2.5.0 completada. Sistema listo para Workspaces v3.0 (Phase 1 y Phase 2).
