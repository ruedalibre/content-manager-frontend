# Changelog v15 — v2.3.0

## Brief adaptado por formato

### Backend
- Enum `content_format` extendido con 8 nuevos valores: `short`, `live`, `community_post`, `clip`, `broadcast`, `newsletter`, `article`, `landing`
- YouTube `text` migrado a `community_post`
- Nueva plataforma **Website / Blog** (`website`) con tipo `owned_media` y 3 formatos: `article`, `newsletter`, `landing`
- Nuevos formatos agregados a plataformas existentes: Instagram `broadcast`, TikTok `live` + `carousel`, YouTube `short` + `live`, LinkedIn `newsletter`, Facebook `reel`, Twitch `live` + `clip`
- Edge Function `generate-recipe`: prompt dinámico por familia de formato — 10 familias definidas (`short_video`, `long_video`, `live`, `text_post`, `carousel`, `story`, `visual`, `newsletter`, `article`, `default`)
- `max_tokens` aumentado de 1000 a 1500
- `reuse_suggestions` eliminado del output; `strategic_note` preservado universalmente
- Query de plataforma actualizada para incluir `slug`

### Frontend
- Nuevo archivo `src/utils/formatFamily.ts` — mapeo plataforma+formato → familia
- Nuevo archivo `src/constants/aspectsByFamily.ts` — aspectos por familia con metadatos (`isList`, `requiresGoodRating`)
- Claves i18n nuevas en ES/EN: `retention`, `seo`, `argument`, `cta`, `engagement`
- `RecipePanel.tsx` — aspectos dinámicos según familia del formato activo
- `Ideas.tsx` — prop `platformSlug` pasada a `RecipePanel`

### Fix
- `me-subscription` — `is_free` ahora es `false` durante trial activo (fix gate de IA para early adopters)