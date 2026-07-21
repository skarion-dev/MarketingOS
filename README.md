# MarketingOS

Skarion's **content planning, production, and publishing system** — an Airtable-style workspace
where the content plan *is* the database, AI is integrated into the grid to generate the content,
and approved rows publish directly to every social channel from inside the app. Built SaaS-grade
from day one.

Skarion provides end-to-end career consultation, preparation, and placement support to candidates
(mostly international students and recent grads on OPT/STEM OPT). Growth depends on a steady
stream of candidate-facing content — founder-led LinkedIn posts, OPT/OSP education, Reddit and
Facebook presence, email sequences. MarketingOS runs that whole chain:

**Ideas → content plan (grid) → AI drafts → human review → one-click publish/schedule → metrics sync back → plan learns**

## Goals

See [docs/GOALS.md](docs/GOALS.md). In short:

1. **Airtable-grade content grid** — calendar, idea backlog, campaigns, channels, assets;
   inline editing, saved views, grid/calendar/kanban, CSV
2. **AI inside the rows** — draft from an idea, rewrite any cell, bulk idea→draft generation,
   Imagen assets, Gemini grounded research with citations
3. **Compliance-first generation** — every draft mechanically linted against the Skarion Master
   AI Context (voice, fee language, no-guarantee rules, channel rules) before human review
4. **Human-approved, one-click direct publishing** — OAuth-connected LinkedIn, Facebook, Reddit,
   X, and email accounts; publish queue with scheduling, retry, published-URL capture. Nothing
   auto-posts without approval.
5. **Performance loop** — engagement metrics sync back onto content rows; beat the historical
   baselines (67 posts → 5 calls; 590 emails → 17 calls; 184 DMs → 4 calls)
6. **Light funnel bridge** — content touches create leads; warm replies raise tasks; signed
   agreements hand off to TalentOS. Not a CRM, not a list tool.
7. **SaaS-grade** — workspace (tenant) model with RLS everywhere, roles, audit log, encrypted
   secret vault, per-workspace AI budgets, versioned prompt library, provider adapters, CI.

## Stack

Next.js 14 App Router + TypeScript + Supabase (Postgres/Auth/Storage) + Vercel, extending
skarion-app conventions. Provider-agnostic AI layer (`AiProvider.send()`) with a Google Vertex
slot (Gemini text + grounding, Imagen visuals, embeddings). Publisher adapters per social
platform behind a `SocialPublisher` interface.

Stack conventions:

- AI calls go through the `AiProvider` interface, never provider SDKs in route handlers
- Every table carries `workspace_id`; every query is workspace-scoped; RLS on everything
- Every AI-generated content record starts as `status: draft` — nothing auto-sends or auto-posts
- OAuth tokens and AI keys live in an encrypted secret vault, never plaintext columns
- Migrations live under `supabase/migrations/`, numbered, one file per chunk
- Run `npm run typecheck` after every ~10 build chunks

## Docs

- [HANDOFF.md](HANDOFF.md) — **start here**: everything a builder AI needs to execute the plan
- [docs/GOALS.md](docs/GOALS.md) — product goals (source of truth)
- [docs/PLAN.md](docs/PLAN.md) — 5-phase / 100-chunk build plan, one chunk per coding task
- [docs/LEGACY_PLAN.md](docs/LEGACY_PLAN.md) — original 4-phase plan, kept for reference
- docs/PUBLISHING.md + docs/INTEGRATIONS.md — created in Phases 4–5
