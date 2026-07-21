# MarketingOS — Goals (v4, 2026-07-20)

Grounded in: `Skarion_Master_AI_Context.md` (2026-07-15), Abdullah's product direction, and the
legacy build plan from `alsaki27/MarketingOS/docs/PLAN.md` (kept as `docs/LEGACY_PLAN.md`).

> v4: center of gravity confirmed as the **Airtable-style content ops workspace with AI in the
> grid**, plus two long-term commitments: **publish directly to every social channel from the
> app**, and **SaaS-grade architecture from day one** so this can outlive Skarion's internal use.

---

## 1. What this app is

MarketingOS is **Skarion's content planning, production, and publishing system** — think
Airtable, but the tables *are* the content plan, every cell can be filled by AI, and an approved
row can be published straight to LinkedIn, Reddit, Facebook, X, or email without leaving the app.

```
Ideas → Content plan (Airtable-style grid) → AI-generated drafts → human review/approve
      → one-click direct publish (or schedule) → metrics sync back → plan learns
```

Skarion's growth depends on candidate-facing content: founder-led LinkedIn, OPT/OSP education,
Reddit participation, Facebook groups, email sequences. Today that runs on spreadsheets and
copy-paste. MarketingOS replaces the whole chain.

## 2. The goals

### G1 — The content plan is the product: an Airtable-grade data grid
- **Content calendar**, **idea backlog**, **campaigns/themes**, **channel accounts**, **assets** —
  all real tables with inline cell editing, saved views (grid / group / calendar / kanban),
  filters, CSV import/export.
- This is the daily workspace for the team, not a reporting layer on top of one.

### G2 — AI is integrated into the grid, not a separate tool
- Row-level actions: generate draft from idea, rewrite/shorten/expand any cell, N variants of a
  hook, auto-fill channel/persona/posting-time suggestions.
- Bulk: 20 idea rows → 20 channel-correct drafts, each held as `status: draft`.
- Imagen for row-attached visual assets; Gemini + Google Search grounding for fact-based posts,
  citations stored on the row; every call cost-logged.

### G3 — Compliance is a pipeline stage, not a prompt hope
- Abdullah's voice and the Master AI Context rules are enforced mechanically: per-channel rules,
  "Hi [Name]," never "Dear", no guarantees of job/sponsorship/timing, no exact fees, "no upfront
  fee" never "free", no booking link before interest, no invented stats/employers, no Skarion
  Engineering bleed.
- Lint violations are stored on the content row and shown to the reviewer. A failing draft cannot
  be approved without an explicit override + reason (audit-logged).

### G4 — Human-approved, then one-click direct publishing
- Lifecycle: `idea → draft → in review → approved → scheduled/published`, full audit trail.
- **Once approved, publishing happens from inside the app** via connected channel accounts
  (OAuth): LinkedIn personal + company page, Facebook pages/groups where permitted, Reddit, X,
  email lists. No copy-paste step.
- Per-channel publisher adapters handle formatting (length, hashtags, link rules), scheduling,
  retries with backoff, and capture the published URL + external post ID back onto the row.
- The human approval gate is never bypassed: no fully autonomous posting, ever. Scheduling is
  fine; auto-generate-and-auto-post without review is not.

### G5 — Performance loop: metrics sync back into the plan
- Publisher adapters pull engagement metrics (likes/comments/shares/replies where APIs allow) on
  a schedule and snapshot them onto content rows.
- Historical baselines to beat: 67 posts → 5 calls; 590 emails → 34 replies → 17 calls;
  184 DMs → 14 replies → 4 calls. Winning angles get flagged into the idea backlog.

### G6 — Light funnel bridge, not a CRM
- A content touch can create a lead row; a warm reply (fee question, booking-link request) raises
  it and creates a task. Signed agreement → hand off to TalentOS. Bulk list management stays in
  SkarionCRM; post-signing ops stay in TalentOS.

### G7 — SaaS-grade from day one
Built so it can serve Skarion now and other teams later without a rewrite:

- **Workspace (tenant) model** at the root of every table; all access scoped by `workspace_id`
  with RLS. Skarion is workspace #1, not a hard-coded assumption.
- **Memberships & roles** (owner/admin/editor/viewer) per workspace; every mutation audit-logged.
- **Encrypted secret vault** for OAuth tokens and AI keys (never in plaintext columns, never in
  prompts/logs).
- **Per-workspace AI budgets** with hard caps and spend metering per model/campaign/user.
- **Provider adapters everywhere** — AI providers, social publishers, email senders — behind
  interfaces, so any vendor can be swapped without touching call sites.
- **Versioned prompt/template library** with approval workflow (same draft→approve pattern as
  content).
- **Testing & CI**: unit tests for lib logic, API smoke tests, typecheck + build gate on every
  PR; migrations are numbered, append-only, and reversible where possible.
- **Observability**: structured logs, error tracking, publish-queue dashboards; no silent 500s.
- **Rate-limit respect** for every external API (LinkedIn/Reddit/Meta/X), with queue-based
  backoff instead of retry storms.

## 3. Non-goals

- A general Airtable clone — the grid exists to run the content plan.
- Auto-publishing or auto-DM sequences without human approval.
- B2B / Skarion Engineering content (separate brand).
- Immigration advice content (approved boundary language only).
- Full CRM / bulk lead-list processing (TalentOS / SkarionCRM).

## 4. Build plan

`docs/PLAN.md` re-cuts the legacy 120 chunks into **5 phases (~150 chunks)**:

1. **Phase 1 — SaaS core + AI foundation**: workspace/tenant model, roles, audit, secret vault,
   settings, AI provider layer + Vertex (Gemini/Imagen/grounding), cost metering.
2. **Phase 2 — Data model + Airtable grid**: content/ideas/campaigns/channels/assets tables,
   flagship EditableGrid with saved views, calendar/kanban, CSV.
3. **Phase 3 — AI production line**: prompt library seeded from Master Context, row-level and
   bulk generation, compliance lint, images, grounded research.
4. **Phase 4 — Direct publishing**: OAuth connections, per-channel publisher adapters
   (LinkedIn, Meta, Reddit, X, email), publish queue with scheduling/retry, published-URL and
   metrics sync.
5. **Phase 5 — Performance loop + funnel bridge + hardening**: analytics, baselines, lead
   bridge, TalentOS handoff, security/perf/QA, CI completion.

## 5. Success metrics

| Metric | Why |
|---|---|
| Posts shipped per week per channel | The plan actually executing |
| % planned content delivered on time | Calendar discipline |
| Publish success rate (queue) | G4 reliability |
| Drafts passing compliance lint first pass | G3 quality |
| Human edit distance before approval | AI draft quality |
| AI cost per published piece | G2/G7 cost control |
| Calls booked attributable to content | The funnel is the point |

## 6. Open items the app must not guess (Master Context §26)

Exact success fee, approved stats/testimonials, mentionable employer names, follow-up cadence,
current team roles, approved posting cadence per channel. Stored as per-workspace,
admin-editable settings with conservative defaults; generation uses approved fallback language
until leadership fills them in.
