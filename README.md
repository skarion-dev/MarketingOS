# MarketingOS

Skarion's **candidate-acquisition engine** — everything between a name on a lead list and a
signed candidate agreement in TalentOS.

Skarion provides end-to-end career consultation, preparation, and placement support to candidates
(mostly international students and recent grads on OPT/STEM OPT). Revenue arrives only after a
successful placement. MarketingOS owns the front of that funnel:

**Outreach → conversation → qualification → booked consultation call → signed agreement → TalentOS handoff**

## Goals

See [docs/GOALS.md](docs/GOALS.md). In short:

1. **Book qualified consultation calls** — the north-star metric
2. **Compliance-first AI content** — every draft is mechanically linted against the Skarion
   Master AI Context (voice, fee language, no-guarantee rules, channel rules)
3. **Personalization at scale** — grounded in each prospect's real background, no robotic copy
4. **Lead scoring & warm-signal detection** — fit/timing/authorization scoring, auto-raise on
   warm replies (fee questions, booking-link requests, openness to adjacent roles)
5. **Attribution** — channel → campaign → message → call → agreement, with AI spend caps
6. **Human-in-the-loop** — AI drafts and suggests; humans approve, send, and talk to candidates

## Stack

Next.js 14 App Router + TypeScript + Supabase (Postgres/Auth) + Vercel, extending skarion-app
conventions. Provider-agnostic AI layer (`AiProvider.send()`) with a Google Vertex slot
(Gemini for text + grounding, Imagen for creative).

Stack conventions:

- AI calls go through the `AiProvider` interface, never provider SDKs in route handlers
- Every AI-generated content record starts as `status: draft` — nothing auto-sends
- Migrations live under `supabase/migrations/`, one file per chunk
- Run `npm run typecheck` after every ~10 build chunks

## Docs

- [docs/GOALS.md](docs/GOALS.md) — redefined product goals (source of truth)
- [docs/LEGACY_PLAN.md](docs/LEGACY_PLAN.md) — original 4-phase / 120-chunk build plan,
  kept as the technical scaffold; build chunks are being re-cut against GOALS.md
