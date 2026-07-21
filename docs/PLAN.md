# MarketingOS — Build Plan (100 chunks)

5 phases × 20 chunks. Each chunk is one self-contained coding task: one file or one tight
cluster of files, one acceptance check. Order matters within a phase — migrations before
repositories, repositories before API routes, API routes before UI. Cross-phase dependencies
only run forward (Phase 3 needs Phase 1's provider + Phase 2's tables/UI; Phase 4 needs
Phase 3's approved-content gate).

Read `HANDOFF.md` first. Product goals: `docs/GOALS.md`. This file supersedes the earlier
B2B-CRM plan; that legacy build (generic CRM tables, prospects/opportunities UI) was removed
from the repo.

Global rules (apply to every chunk):
- All AI calls go through the `AiProvider` interface — never provider SDKs in route handlers.
- Every table carries `workspace_id`; every query is workspace-scoped; RLS on every table.
- Every AI-generated content record starts as `status: draft`. Nothing auto-sends or auto-posts.
- OAuth tokens and AI keys live only in the encrypted secret vault — never plaintext columns,
  never in prompts, logs, or client components.
- Migrations live in `supabase/migrations/`, numbered, one file per chunk, append-only.
- Run `npm run typecheck` after every ~10 chunks; manual smoke test after every phase-QA chunk.

---

## Phase 1 — SaaS Core + AI Foundation (20 chunks)

*Workspace/tenant model, roles, audit, secret vault, settings, Vertex AI provider, cost metering.*

1. Scaffold the app in this repo: Next.js 14 App Router + TypeScript + Supabase (`@supabase/supabase-js`), following skarion-app conventions. Acceptance: `npm run dev` boots, `npm run typecheck` passes.
2. Migration `0001_workspaces.sql` — `workspaces` (id, name, slug, plan, created_at) + RLS. Acceptance: table + policy applied via Supabase.
3. Migration `0002_workspace_members.sql` — `workspace_members` (workspace_id fk, user_id fk, role enum owner/admin/editor/viewer) + RLS.
4. `src/server/middleware/workspaceAuth.ts` + `requireRole.ts` — resolve user + workspace from request, enforce membership and role; 403 otherwise. Acceptance: a test route returns 403 for non-member.
5. `scripts/seed-workspace.mjs` — create the "Skarion" workspace + founding members. Acceptance: script runs idempotently.
6. Migration `0003_audit_log.sql` + `src/server/services/audit.ts` — `audit_log` (workspace_id, actor, action, entity, entity_id, before/after jsonb) + `logAudit()` helper used by all future mutation services.
7. Migration `0004_workspace_secrets.sql` — `workspace_secrets` (workspace_id, kind, label, ciphertext) — no plaintext column; RLS admin-only.
8. `src/lib/crypto/secretVault.ts` — AES-256-GCM encrypt/decrypt keyed by server-only `SECRET_VAULT_KEY` env; add to `.env.example`. Acceptance: round-trip unit test.
9. `src/server/repositories/secretRepository.ts` — server-side-only store/retrieve; no decrypt path exported to client code. Acceptance: grep shows no client import.
10. Migration `0005_workspace_settings.sql` + `src/server/repositories/settingsRepository.ts` + `src/app/api/workspaces/[id]/settings/route.ts` — key/value settings per workspace, admin-only writes, audit-logged. Seed keys: `fee_language_fallback`, `posting_cadence`, `mentionable_employers` (empty), `followup_cadence`.
11. `src/app/settings/workspace/page.tsx` + `src/app/api/workspaces/[id]/members/route.ts` — workspace profile, member list, invite/role/remove (owner/admin only). Acceptance: role change appears in audit_log.
12. Vertex env vars in `.env.example` (`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `VERTEX_TEXT_MODEL`, `VERTEX_IMAGE_MODEL`, `VERTEX_EMBED_MODEL`) + add `google-auth-library`; `src/lib/ai/vertexAuth.ts` — service-account JSON → short-lived OAuth token.
13. `src/lib/ai/vertexProvider.ts` — `AiProvider.send()` against Gemini generateContent REST; export Gemini 2.5 Pro factory + Gemini 2.5 Flash factory; optional `grounding: boolean` send option toggling Google Search grounding.
14. `src/lib/ai/vertexImageProvider.ts` (`generateImage(prompt) → {base64}` via Imagen) + `src/lib/ai/vertexEmbeddingProvider.ts` (text-embedding wrapper).
15. `case "google":` in `buildProviderFromDbKey()` building the Vertex provider from vault-stored service-account JSON; `AI_PROVIDER=google` explicit selection in `getActiveProvider()`.
16. `src/app/ops/components/ai-key-manager.tsx` — google provider accepts multi-line JSON paste, stored via secret vault; `/api/admin/ai-keys/[id]/test/route.ts` routes google tests through the adapter.
17. `scripts/test-vertex-provider.mjs` — smoke: one prompt in, response + token counts out. Acceptance: runs against real Vertex key.
18. Migration `0006_ai_usage_log.sql` — `ai_usage_log` (workspace_id, user_id, provider, model, kind, prompt_tokens, completion_tokens, cost_cents, entity refs nullable, created_at) + RLS.
19. `src/lib/ai/costEstimator.ts` (per-model cost table + calculator, unit-tested) + `src/lib/ai/meteredProvider.ts` (wraps every provider send(), logs usage + cost, includes retry-with-backoff on 429/5xx, max 3, jitter).
20. **Phase 1 QA**: workspace → member → Vertex key in vault → one metered Pro + one Flash call → rows in `ai_usage_log`, trail in `audit_log`. Fix everything before Phase 2.

---

## Phase 2 — Data Model + Airtable Grid (20 chunks)

*Content is the star table; EditableGrid is the flagship UI; saved views, calendar, kanban, CSV.*

1. Migration `0007_channels.sql` — `channels` (workspace_id, kind enum linkedin_personal/linkedin_page/facebook/reddit/x/email/blog, name, rules jsonb, cadence jsonb, active) + RLS. Seed channel rules from `HANDOFF.md` §Skarion content rules.
2. Migration `0008_campaigns.sql` — `campaigns` (workspace_id, name, theme, goal, start/end, status, ai_budget_cents) + RLS.
3. Migration `0009_content.sql` — **star table** `content` (workspace_id, campaign fk nullable, channel fk, kind enum post/dm/email/comment/article, status enum idea/draft/in_review/approved/scheduled/published/rejected, title, hook, body, cta, persona, planned_at, published_url, external_id, lint_result jsonb, metrics jsonb, owner_id, created_by, timestamps) + RLS + indexes on (workspace_id,status), (workspace_id,planned_at).
4. Migrations `0010_ideas.sql` + `0011_assets.sql` — `ideas` (title, angle, source, persona, priority, status new/accepted/used/archived, converted_content_id) and `assets` (content fk, kind image/carousel/doc, storage_path, prompt) + RLS; Supabase Storage bucket `marketing-assets`.
5. Migration `0012_saved_views.sql` — `saved_views` (workspace_id, user_id, entity, name, config jsonb: filters/sort/group/view-type) + RLS.
6. `src/server/repositories/marketing/channelRepository.ts` + `campaignRepository.ts` — workspace-scoped CRUD.
7. `src/server/repositories/marketing/contentRepository.ts` — CRUD + filtered list (status/channel/campaign/date-range/owner) + `updateStatus()` with lifecycle enforcement + audit hook.
8. `src/server/repositories/marketing/ideaRepository.ts` (incl. `convertToContent()`) + `assetRepository.ts` + `savedViewRepository.ts`.
9. API routes: `/api/marketing/channels` + `/api/marketing/campaigns` (GET/POST + PATCH/DELETE), role-gated, audit-logged.
10. API routes: `/api/marketing/content` + `[id]` (list supports filter/sort/group params) + `[id]/status` (valid transitions only: idea→draft→in_review→approved→scheduled/published, rejected from any pre-publish state).
11. API routes: `/api/marketing/ideas` (+`[id]`, `[id]/convert`), `/api/marketing/assets` (signed upload URLs), `/api/marketing/views` (+`[id]`).
12. `src/app/marketing/layout.tsx` — nav shell (Plan / Ideas / Publish / Reports / Settings) with workspace guard.
13. `src/app/marketing/components/EditableGrid.tsx` — **flagship**: virtualized table, inline cell editing (text/select/date/user/status), sort/filter/group, row selection, optimistic PATCH. Reuse skarion-app table primitives; do not add AG Grid.
14. `src/app/marketing/plan/page.tsx` + `SavedViewsBar.tsx` — content grid with save/apply/delete views and grid/kanban/calendar view switch.
15. `src/app/marketing/plan/kanban.tsx` + `calendar.tsx` — kanban by status (drag calls status endpoint, lifecycle enforced) and month calendar by `planned_at` (drag reschedules).
16. `src/app/marketing/content/[id]/page.tsx` — content detail: all fields editable, lint panel slot, assets, status actions, audit history.
17. `src/app/marketing/ideas/page.tsx` — idea backlog grid, priority sort, "convert to content" row action.
18. `src/app/api/marketing/import/route.ts` — CSV import (papaparse) into ideas/content with column mapping + dry-run preview.
19. `src/app/api/marketing/export/route.ts` — CSV export respecting current grid filters.
20. **Phase 2 QA**: seed campaign + 20 rows → inline edit, group, kanban-drag, calendar-drag, CSV round-trip, saved views. Fix everything before Phase 3.

---

## Phase 3 — AI Production Line (20 chunks)

*Prompt library from Skarion rules, row-level + bulk generation, compliance lint, images, research.*

1. Migration `0013_prompt_templates.sql` — `prompt_templates` (workspace_id, kind, name, version, body, status draft/approved, created_by) + RLS; seed the Skarion system prompt + style guide + per-channel rule templates from `HANDOFF.md`.
2. `src/server/repositories/marketing/promptTemplateRepository.ts` — CRUD + `getActive(kind)` (latest approved version).
3. `src/app/marketing/settings/prompts/page.tsx` — template editor, version list, approve action (same lifecycle as content).
4. `src/lib/marketing/compliance/rules.ts` + `lint.ts` — **compliance lint engine** (pure functions): prohibited phrases (guarantee/sponsorship/"free"/exact fees/"Dear"), booking-link-before-interest, Skarion-Engineering bleed, per-kind required language. `lintContent(draft) → {pass, violations[{ruleId, message}]}`. Unit-tested against the examples in `HANDOFF.md`.
5. `src/lib/marketing/personalize.ts` — per-row context block (campaign theme, channel rules, persona, idea angle) for generation prompts.
6. `src/lib/marketing/generate.ts` — generation service: active template + channel rules + row context → Flash draft → lint → persist (status draft, lint_result attached) via metered provider.
7. `src/app/api/marketing/content/generate/route.ts` — `POST {ideaId?|contentId, channelId, kind}`; editor role+, budget check first.
8. `src/app/api/marketing/content/[id]/regenerate/route.ts` — regenerate with reviewer feedback text; new lint pass.
9. `src/lib/marketing/cellActions.ts` + `/api/marketing/content/[id]/cell-action/route.ts` — `rewrite`/`shorten`/`expand`/`variants(n)` on hook/body/cta; returns candidate text, user confirms before save.
10. Grid integration: "✨ Generate draft" row action on ideas; cell-hover AI actions on hook/body cells in EditableGrid.
11. `src/app/api/marketing/content/bulk-generate/route.ts` — N idea rows → N drafts, chunked max 10/call, per-campaign budget enforced, partial-failure report.
12. `src/lib/marketing/budget.ts` — check `campaigns.ai_budget_cents` vs `ai_usage_log` before any generation; hard stop with clear error.
13. Content detail lint panel — violations with rule citations; "override with reason" (admin only, audit-logged); approve blocked while un-overridden violations exist.
14. `src/app/api/marketing/content/[id]/generate-image/route.ts` + `ImagePreview.tsx` — Imagen brief → asset row + Storage upload (metered); regenerate variant action.
15. `src/lib/marketing/prompts/research.ts` + `src/app/api/marketing/research/route.ts` — grounded research templates (topic brief, fact-check, persona pain-points) via Pro + `grounding: true`; citations extracted.
16. Migration `0014_research_runs.sql` + `src/app/marketing/research/page.tsx` + `[id]/page.tsx` — every research call persisted; history list, result detail with cited sources, "convert brief → idea" action.
17. `src/lib/marketing/similarity.ts` — embedding near-duplicate check on content bodies; wired into generate service as a warning-level lint (never ship 500 near-identical lines).
18. `/api/marketing/content/[id]/suggest-meta/route.ts` (Flash suggests channel/persona/best-time, fills fields on confirm) + `src/app/marketing/content/new/page.tsx` (manual + AI-assisted create form).
19. Channel-switch regeneration (regenerating for a different channel loads that channel's rules) + error/loading/retry states across all generation UI — real error messages, no silent 500s.
20. **Phase 3 QA**: seed 10 real Skarion ideas → bulk generate → human review pass → record lint pass-rate baseline; confirm every AI call in `ai_usage_log` with cost. Fix before Phase 4.

---

## Phase 4 — Direct Publishing (20 chunks)

*OAuth-connected accounts, per-channel publisher adapters, publish queue with scheduling/retry, metrics sync.*

1. Migration `0015_channel_connections.sql` — `channel_connections` (workspace_id, channel fk, provider, external_account_id, account_label, secret fk → vault, scopes, status, last_health_check) + RLS admin.
2. `src/lib/publish/publisher.ts` — `SocialPublisher` interface: `publish(content) → {externalId, url}`, `fetchMetrics(externalId)`, `healthCheck()`, optional `deletePost()`. Registry by provider.
3. `src/lib/publish/format.ts` — per-channel formatter (length limits, hashtags, link rules, markdown stripping); unit-tested per channel.
4. LinkedIn OAuth flow — `/api/marketing/connect/linkedin/start` + `/callback`, tokens into vault (w_member_social).
5. `src/lib/publish/linkedin.ts` — Posts API adapter (personal profile) + health check + metrics where the API allows.
6. Meta OAuth flow — connect start/callback + page selection; long-lived token into vault.
7. `src/lib/publish/facebook.ts` — Graph API page-post adapter + health check.
8. Reddit OAuth2 flow (user consent) — refresh token into vault.
9. `src/lib/publish/reddit.ts` — submit adapter; Master Context Reddit rules enforced at formatter level (no links unless flagged, compact body); rate-limit aware.
10. X OAuth2 PKCE + `src/lib/publish/x.ts` behind feature flag `X_PUBLISHING_ENABLED` (paid tier; off by default) + `src/lib/publish/email.ts` behind an `EmailSender` interface with one concrete provider (Resend or SES, env-selected).
11. `src/app/marketing/settings/connections/page.tsx` — connect/disconnect per channel with status + last health check.
12. `/api/marketing/connections/[id]/health/route.ts` + `/api/cron/connection-health` (daily) — health checks update connection status.
13. Migration `0016_publish_queue.sql` — `publish_queue` (workspace_id, content fk, connection fk, scheduled_at, status queued/publishing/published/failed/cancelled, attempts, last_error, published_url, external_id) + RLS.
14. `src/server/services/publishService.ts` — enqueue (approved content only — hard gate); worker: dequeue due → format → adapter.publish → update queue + content row (published_url, external_id) → audit log.
15. `/api/cron/publish-worker/route.ts` — Vercel cron every 5 min, batch 10, retry-with-backoff (max 3 → failed + notify); register in `vercel.json`.
16. Content detail "Publish" panel — pick connection, now-or-schedule picker, enqueue (blocked unless status approved).
17. `src/app/marketing/publish/page.tsx` — queue board: upcoming, recent publishes, failed with error + retry/cancel.
18. Migration `0017_metric_snapshots.sql` + `/api/cron/metrics-sync` (daily) — for published content <30 days old, adapter.fetchMetrics → snapshot + rollup onto `content.metrics`; register in `vercel.json`.
19. `src/lib/publish/rateLimit.ts` (per-connection token bucket, persisted in a table) + `PUBLISH_DRY_RUN=true` env mode (logs instead of posting) + publish-failure notifications (bell badge).
20. `docs/PUBLISHING.md` (per-platform app setup, scopes, the no-auto-post guarantee) + formatter/service/queue tests + **Phase 4 QA**: connect one real account → approve → schedule → worker publishes → URL + metrics sync back.

---

## Phase 5 — Performance Loop, Funnel Bridge, Hardening (20 chunks)

1. Migration `0018_touchpoints.sql` + instrumentation — publish and inbound-reply events write touchpoint rows for attribution.
2. `src/lib/marketing/attribution.ts` — first-touch/last-touch attribution from touchpoints to booked-call/agreement events.
3. Migration `0019_leads.sql` — light `leads` (workspace_id, name, linkedin_url, email, degree, school, authorization, source_content fk nullable, status, temperature, owner_id, notes) + RLS.
4. `/api/marketing/leads` routes (+`[id]`) — lead creation from a content touch.
5. `src/lib/marketing/warmSignals.ts` + `/api/marketing/leads/[id]/signal-scan/route.ts` — Flash classification of pasted replies for warm signals (fee question, booking-link request, how-it-works) → auto-raise temperature + create task; human-confirmed.
6. `src/app/marketing/leads/page.tsx` — lead grid (reuses EditableGrid) with temperature + source-content columns.
7. Migration `0020_tasks.sql` + `src/app/marketing/tasks/page.tsx` — tasks (lead/content fk nullable, kind, due_at, assignee, status).
8. `/api/cron/followups` (daily) — stale leads/conversations → follow-up tasks; register in `vercel.json`.
9. `src/lib/integrations/talentos.ts` — on lead status `agreement_signed`, POST the CRM field set to the TalentOS candidate-intake endpoint (find the real endpoint in skarion-app first; feature-flagged `TALENTOS_HANDOFF_ENABLED`).
10. `docs/INTEGRATIONS.md` — SkarionCRM (import clean lists) + TalentOS (handoff contract) boundaries and payloads.
11. `src/app/marketing/reports/page.tsx` + channel-performance report — posts/replies/calls per channel vs historical baselines (67→5, 590→17, 184→4).
12. Attribution report + AI-usage report (spend by user/campaign/model/day; cost per published piece).
13. `src/lib/marketing/budgetAlerts.ts` (cron warns at 80% of campaign budget) + content scorecard page (metrics rollup; winning-angle flags feed the ideas backlog).
14. Role-scoping pass — every `/api/marketing/*` route verified to enforce workspace + role middleware.
15. Security + performance pass — RLS review on every table; vault never read client-side; no tokens in logs; indexes on hot paths.
16. Unified activity history on content/lead detail pages (from `audit_log`) + outbound `marketing_webhooks` (`content.published`, `lead.warm`, `budget.warning`) with signing secret.
17. Feature flags — `src/lib/flags.ts` + per-workspace overrides in settings (X publishing, TalentOS handoff, dry-run publish).
18. Test suite completion — vitest for lib (compliance, cost, formatter, attribution), API smoke tests with mocked Supabase, one Playwright happy path (idea → draft → approve → queue in dry-run).
19. CI + error tracking — GitHub Action (install, typecheck, unit tests, build) required on PRs to main; Sentry (or equivalent) server+client with alerts on publish-worker failures.
20. **Final QA + v1.0** — onboarding wizard (new workspace → AI key → seed channel rules → connect first social account), per-workspace full data export, then full walkthrough: workspace → idea → bulk generate → lint → approve → schedule → publish (dry-run + one real) → metrics → attribution → cost report → TalentOS handoff (flagged). Fix everything; tag `v1.0`.

---

## How to work the chunks

- Feed one chunk at a time as a coding prompt (file path + acceptance check included).
- Keep order within a phase; never batch-check a whole phase at the end.
- `npm run typecheck` every ~10 chunks; run the phase-QA chunk (20/40/60/80/100) before moving on.
- Start the real platform app approvals (LinkedIn, Meta, Reddit, X) during Phase 2 — review time
  is the critical path for Phase 4. Setup steps land in `docs/PUBLISHING.md` (chunk 4.20).
