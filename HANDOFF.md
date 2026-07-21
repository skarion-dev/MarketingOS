# MarketingOS — Builder Handoff

**Read this file first.** It contains everything a builder AI needs to execute
`docs/PLAN.md` without any other context.

## Repository

- **Repo:** https://github.com/skarion-dev/MarketingOS (public)
- **Docs:** `docs/GOALS.md` (product goals, source of truth) · `docs/PLAN.md` (100 build chunks).
  The earlier legacy B2B-CRM build was removed from the repo; migrations 0001–0020 were replaced
  by the workspace-scoped model in 0021+ (`research_runs`, `prompt_templates`, and `ai_keys`
  followed in 0039–0041).
- **Sister repos for conventions (read-only reference):**
  - https://github.com/skarion-dev/skarion-app — TalentOS. Copy its patterns: provider-agnostic AI
    layer (`AiProvider.send({system, messages, tools})`), repository/API-route structure, auth
    guard pattern, table components.
  - https://github.com/skarion-dev/SkarionCRM — bulk lead-list tooling (out of scope here).

## Mission in one paragraph

MarketingOS is Skarion's content planning, production, and publishing system: an Airtable-style
grid where the content plan lives as data, AI is integrated into the grid to generate drafts
(text + images + grounded research), every draft is mechanically linted against Skarion's
compliance rules, a human approves, and approved rows publish directly to connected social
accounts (LinkedIn, Facebook, Reddit, X, email) via a queue — with metrics syncing back.
SaaS-grade from day one: workspace tenancy, roles, audit log, encrypted secret vault,
per-workspace AI budgets, provider adapters everywhere, CI.

## Stack

Next.js 14 App Router · TypeScript · Supabase (Postgres + Auth + Storage) · Vercel ·
Google Vertex AI (Gemini 2.5 Pro/Flash + grounding, Imagen, embeddings) behind the
provider-agnostic `AiProvider` interface.

## Non-negotiable rules

1. **Nothing auto-sends or auto-posts.** All AI content starts `status: draft`; publish requires
   `status: approved` set by a human. Scheduling after approval is fine.
2. **Every table has `workspace_id` + RLS.** Every query is workspace-scoped.
3. **Secrets only in the vault.** OAuth tokens and AI keys are AES-256-GCM encrypted server-side.
   Never plaintext columns, never in logs, prompts, or client components.
4. **AI only through `AiProvider`.** No provider SDKs in route handlers. All calls metered to
   `ai_usage_log` with cost.
5. **Migrations are numbered, one per chunk, append-only** under `supabase/migrations/`.
6. **`npm run typecheck` every ~10 chunks.** Phase QA chunks (20/40/60/80/100) gate the next phase.

## Skarion content rules (seed data for channels, prompts, and the compliance linter)

Skarion = end-to-end career consultation, preparation, and placement-support firm for candidates
(mostly international students/recent grads on OPT/STEM OPT). Founder: Abdullah Al Saki.
Strongest niche: OSP fiber/telecom infrastructure careers. Revenue: success fee after placement.

**Voice (all content):** direct, warm, practical, human, short paragraphs, one clear question or
point, profile/topic-specific, no corporate slop, no exaggerated praise, no walls of text.

**Hard compliance rules (lint must catch violations):**
- Emails start "Hi [Name]," — never "Dear".
- Fee language: exactly "There is no upfront fee. We only charge you if you successfully land a
  role through Skarion's support." Never say "free". Never quote an exact fee amount.
- Never guarantee: a job, placement timing, salary, sponsorship, H-1B, green card, or any
  immigration outcome. Skarion is not an immigration law firm.
- Never invent: employer relationships, job openings, placement statistics, success stories.
- Never include https://www.skarion.com/book before the recipient has shown interest.
- Never mix "Skarion Engineering" (a separate B2B business) into candidate-facing content.
- Never describe Skarion as only a bootcamp / resume service / profile-marketing service /
  recruiter.

**Per-channel rules:**
- **LinkedIn:** short messages; personalize from the actual profile/topic; 1–2 questions max;
  no aggressive pitching; don't pretend to recruit for a specific opening.
- **Reddit:** help first, compact comments, address the poster's actual situation, disclose
  Skarion briefly and transparently, no links unless asked, no "DM me" repetition, no
  near-identical comments across threads.
- **Facebook groups:** useful before promotional; respect group rules; never imply a live job
  opening; disclose Skarion when relevant.
- **Email:** greeting → direct answer → accurate Skarion explanation → value → one next step →
  professional close. Answer fee questions directly.

**Content lifecycle:** `idea → draft → in_review → approved → scheduled → published`
(+ `rejected` from any pre-publish state). Transitions enforced server-side, audit-logged.

**Historical baselines to beat (reports compare against these):** 67 social posts → 5 calls ·
590 emails → 34 replies → 17 calls · 184 DMs → 14 replies → 4 calls.

## Environment variables

`SECRET_VAULT_KEY` · `GOOGLE_CLOUD_PROJECT_ID` · `GOOGLE_CLOUD_LOCATION` ·
`GOOGLE_APPLICATION_CREDENTIALS_JSON` · `VERTEX_TEXT_MODEL` · `VERTEX_IMAGE_MODEL` ·
`VERTEX_EMBED_MODEL` · `AI_PROVIDER` · `PUBLISH_DRY_RUN` · `X_PUBLISHING_ENABLED` ·
`TALENTOS_HANDOFF_ENABLED` · Supabase URL/keys · per-platform OAuth client IDs/secrets (Phase 4).

## Platform app approvals — START EARLY (Phase 2)

Each publishing adapter needs a real platform app; review takes days-to-weeks:
- **LinkedIn:** developer app + "Share on LinkedIn" product (w_member_social); company-page
  posting needs Community Management API access.
- **Meta:** app + App Review for pages_manage_posts (Facebook pages).
- **Reddit:** OAuth2 app; respect API terms + subreddit self-promotion rules.
- **X:** paid API tier required for posting — behind feature flag, off by default.
- **Email:** Resend or AWS SES sender verification.

## Working agreement

- Work chunks in order, one per coding task, from `docs/PLAN.md`. Commit per chunk or small
  cluster with the chunk number in the message (e.g., `p2c13: EditableGrid flagship component`).
- When a chunk's premise is wrong (missing table, changed convention), fix the smallest thing
  that unblocks it and note the deviation in the commit message.
- Do not redesign the plan mid-build; open an issue instead.
- Done = Phase 5 chunk 20 QA passes and `v1.0` is tagged.
