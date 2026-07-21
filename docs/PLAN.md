# MarketingOS — Build Plan (v2, re-cut against GOALS v4)

5 phases, ~150 chunks. Each chunk is one self-contained coding task: one file or one tight
cluster, one acceptance check. Order matters within a phase — migrations before repositories,
repositories before API routes, API routes before UI. Cross-phase dependencies only run forward.

Grounded in the `skarion-app` codebase: Next.js 14 App Router + TypeScript + Supabase
(Postgres/Auth) + Vercel, provider-agnostic AI layer (`src/lib/ai/provider.ts`) with a reserved
but unimplemented `google` slot.

Global rules (every chunk):
- All AI calls go through the `AiProvider` interface — never provider SDKs in route handlers.
- Every table carries `workspace_id`; every query is workspace-scoped; RLS on every table.
- Every AI-generated content record starts as `status: draft`. Nothing auto-sends or auto-posts.
- Migrations live in `supabase/migrations/`, numbered, one file per chunk, append-only.
- Run `npm run typecheck` after every ~10 chunks; manual smoke test after every ~15.

---

## Phase 1 — SaaS Core + AI Foundation (30 chunks)

*Workspace/tenant model, roles, audit, secret vault, settings, Vertex AI provider, cost metering.*

1. Migration `0001_workspaces.sql` — `workspaces` (id, name, slug, plan, created_at) + RLS.
2. Migration `0002_workspace_members.sql` — `workspace_members` (workspace_id fk, user_id fk, role enum owner/admin/editor/viewer) + RLS.
3. `src/server/middleware/workspaceAuth.ts` — resolve current user + workspace from request, enforce membership; 403 otherwise.
4. `src/server/middleware/requireRole.ts` — role-gate helper (owner/admin/editor/viewer) composed on top of workspaceAuth.
5. Seed script `scripts/seed-workspace.mjs` — create "Skarion" workspace + founding members.
6. Migration `0003_audit_log.sql` — `audit_log` (workspace_id, actor, action, entity, entity_id, before jsonb, after jsonb, created_at) + RLS.
7. `src/server/services/audit.ts` — `logAudit()` helper called from all future mutation services.
8. Migration `0004_workspace_secrets.sql` — `workspace_secrets` (workspace_id, kind, label, ciphertext, created_at); no plaintext column. RLS admin-only.
9. `src/lib/crypto/secretVault.ts` — AES-256-GCM encrypt/decrypt with a server-side master key env var (`SECRET_VAULT_KEY`); add to `.env.example`.
10. `src/server/repositories/secretRepository.ts` — store/retrieve decrypted secrets server-side only; never expose decrypt to client components.
11. Migration `0005_workspace_settings.sql` — `workspace_settings` (workspace_id, key, value jsonb) + RLS; seeds for Master Context §26 open items (fee language fallback, posting cadence, mentionable employers = empty).
12. `src/server/repositories/settingsRepository.ts` + `src/app/api/workspaces/[id]/settings/route.ts` (GET/PATCH, admin-only writes, audit-logged).
13. `src/app/settings/workspace/page.tsx` — workspace profile + member list + role management UI.
14. `src/app/api/workspaces/[id]/members/route.ts` — invite/update-role/remove member endpoints (owner/admin only, audit-logged).
15. Add Vertex env vars to `.env.example`: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `VERTEX_TEXT_MODEL`, `VERTEX_IMAGE_MODEL`, `VERTEX_EMBED_MODEL`.
16. Add `google-auth-library` dependency; `src/lib/ai/vertexAuth.ts` — service-account JSON → short-lived OAuth token.
17. `src/lib/ai/vertexProvider.ts` — `AiProvider.send()` against Gemini generateContent REST, Gemini 2.5 Pro factory.
18. Same file: Gemini 2.5 Flash factory (cheap/fast sibling), plus optional `grounding: boolean` send option enabling Google Search grounding.
19. `src/lib/ai/vertexImageProvider.ts` — `generateImage(prompt) → {base64}` via Imagen; own interface.
20. `src/lib/ai/vertexEmbeddingProvider.ts` — text-embedding wrapper for later similarity/search.
21. `case "google":` in `buildProviderFromDbKey()` (`src/server/services/aiProvider.ts`) — build Vertex provider from vault-stored service-account JSON.
22. `AI_PROVIDER=google` explicit selection in `getActiveProvider()/Async()` (`src/lib/ai/index.ts`).
23. `src/app/ops/components/ai-key-manager.tsx` — google provider accepts multi-line JSON; stored via secret vault, never plaintext.
24. `/api/admin/ai-keys/[id]/test/route.ts` — google-provider test path through the new adapter.
25. `scripts/test-vertex-provider.mjs` — smoke: one prompt in, response + token counts out.
26. Migration `0006_ai_usage_log.sql` — `ai_usage_log` (workspace_id, user_id, provider, model, kind, prompt_tokens, completion_tokens, cost_cents, entity refs nullable, created_at) + RLS.
27. `src/lib/ai/costEstimator.ts` — per-model cost-per-1K-token table + calculator; unit-tested.
28. `src/lib/ai/meteredProvider.ts` — wrapper that logs every send() to `ai_usage_log` with computed cost; apply to all providers.
29. `src/lib/ai/withRetry.ts` — retry-with-backoff wrapper (429/5xx, jitter, max 3) applied inside meteredProvider.
30. Smoke QA: create workspace → add member → store Vertex key in vault → send one metered Pro + one Flash call → confirm rows in `ai_usage_log` and one `audit_log` trail.

---

## Phase 2 — Data Model + Airtable Grid (30 chunks)

*Content is the star table; EditableGrid is the flagship UI; saved views, calendar, kanban, CSV.*

1. Migration `0007_channels.sql` — `channels` (workspace_id, kind enum linkedin_personal/linkedin_page/facebook/reddit/x/email/blog, name, rules jsonb, cadence jsonb, active) + RLS.
2. Seed `channels` from Master Context channel rules (LinkedIn short-DM rules, Reddit help-first rules, email "Hi [Name]," rule, Facebook group rules) as per-channel `rules` JSON.
3. Migration `0008_campaigns.sql` — `campaigns` (workspace_id, name, theme, goal, start/end, status, ai_budget_cents) + RLS.
4. Migration `0009_content.sql` — `content` (workspace_id, campaign fk nullable, channel fk, kind enum post/dm/email/comment/article, status enum idea/draft/in_review/approved/scheduled/published/rejected, title, hook, body, cta, persona, planned_at, published_url, external_id, lint_result jsonb, metrics jsonb, owner_id, created_by, timestamps) + RLS + indexes on (workspace_id,status), (workspace_id,planned_at).
5. Migration `0010_ideas.sql` — `ideas` (workspace_id, title, angle, source, persona, priority, status enum new/accepted/used/archived, converted_content_id nullable) + RLS.
6. Migration `0011_assets.sql` — `assets` (workspace_id, content fk nullable, kind enum image/carousel/doc, storage_path, prompt, created_by) + RLS; Supabase Storage bucket `marketing-assets` config.
7. Migration `0012_saved_views.sql` — `saved_views` (workspace_id, user_id, entity, name, config jsonb: filters/sort/group/view-type) + RLS.
8. `src/server/repositories/marketing/channelRepository.ts` — CRUD, workspace-scoped.
9. `src/server/repositories/marketing/campaignRepository.ts` — CRUD + budget read.
10. `src/server/repositories/marketing/contentRepository.ts` — CRUD + filtered list query (status/channel/campaign/date-range/owner) + `updateStatus()` with audit hook.
11. `src/server/repositories/marketing/ideaRepository.ts` — CRUD + `convertToContent()`.
12. `src/server/repositories/marketing/assetRepository.ts` + `savedViewRepository.ts`.
13. `src/app/api/marketing/channels/route.ts` + `[id]/route.ts` (role-gated, audit-logged).
14. `src/app/api/marketing/campaigns/route.ts` + `[id]/route.ts`.
15. `src/app/api/marketing/content/route.ts` + `[id]/route.ts` — list supports filter/sort/group query params used by the grid.
16. `src/app/api/marketing/content/[id]/status/route.ts` — status-transition endpoint enforcing the lifecycle (draft→in_review→approved→scheduled/published) + audit stamp; reject invalid transitions.
17. `src/app/api/marketing/ideas/route.ts` + `[id]/route.ts` + `[id]/convert/route.ts`.
18. `src/app/api/marketing/assets/route.ts` — upload/signed-URL for `marketing-assets` bucket.
19. `src/app/api/marketing/views/route.ts` + `[id]/route.ts` — saved views CRUD.
20. `src/app/marketing/layout.tsx` — nav shell (Plan / Ideas / Calendar / Assets / Publish / Reports / Settings), workspace guard.
21. `src/app/marketing/components/EditableGrid.tsx` — **flagship**: virtualized table, inline cell editing (text/select/date/user/status), sort/filter/group headers, row selection, optimistic PATCH. Reuse TalentOS table primitives where they exist; do not add AG Grid.
22. `src/app/marketing/plan/page.tsx` — content grid on EditableGrid with SavedViewsBar; grid/group-by-status views.
23. `src/app/marketing/components/SavedViewsBar.tsx` — save/apply/delete views; grid + kanban + calendar view-type switch.
24. `src/app/marketing/plan/kanban.tsx` — kanban by content status with drag → calls status endpoint (lifecycle rules enforced).
25. `src/app/marketing/plan/calendar.tsx` — month view by `planned_at`; drag to reschedule.
26. `src/app/marketing/content/[id]/page.tsx` — content detail: full field edit, lint result panel, assets, status actions, audit history.
27. `src/app/marketing/ideas/page.tsx` — idea backlog grid (priority sort) + "convert to content" row action.
28. `src/app/api/marketing/import/route.ts` — CSV import (papaparse) into ideas/content with column mapping; dry-run preview first.
29. `src/app/api/marketing/export/route.ts` — CSV export of any grid view (respects current filters).
30. Manual QA: seed a campaign + 20 rows → inline-edit, group, kanban-drag, calendar-drag, CSV round-trip, saved views — fix everything broken before Phase 3.

---

## Phase 3 — AI Production Line (30 chunks)

*Prompt library from the Master Context, row-level + bulk generation, compliance lint, images, research.*

1. Migration `0013_prompt_templates.sql` — `prompt_templates` (workspace_id, kind, name, version, body, status draft/approved, created_by) + RLS.
2. Seed templates: Skarion outreach system prompt (Master Context §25), per-channel rules from Phase 2 seeds, Abdullah style guide.
3. `src/server/repositories/marketing/promptTemplateRepository.ts` — CRUD + `getActive(kind)` returning latest approved version.
4. `src/app/marketing/settings/prompts/page.tsx` — template editor with version list + approve action (same lifecycle as content).
5. `src/lib/marketing/compliance/rules.ts` — **compliance lint engine**: prohibited-phrase checks (guarantee/sponsorship/"free"/exact fees/"Dear"), booking-link-before-interest, Skarion-Engineering bleed, required-language checks per kind. Pure function, unit-tested against Master Context examples.
6. `src/lib/marketing/compliance/lint.ts` — wraps rules into `lintContent(draft) → {pass, violations[]}`; every violation cites the rule ID.
7. `src/lib/marketing/personalize.ts` — builds per-row context block (campaign theme, channel rules, persona, idea angle) for generation prompts.
8. `src/lib/marketing/generate.ts` — generation service: load active template + channel rules + row context → Flash draft → lint → persist (status draft, lint_result attached) → metered cost.
9. `src/app/api/marketing/content/generate/route.ts` — `POST {ideaId?|contentId, channelId, kind}` → generate service. Editor role+. Budget check first.
10. `src/app/api/marketing/content/[id]/regenerate/route.ts` — regenerate with reviewer feedback text; stores feedback in prompt; new lint pass.
11. `src/lib/marketing/cellActions.ts` — cell-level AI ops: `rewrite`, `shorten`, `expand`, `variants(n)` on hook/body/cta fields.
12. `src/app/api/marketing/content/[id]/cell-action/route.ts` — apply a cell action, returns candidate text (user confirms before save).
13. Grid integration: row action "✨ Generate draft" on idea rows; cell hover actions on hook/body cells in EditableGrid.
14. `src/app/api/marketing/content/bulk-generate/route.ts` — N idea rows → N drafts; chunked (max 10/call), per-campaign AI budget enforced, partial-failure report.
15. Budget enforcement: `src/lib/marketing/budget.ts` — check `campaigns.ai_budget_cents` vs `ai_usage_log` before any generation; hard-stop with clear error.
16. Content detail page: lint panel shows violations with rule citations + "override with reason" (admin only, audit-logged); approve blocked while un-overridden violations exist.
17. `src/app/api/marketing/content/[id]/generate-image/route.ts` — Imagen brief → asset row + Storage upload; metered.
18. `src/app/marketing/content/[id]/components/ImagePreview.tsx` — asset gallery on content detail; regenerate variant action.
19. `src/lib/marketing/prompts/research.ts` — grounded research templates (topic brief, market fact-check, persona pain-points).
20. `src/app/api/marketing/research/route.ts` — `POST {subject, templateId}` → Pro + `grounding: true`; citations extracted.
21. Migration `0014_research_runs.sql` — `research_runs` (workspace_id, subject, template, result jsonb, citations jsonb, cost_cents) + RLS; every research call persisted.
22. `src/app/marketing/research/page.tsx` + `[id]/page.tsx` — request form, history, result detail with cited sources; "convert brief → idea" action.
23. `src/lib/marketing/similarity.ts` — embedding-based near-duplicate check on content bodies (never ship 500 near-identical lines); wired into generate service as a warning-level lint.
24. `src/app/api/marketing/content/[id]/suggest-meta/route.ts` — Flash suggests channel/persona/best-time from body text; fills structured fields on confirm.
25. `src/app/marketing/content/new/page.tsx` — manual + AI-assisted new content form (kind, channel, campaign, idea link).
26. Template-driven channel switching: regenerating for a different channel loads that channel's rules (e.g., LinkedIn → Reddit rewrite obeys help-first/no-link rules).
27. Error/loading/retry states across all generation UI; failures surface the metered-provider error verbatim (no silent 500s).
28. Tests: compliance rules unit tests (Master Context pass/fail examples), cost estimator tests, generate-service integration test with mocked provider.
29. Seed 10 real Skarion content ideas → bulk-generate → human review pass; record lint pass-rate baseline.
30. Manual QA: idea → draft → lint-fail → fix → approve loop; image attach; research → idea conversion; confirm every AI call in `ai_usage_log` with cost.

---

## Phase 4 — Direct Publishing (30 chunks)

*OAuth-connected accounts, per-channel publisher adapters, publish queue with scheduling/retry, metrics sync.*

1. Migration `0015_channel_connections.sql` — `channel_connections` (workspace_id, channel fk, provider, external_account_id, account_label, secret fk → vault (OAuth tokens), scopes, status, last_health_check) + RLS admin.
2. `src/lib/publish/publisher.ts` — `SocialPublisher` interface: `publish(content) → {externalId, url}`, `fetchMetrics(externalId)`, `healthCheck()`. Registry by provider.
3. `src/lib/publish/format.ts` — per-channel formatter: length limits, hashtag handling, link rules, markdown stripping; unit-tested.
4. LinkedIn OAuth flow: `/api/marketing/connect/linkedin/start` + `/callback` — store tokens in vault (w_member_social scope).
5. `src/lib/publish/linkedin.ts` — LinkedIn adapter: Posts API publish (personal profile), health check, metrics where API allows. Document app-approval requirements in `docs/PUBLISHING.md`.
6. Meta OAuth flow (Facebook pages): connect start/callback, page selection, long-lived token storage in vault.
7. `src/lib/publish/facebook.ts` — Graph API page-post adapter + health check.
8. Reddit OAuth flow (script-less OAuth2, user consent) — store refresh token in vault.
9. `src/lib/publish/reddit.ts` — submit adapter; enforce Master Context Reddit rules at formatter level (no links unless approved flag, compact body); rate-limit aware.
10. X OAuth2 PKCE flow + `src/lib/publish/x.ts` — post adapter behind feature flag `X_PUBLISHING_ENABLED` (paid API tier required; off by default).
11. `src/lib/publish/email.ts` — email adapter behind `EmailSender` interface with one concrete provider (Resend or SES, env-selected); audience list table dependency noted, basic single-send first.
12. `src/app/marketing/settings/connections/page.tsx` — connect/disconnect UI per channel with status + last health check.
13. `src/app/api/marketing/connections/[id]/health/route.ts` — on-demand health check; cron route `/api/cron/connection-health` daily.
14. Migration `0016_publish_queue.sql` — `publish_queue` (workspace_id, content fk, connection fk, scheduled_at, status enum queued/publishing/published/failed/cancelled, attempts, last_error, published_url, external_id) + RLS.
15. `src/server/services/publishService.ts` — enqueue on approve-with-schedule; worker function: dequeue due items → format → adapter.publish → update queue + content row (published_url, external_id) → audit log.
16. `src/app/api/cron/publish-worker/route.ts` — Vercel cron every 5 min, batch 10, retry-with-backoff (max 3, then failed + notify); register in `vercel.json`.
17. Content detail "Publish" panel: pick connection, now-or-schedule picker, enqueue (approved status required — hard gate).
18. `src/app/marketing/publish/page.tsx` — publish queue board: upcoming scheduled, recent publishes, failed with error + retry/cancel actions.
19. Migration `0017_metric_snapshots.sql` — `metric_snapshots` (workspace_id, content fk, captured_at, metrics jsonb) + RLS.
20. `src/app/api/cron/metrics-sync/route.ts` — daily cron: for published content <30 days old, adapter.fetchMetrics → snapshot row + rollup onto `content.metrics`; register in `vercel.json`.
21. `docs/PUBLISHING.md` — per-platform app setup guide (LinkedIn app approval, Meta app review, Reddit app, X tier), scopes, and the no-auto-post guarantee.
22. LinkedIn company-page support: extend linkedin adapter for organization posts (separate connection kind) once Community Management access approved.
23. Publish failure notifications: `marketing_notifications` table + in-app bell badge on queue failures (reuse existing app notification pattern if present first).
24. Formatter edge cases: thread/carousel kinds rejected with clear error per channel; link-in-comments pattern for Reddit; UTM tagging helper for published links.
25. Unpublish/delete support where APIs allow (`deletePost` optional interface method); audit-logged.
26. Multi-account per channel (e.g., Abdullah personal + Skarion page) — connection picker already supports; add per-connection default persona tagging.
27. Rate-limit guard: per-connection token bucket in `src/lib/publish/rateLimit.ts` (persisted in Redis-free table form); queue worker respects it.
28. Tests: formatter unit tests per channel, publishService state-machine tests with mocked adapters, queue retry tests.
29. Dry-run mode: `PUBLISH_DRY_RUN=true` env logs instead of posting; QA entire queue flow without touching real accounts.
30. Manual QA: connect one real account (LinkedIn sandbox or personal w/ consent) → approve a draft → schedule → worker publishes → URL + metrics sync back to the row.

---

## Phase 5 — Performance Loop, Funnel Bridge, Hardening (30 chunks)

1. Migration `0018_touchpoints.sql` — `touchpoints` (workspace_id, content fk nullable, channel fk, kind, subject_ref, created_at) for attribution events + RLS.
2. Instrument publish + inbound-reply logging to write touchpoint rows.
3. `src/lib/marketing/attribution.ts` — first-touch/last-touch attribution over touchpoints → booked-call/agreement events.
4. Migration `0019_leads.sql` — light `leads` (workspace_id, name, linkedin_url, email, degree, school, authorization, source_content fk nullable, status, temperature, owner_id, notes) + RLS.
5. `src/app/api/marketing/leads/route.ts` + `[id]/route.ts`; lead creation from a content touch ("content produced a reply → create lead").
6. `src/lib/marketing/warmSignals.ts` — Flash classification on inbound replies for warm-lead signals (fee question, booking-link request, how-it-works question) → auto-raise temperature + create task; human-confirmed.
7. `src/app/api/marketing/leads/[id]/signal-scan/route.ts` — run warm-signal scan on pasted reply text (manual first, integrations later).
8. `src/app/marketing/leads/page.tsx` — lead grid (reuses EditableGrid) with temperature + source-content column.
9. Migration `0020_tasks.sql` — `tasks` (workspace_id, lead fk nullable, content fk nullable, kind, due_at, assignee, status) + RLS; `src/app/marketing/tasks/page.tsx`.
10. `src/app/api/cron/followups/route.ts` — daily: stale leads/conversations → follow-up tasks; register in `vercel.json`.
11. TalentOS handoff: `src/lib/integrations/talentos.ts` — on lead status → `agreement_signed`, POST the CRM field set to the TalentOS candidate-intake endpoint (identify real endpoint in skarion-app first; feature-flagged).
12. `docs/INTEGRATIONS.md` — SkarionCRM (import clean lists) + TalentOS (handoff contract) boundaries and payloads.
13. `src/app/marketing/reports/page.tsx` — reports hub.
14. `src/app/api/marketing/reports/channel-performance/route.ts` + page — posts, replies, calls per channel vs historical baselines (67→5, 590→17, 184→4).
15. `src/app/api/marketing/reports/attribution/route.ts` + page — channel/campaign → booked calls/agreements chart.
16. `src/app/api/marketing/reports/ai-usage/route.ts` + page — spend by user/campaign/model/day from `ai_usage_log`; cost per published piece.
17. `src/lib/marketing/budgetAlerts.ts` — cron warns at 80% of campaign budget; notification row.
18. `src/app/marketing/reports/content-scorecard/page.tsx` — per-post metrics rollup from `metric_snapshots`; winning-angle flags feed `ideas` backlog.
19. Role scoping pass: verify every `/api/marketing/*` route enforces workspace + role via middleware; add missing ones.
20. Security pass: RLS policies on every table reviewed against auth model; secret vault never read client-side; no tokens in logs.
21. Performance pass: indexes on hot paths (content workspace+status+planned_at, publish_queue scheduled_at+status, ai_usage_log workspace+created_at).
22. `marketing_activity_log` view: prospect/content/lead detail pages show unified audit history via `audit_log`.
23. `marketing_webhooks` (outbound): `content.published`, `lead.warm`, `budget.warning` events + CRUD for webhook configs + dispatcher with signing secret.
24. Feature flags table + `src/lib/flags.ts` — X publishing, TalentOS handoff, dry-run publish; per-workspace overrides in settings.
25. Test suite completion: vitest for lib (compliance, cost, formatter, attribution), API smoke tests with mocked Supabase, one Playwright happy-path (idea → draft → approve → queue in dry-run).
26. CI: GitHub Action — install, typecheck, unit tests, build; required on PRs to main.
27. Error tracking: wire Sentry (or equivalent) server+client; alert on publish-worker failures.
28. Data retention + export: per-workspace full export (content, leads, logs) as JSON/CSV; deletion honoring workspace removal.
29. Onboarding flow: new workspace wizard (profile → connect AI key → seed channel rules from template pack → connect first social account); Skarion template pack ships as seed data.
30. Final QA: full walkthrough — workspace → idea → bulk generate → lint → approve → schedule → publish (dry-run + one real) → metrics → attribution → cost report → TalentOS handoff (flagged) — fix everything, tag `v1.0`.

---

## How to work the chunks

- Feed one chunk at a time as a coding prompt (file path + acceptance check included).
- Keep order within a phase; Phase 3 needs Phase 1's provider + Phase 2's tables/UI; Phase 4 needs Phase 3's approved-content gate.
- `npm run typecheck` every ~10 chunks; browser/API smoke test every ~15; never batch-check a whole phase at the end.
- Publishing adapters (Phase 4) each need a real platform app + approval — start those applications during Phase 2 so review time doesn't block Phase 4.
