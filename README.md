# 🚀 Content Manager App

**Analytics & Content Intelligence SaaS for Digital Creators**

Content Manager is a full-stack SaaS platform designed to help creators, marketers and digital teams manage, analyze and optimize their content production across multiple platforms.

It combines content inventory, analytics and reusable intelligence in a single dashboard.

---

## 🧠 Core Value Proposition

“Know what you create, where you publish, and what to reuse next.”

The platform transforms raw content logs into:

• Platform distribution analytics  
• Growth timelines  
• Reusable content detection  
• Activity heatmaps  
• AI-like insights  
• Performance indicators  

---

## 🏗️ Tech Stack

### Frontend
React + Vite  
TypeScript  
SCSS  
Recharts (analytics visualization)  
Responsive SaaS layout  

### Backend
Supabase (PostgreSQL)  
Edge Functions (Deno)  
Row Level Security (RLS)  
SQL Views for analytics  
JWT Authentication  

### Infra & Tooling
GitHub versioning  
Environment secrets  
SaaS version endpoint  
Health monitoring endpoint  

---

## 📊 Analytics Engine

### KPI Dashboard
• Total contents  
• Platforms used  
• Reusable contents  
• Growth rate %  
• Last activity  

### Charts Implemented
• Contents by platform  
• Monthly growth timeline  
• Cumulative growth  
• Growth rate analysis  
• Activity heatmap  

### Insights Layer
Automatic insights such as:

• Most used platform  
• Growth trends  
• Reusable opportunities  
• Content gaps  

---

## 🧱 Backend Architecture

Edge Functions currently implemented:
• me-dashboard
• me-contents
• me-contents-history
• me-contents-by-platform
• me-contents-reusable

• admin-users-summary
• admin-platform-usage
• admin-content-growth
• admin-content-growth-cumulative
• admin-content-growth-rate

• me-insights
• me-activity-heatmap

• version
• health

---

## 🗄️ Database Model (Simplified)

### contents
id  
user_id  
platform_id  
title  
description  
format  
status  
location  
is_reusable  
created_at  
updated_at  
published_at  

### platforms
Platform catalog for analytics distribution.

### users
Authenticated creators.

### tags *(future layer)*
Content classification & semantic reuse.

---

## 📈 Product Roadmap

### Phase 1 — MVP (Current)
Content registry  
Analytics dashboard  
Growth engine  
Heatmap  
Insights endpoint  

### Phase 2 — Intelligence
AI recommendations  
Content scoring  
Cross-platform optimization  

### Phase 3 — SaaS Scale
Teams & roles  
Billing  
API integrations  
Export reports  

---

## 🖥️ Local Development

### Clone repository
git clone https://github.com/ruedalibre/content-manager-frontend.git
git clone https://github.com/ruedalibre/content-manager-backend.git


### Install dependencies

### Environment variables

Create a .env file:

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key

# Only for local testing
VITE_ACCESS_TOKEN=your_dev_session_token

Note: Access tokens are only used for local development testing.
In production they are generated via Supabase Auth login flow.


### Run development server

---

## 🔐 Authentication Model

JWT via Supabase Auth  
Row Level Security enforced  
User-scoped analytics  
Protected admin endpoints  

---

## 📦 Versioning

Semantic versioning structure:
0.5.0 → Current MVP analytics build

Version is exposed via the version endpoint and displayed in the SaaS footer.

---

## 🧪 Health Monitoring

Infrastructure and backend status available via health endpoint.

Used for uptime monitoring and diagnostics.

---

## 💡 Use Cases

Content creators  
Agencies  
Social media managers  
Creator economy professionals  
Personal brands  
Marketing teams  

---

## 🧑‍💻 Author

Andrés Pérez Díaz  

Full-stack developer focused on:

SaaS platforms  
Analytics systems  
Creator economy tools  
Supabase architectures  

GitHub  
[https://github.com/ruedalibre](https://github.com/ruedalibre)

LinkedIn  
[https://linkedin/in/andres-perez-develop](https://www.linkedin.com/in/andres-perez-develop/)

---

##License

This repository is shared for portfolio and investor review purposes only.

All rights reserved © 2026 Andrés Pérez Díaz.

No part of this codebase may be copied, reproduced, distributed, or used to build competing products without explicit written permission.


---

## ⭐ Future Vision

Content Manager aims to become:

The operating system for creator content analytics.

From simple tracking → to predictive intelligence.

---
