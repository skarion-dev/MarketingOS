# MarketingOS

Skarion's **content planning and production system** — an Airtable-style workspace where the
content plan *is* the database, and AI is integrated into the grid to generate the content.

Skarion provides end-to-end career consultation, preparation, and placement support to candidates
(mostly international students and recent grads on OPT/STEM OPT). Growth depends on a steady
stream of candidate-facing content — founder-led LinkedIn posts, OPT/OSP education, Reddit and
Facebook presence, email sequences. MarketingOS runs that engine:

**Ideas → content plan (grid) → AI-generated drafts → human review → ready-to-publish → performance feedback**

## Goals

See [docs/GOALS.md](docs/GOALS.md). In short:

1. **Airtable-grade content grid** — calendar, idea backlog, campaigns, channels, assets;
   inline editing, saved views, grid/calendar/kanban
2. **AI inside the rows** — draft from an idea, rewrite any cell, bulk idea→draft generation,
   images via Imagen, grounded research via Gemini
3. **Compliance-first generation** — every draft mechanically linted against the Skarion Master
   AI Context (voice, fee language, no-guarantee rules, channel rules) before human review
4. **Human-in-the-loop publishing** — nothing auto-publishes; explicit idea→draft→review→
   approved→published lifecycle with audit trail
5. **Performance loop** — published content tracked back into the plan; beat the historical
   baselines (590 emails → 17 calls; 184 DMs → 4 calls; 67 posts → 5 calls)
6. **Light funnel bridge** — content touches can create leads and tasks; signed agreements hand
   off to TalentOS. Not a CRM, not a list tool (that's TalentOS / SkarionCRM)

## Stack

Next.js 14 App Router + TypeScript + Supabase (Postgres/Auth) + Vercel, extending skarion-app
conventions. Provider-agnostic AI layer (`AiProvider.send()`) with a Google Vertex slot
(Gemini for text + grounding, Imagen for visuals).

Stack conventions:

- AI calls go through the `AiProvider` interface, never provider SDKs in route handlers
- Every AI-generated content record starts as `status: draft` — nothing auto-sends
- Migrations live under `supabase/migrations/`, one file per chunk
- Run `npm run typecheck` after every ~10 build chunks

## Docs

- [docs/GOALS.md](docs/GOALS.md) — product goals (source of truth)
- [docs/LEGACY_PLAN.md](docs/LEGACY_PLAN.md) — original 4-phase / 120-chunk build plan,
  kept as technical scaffold; chunks are being re-cut against GOALS.md
