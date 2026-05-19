# Content Intelligence Platform — Frontend

React + TypeScript application for content creators to systematize their ideas and scale their content strategy.

> The backend repository is private. Available for review upon request.

---

## Product

Content Intelligence helps creators understand how their ideas evolve into scalable content systems. Unlike traditional social media tools focused on scheduling and analytics, this platform focuses on the creative process: how ideas are generated, how they transform into content, and what patterns enable strategy at scale.

**Core loop:** Ideas → Content → Patterns → Insights → Strategy → New ideas

**Central hypothesis:** Creators grow faster when they systematize their ideas, not just when they measure content performance.

---

## Key Features (MVP)

- **Idea library** — capture and organize creative ideas
- **Content registry** — log published content and link it back to its source idea
- **Content DNA** — AI-powered pattern analysis across topics, formats, platforms and roles
- **Smart Insights** — publishing rhythm, platform distribution, idea reuse signals
- **Creative Recipe** — AI-generated content brief from a single idea
- **Creative Report** — deep narrative analysis of the creator's creative identity
- **Idea Generator** — new idea suggestions based on the creator's own patterns

---

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Modular SCSS with CSS custom properties design system
- `react-i18next` — full EN/ES bilingual support
- `recharts` — data visualizations (AreaChart, BarChart, PieChart, RadarChart)
- `lucide-react` — iconography

### Backend *(private repo)*
- Supabase Edge Functions (Deno/TypeScript)
- PostgreSQL via Supabase with Row Level Security
- Anthropic Claude API (`claude-sonnet-4-5`) — AI orchestration layer
- Google Sheets API — survey data integration

### Infrastructure
- Supabase — auth, database, edge functions, storage
- Vercel — frontend deployment
- Multi-tenant architecture with tenant-scoped RLS policies

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│         (this repo — public portfolio)           │
└─────────────────┬───────────────────────────────┘
                  │ REST / Supabase client
┌─────────────────▼───────────────────────────────┐
│              Supabase Edge Functions             │
│           (private repo — business logic)        │
│                                                  │
│  generate-recipe   · content-dna                 │
│  generate-ideas    · me-identity-insights        │
│  me-creative-report· regenerate-aspect           │
└─────────────────┬───────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼──────┐     ┌────────▼────────┐
│  PostgreSQL  │     │  Anthropic API  │
│  (Supabase)  │     │  Claude Sonnet  │
└─────────────┘     └─────────────────┘
```

---

## Admin Panel

Internal dashboard for product analytics and early adopter management:

- **Operations** — user activity, platform distribution, content stats
- **Ecosystem** — idea-to-content conversion, DNA health metrics, download tracking
- **Waitlist Intelligence** — early access registrations, growth chart, language distribution
- **Survey** — analysis of 29 creator survey responses: pain points, behaviors, feature validation

---

## Design System

Token-based design system with runtime theming:

- CSS custom properties for all colors, spacing, typography and radii
- 4 primary palettes × 6 accent palettes × 4 neutral sets
- Extended pastel palette derived via `color-mix()` from base tokens
- 3 character modes: editorial, bold, crafted
- Light / dark mode
- Density: compact, comfortable, spacious
- All combinations hot-swappable without page reload via a tweaks panel

---

## Status

Currently in **private early access** — 29 creators on the waitlist, first batch invited.

---

## Contact

Built by [Andrés Ruedalibre](https://github.com/ruedalibre)  
Backend repo available for review upon request.