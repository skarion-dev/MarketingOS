# Skarion Marketing OS — 4-Phase / 120-Chunk Build Plan

Grounded in the real repo (`skarion-app`): Next.js 14 App Router + Supabase (Postgres/Auth) + Vercel,
with an existing provider-agnostic AI layer (`src/lib/ai/provider.ts`) and a `google` provider slot
already reserved but unimplemented in `aiKeyRepository.ts` / `aiProvider.ts`.

Each chunk below is sized to be handed to deepseek as a single self-contained coding task: one
file or one tight cluster of files, one acceptance check. Do them in order within a phase — later
chunks depend on earlier ones (migrations before repositories, repositories before API routes,
API routes before UI).

---

## Phase 1 — Vertex AI Foundation + Core Data Model

1. Add Vertex env vars to `.env.example`: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `VERTEX_TEXT_MODEL`, `VERTEX_IMAGE_MODEL`.
2. Add `google-auth-library` to `package.json` dependencies.
3. `src/lib/ai/vertexAuth.ts` — exchange a service-account JSON for a short-lived OAuth token (wrap `google-auth-library`'s `GoogleAuth`).
4. `src/lib/ai/vertexProvider.ts` — implement `AiProvider.send()` against Gemini `generateContent` REST endpoint, model = Gemini 2.5 Pro.
5. Export a second factory in the same file for Gemini 2.5 Flash (same shape, cheaper/faster model).
6. Add an optional `grounding: boolean` field to the `send()` options in `vertexProvider.ts` that turns on Google Search grounding tools in the request body.
7. `src/lib/ai/vertexImageProvider.ts` — separate interface `generateImage(prompt): Promise<{base64: string}>` calling Imagen.
8. Add `case "google":` to `buildProviderFromDbKey()` in `src/server/services/aiProvider.ts`, returning the Vertex text provider built from the stored service-account JSON.
9. Verify `AiProvider` type union in `aiKeyRepository.ts` already covers `"google"` (it does) — add a `model` metadata field if missing so pro/flash can both be stored.
10. Update `src/app/ops/components/ai-key-manager.tsx` so the "google" provider accepts a multi-line JSON paste/upload instead of a single-line key string.
11. Update `/api/admin/ai-keys/[id]/test/route.ts` to route google-provider tests through the new adapter.
12. Update `getActiveProvider()`/`getActiveProviderAsync()` in `src/lib/ai/index.ts` to support `AI_PROVIDER=google` as an explicit selection (not folded into anthropic/nvidia fallback).
13. `scripts/test-vertex-provider.mjs` — manual smoke-test script that sends one prompt and prints the response.
14. Migration `0001_marketing_channels.sql` — `marketing_channels` table + RLS policy matching existing table conventions.
15. Migration `0002_marketing_campaigns.sql` — `marketing_campaigns` (fk → channels) + RLS.
16. Migration `0003_marketing_prospects.sql` — `marketing_prospects` with unique index on `dedupe_key`.
17. Migration `0004_marketing_content.sql` — `marketing_content` (fk → campaigns, nullable fk → prospects).
18. Migration `0005_marketing_conversations.sql` — `marketing_conversations` (fk → prospects, channels).
19. Migration `0006_marketing_opportunities.sql` — `marketing_opportunities` (fk → prospects).
20. Migration `0007_marketing_tasks.sql` — `marketing_tasks` (fk → prospects nullable, assignee).
21. Migration `0008_marketing_research_runs.sql` — audit table: subject, prompt, provider, grounded bool, result jsonb, cost_cents.
22. `src/server/repositories/marketingRepository.ts` — CRUD for channels.
23. Extend `marketingRepository.ts` — CRUD for campaigns.
24. Extend `marketingRepository.ts` — CRUD for prospects, plus a `findByDedupeKey()` lookup.
25. Extend `marketingRepository.ts` — CRUD for content.
26. Extend `marketingRepository.ts` — CRUD for conversations and tasks.
27. Extend `marketingRepository.ts` — CRUD for opportunities.
28. `src/app/api/marketing/channels/route.ts` (GET/POST) + `[id]/route.ts` (PATCH/DELETE).
29. `src/app/api/marketing/campaigns/route.ts` + `[id]/route.ts`.
30. Manual check: hit every Phase 1 API route with curl/Postman against a seeded Supabase table and confirm CRUD works end to end.

---

## Phase 2 — Marketing CRM UI + Core Workflows

1. `src/app/marketing/layout.tsx` — nav shell, reusing the existing auth/role guard pattern from the rest of the app.
2. `src/app/marketing/page.tsx` — dashboard landing with summary cards (counts of campaigns/prospects/open tasks).
3. `src/app/marketing/channels/page.tsx` — list + create channel form.
4. `src/app/marketing/campaigns/page.tsx` — list view (table, sortable).
5. `src/app/marketing/campaigns/[id]/page.tsx` — campaign detail page.
6. `src/app/marketing/campaigns/new/page.tsx` — create form.
7. `src/app/marketing/prospects/page.tsx` — list/grid view with basic filters (type, source).
8. `src/app/marketing/prospects/[id]/page.tsx` — prospect detail with conversation timeline placeholder.
9. `src/app/api/marketing/prospects/route.ts` + `[id]/route.ts`.
10. `src/app/api/marketing/prospects/import/route.ts` — CSV import using `papaparse` (already a dependency).
11. `src/app/api/marketing/prospects/dedupe/route.ts` — check-before-create dedupe endpoint.
12. `src/lib/marketing/dedupe.ts` — `dedupe_key` generation (normalize email / LinkedIn URL / name+company).
13. `src/app/marketing/prospects/kanban/page.tsx` — kanban view grouped by opportunity stage.
14. `src/app/api/marketing/conversations/route.ts` + `[id]/route.ts`.
15. `src/app/marketing/prospects/[id]/components/ConversationThread.tsx`.
16. `src/app/api/marketing/tasks/route.ts` + `[id]/route.ts`.
17. `src/app/marketing/tasks/page.tsx` — assigned/open task list.
18. `src/app/api/marketing/opportunities/route.ts` + `[id]/route.ts`.
19. `src/app/marketing/opportunities/page.tsx` — pipeline board (kanban by stage).
20. `src/app/api/marketing/content/route.ts` + `[id]/route.ts` (CRUD with status field).
21. `src/app/marketing/content/page.tsx` — content list with status filter (draft/approved/sent).
22. `src/app/marketing/content/[id]/page.tsx` — content detail/edit/approve UI.
23. `src/app/api/marketing/content/[id]/approve/route.ts` — status-transition endpoint with audit stamp.
24. Auth middleware for all `/api/marketing/*` routes, reusing the existing app auth pattern — check before building a new one.
25. `src/app/marketing/components/EditableGrid.tsx` — check what table component TalentOS already uses for applicant lists; reuse it rather than introducing AG Grid/TanStack Table.
26. Migration + repository for `marketing_saved_views` (per-user saved filters).
27. `src/app/marketing/components/SavedViewsBar.tsx`.
28. `src/app/api/marketing/campaigns/[id]/stats/route.ts` — aggregate query (content count, prospects touched, opportunities generated).
29. Campaign detail page: wire in the stats endpoint from #28.
30. Manual QA: walk the full CRUD flow in the browser — channel → campaign → prospect → content → approve — and fix anything broken before Phase 3.

---

## Phase 3 — Vertex AI Research & Content Generation

1. `src/lib/marketing/prompts/research.ts` — prompt templates: company research, contact research, competitor research.
2. `src/app/api/marketing/research/route.ts` — `POST {subject, promptType}` → calls Vertex Pro with `grounding: true`.
3. Persist every research call to `marketing_research_runs` (prompt, result, cited sources, cost).
4. `src/app/marketing/research/page.tsx` — request form + history list.
5. `src/app/marketing/research/[id]/page.tsx` — result detail with cited sources shown.
6. `src/lib/marketing/prompts/contentDrafting.ts` — templates per content kind (LinkedIn post, cold email, comment reply, DM).
7. `src/app/api/marketing/content/generate/route.ts` — `POST {campaignId, prospectId?, kind}` → Vertex Flash draft, saved with `status: draft`.
8. `src/app/marketing/content/new/page.tsx` — "Generate content" form (campaign, kind, tone).
9. `src/lib/marketing/personalize.ts` — builds per-prospect context (education, role, company) into the generation prompt.
10. `src/app/api/marketing/content/[id]/regenerate/route.ts` — regenerate with user feedback/edits.
11. `src/lib/marketing/prompts/imageBriefs.ts` — prompt templates for Imagen creative briefs.
12. `src/app/api/marketing/content/generate-image/route.ts` — calls `vertexImageProvider`, stores result in Supabase Storage.
13. Supabase Storage bucket config for `marketing-assets`.
14. `src/app/marketing/content/[id]/components/ImagePreview.tsx`.
15. `src/lib/marketing/scoring.ts` — lead/reply quality scoring via Vertex Flash classification.
16. `src/app/api/marketing/prospects/[id]/score/route.ts`.
17. `src/lib/ai/vertexEmbeddingProvider.ts` — wraps Vertex text-embedding model.
18. Migration adding a vector column (pgvector) to `marketing_prospects` and/or `marketing_conversations`.
19. `src/lib/marketing/similarity.ts` — nearest-neighbor prospect/message lookup for duplicate detection.
20. `src/app/api/marketing/research/company/route.ts` — specialized grounded company-intel endpoint.
21. `src/app/api/marketing/research/competitor/route.ts` — specialized competitor-analysis endpoint.
22. `src/lib/marketing/nextAction.ts` — Vertex Flash suggests next follow-up action given conversation history.
23. `src/app/api/marketing/conversations/[id]/suggest-next/route.ts`.
24. `src/app/api/cron/marketing-followups/route.ts` — finds stale conversations, auto-creates follow-up tasks.
25. Add the new cron route to `vercel.json`.
26. Migration + repository for `marketing_prompt_templates` (versioned prompt library).
27. `src/app/marketing/settings/prompts/page.tsx` — template editor/version list.
28. Template approval workflow (draft/approved status, same pattern as content).
29. Wire content-generation endpoints (#7, #12) to pull the active template from the library instead of a hardcoded prompt string.
30. Manual QA: run research → draft → image → approve loop end to end, confirm every Vertex call is logged with a cost figure.

---

## Phase 4 — Attribution, Cost Controls, Permissions, Hardening

1. Migration `marketing_touchpoints` — links content/conversation to campaign + channel + prospect with a timestamp.
2. Instrument content-send and conversation-log endpoints to write a touchpoint row.
3. `src/lib/marketing/attribution.ts` — first-touch/last-touch attribution calculation.
4. `src/app/api/marketing/attribution/route.ts` — report endpoint.
5. `src/app/marketing/reports/attribution/page.tsx` — chart: which channel/campaign produced which opportunities.
6. `src/app/api/marketing/reports/channel-performance/route.ts`.
7. `src/app/marketing/reports/channel-performance/page.tsx`.
8. Migration adding token/cost columns to `marketing_research_runs` and `marketing_content`.
9. `src/lib/ai/costEstimator.ts` — per-provider/model cost-per-token table and calculator.
10. `src/app/api/marketing/reports/ai-usage/route.ts` — aggregate spend by user/campaign/day.
11. `src/app/marketing/reports/ai-usage/page.tsx` — usage dashboard.
12. Migration + check: per-campaign monthly AI-spend cap, enforced in generate/research routes.
13. `src/lib/marketing/budgetAlerts.ts` — cron check that warns when a campaign nears its cap.
14. Migration `marketing_roles` — role scoping (admin/editor/viewer) local to the marketing module.
15. `src/server/middleware/marketingAuth.ts` — enforces role on every `/api/marketing/*` route.
16. Assignee field + filter UI across prospects/tasks/opportunities.
17. Migration `marketing_activity_log` + a logging helper called from mutation endpoints.
18. `src/app/marketing/prospects/[id]/components/ActivityHistory.tsx`.
19. Migration + CRUD + UI for `marketing_comments`, reused across prospects/campaigns/content.
20. Migration `marketing_notifications` + minimal in-app bell (reuse an existing notification pattern if one exists in the app first).
21. Migration `marketing_webhooks` + outbound dispatcher for `opportunity.created` / `content.approved` events.
22. `src/app/api/marketing/webhooks/route.ts` — CRUD for webhook configs.
23. TalentOS integration hook: when an opportunity of kind `recruitment` reaches a defined stage, push the candidate into the existing TalentOS candidate pipeline — identify the actual integration point first.
24. `src/lib/marketing/crossSourceDedupe.ts` — duplicate-contact detection across LinkedIn/email/CRM/TalentOS.
25. `src/app/api/marketing/export/route.ts` — CSV export for prospects/campaigns/content.
26. `src/lib/ai/withRetry.ts` — retry-with-backoff wrapper, applied to all Vertex calls.
27. Error/loading/retry states across generate/research UI components.
28. Security pass: confirm RLS policies on every `marketing_*` table match the rest of the app's auth model.
29. Performance pass: add indexes on foreign keys and `dedupe_key` columns used in hot-path queries.
30. Final QA: full walkthrough — channel → campaign → prospect → research → content → image → approve → attribution → cost report — in the browser, fix anything broken.

---

## How to use this with deepseek

- Feed one chunk at a time as a coding prompt, including the file path and the acceptance check.
- Keep chunks in order within a phase; cross-phase dependencies only run forward (Phase 3 needs Phase 1's provider + Phase 2's tables/UI).
- After every ~10 chunks, run `npm run typecheck` and a manual smoke test before continuing — deepseek-generated code should be checked in small batches, not at the end of a 30-chunk phase.
