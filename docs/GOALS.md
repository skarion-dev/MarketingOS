# MarketingOS — Goals (v3, redefined 2026-07-20)

Grounded in: `Skarion_Master_AI_Context.md` (2026-07-15), Abdullah's product direction, and the
legacy build plan from `alsaki27/MarketingOS/docs/PLAN.md` (kept as `docs/LEGACY_PLAN.md`).

> v3 correction: the center of gravity is an **Airtable-style content operations workspace** —
> the content plan lives here as data, and AI is integrated into that grid to generate the
> content. Outreach/lead tracking exists, but only in service of the content engine.

---

## 1. What this app is

MarketingOS is **Skarion's content planning and production system** — think Airtable, but the
tables *are* the content plan, and every cell can be filled, rewritten, or extended by AI.

Skarion's growth depends on a steady stream of candidate-facing content: founder-led LinkedIn
posts, educational threads about OPT strategy and OSP/telecom pathways, Reddit participation,
Facebook group presence, email sequences, and the skarion.com funnel behind all of it. Today that
plan lives in spreadsheets and chats. MarketingOS makes it a database with an AI production line
bolted on.

The mental model:

```
Ideas → Content plan (Airtable-style grid) → AI-generated drafts → human review/approve
      → ready-to-publish queue → published & tracked → performance feeds back into ideas
```

## 2. The goals

### G1 — The content plan is the product: an Airtable-grade data grid
Everything is a table you can sort, filter, group, and edit in place:

- **Content calendar** — every planned post/email/comment with channel, date, owner, status
- **Idea backlog** — captured topics with source, angle, target audience, priority
- **Channel accounts** — LinkedIn (Abdullah's profile + Skarion page), Reddit, Facebook groups,
  email lists, each with their own rules and cadence
- **Campaigns/themes** — groupings like "OPT season push", "OSP awareness series",
  "founder story arc"
- **Assets** — generated images, carousels, thumbnails linked to content rows

Airtable-style UX is a hard requirement: inline cell editing, saved views (grid/group/calendar/
kanban-by-status), filters, and CSV import/export. This is what the team actually works in daily.

### G2 — AI is integrated into the grid, not a separate tool
The point of building this instead of using Airtable: the AI lives *inside* the rows.

- Generate a full draft from an idea row (button or command on the row)
- Rewrite/shorten/expand any cell ("make this hook punchier", "3 variants of this headline")
- Fill structured fields automatically: suggested channel, best posting time, target persona
- Bulk operations: take 20 idea rows → 20 channel-correct drafts, each held as `status: draft`
- Image generation (Imagen) attached to content rows as assets
- Grounded research runs (Gemini + Google Search) for fact-based posts, with citations stored
  on the row

Provider-agnostic AI layer (Vertex Gemini for text/grounding, Imagen for visuals), with every
call logged for cost.

### G3 — Every draft obeys the Skarion voice and compliance rules, mechanically
The Master AI Context is enforced in the generation pipeline, not just by prompt hope:

- Abdullah's style: direct, warm, practical, short paragraphs, no corporate slop
- Channel rules differ and are encoded per channel (LinkedIn short DM vs Reddit help-first
  comment vs email starting "Hi [Name],")
- Hard lint before a human sees a draft: no guarantees of jobs/sponsorship/timing, no exact fee
  quotes, "no upfront fee" never "free", no booking link before interest, no invented stats or
  employer relationships
- Never mix Skarion Engineering into candidate-facing content

A draft that fails lint is flagged with the specific violations — the reviewer fixes or
regenerates, never ships around it.

### G4 — Human-in-the-loop publishing, always
AI produces; humans approve. Nothing publishes itself. Content lifecycle is explicit:
`idea → draft → in review → approved → scheduled/ready → published`, with an audit trail of who
approved what. Skarion's credibility (and Abdullah's personal LinkedIn) is the asset being
protected.

### G5 — Close the loop: performance data flows back into the plan
Track what actually got published and how it did (replies, engagement, calls booked from content
where attributable). The historical baselines — 590 emails → 34 replies → 17 calls; 184 DMs →
14 replies → 4 calls; 67 social posts → 5 calls — become the benchmarks the content engine must
beat. Winning angles get flagged in the idea backlog so the plan learns.

### G6 — Bridge to the business funnel, without becoming the CRM
Content exists to fill the consultation pipeline. MarketingOS keeps a light prospect/conversation
layer (a content touch can create a lead row; a warm reply creates a follow-up task), and the
hard boundary stays: **signed agreement → hand off to TalentOS**. SkarionCRM keeps bulk list
management; TalentOS keeps post-signing operations. MarketingOS does not re-build either.

## 3. Non-goals

- **A general Airtable clone.** The grid exists to run the content plan, not to be a generic
  database product.
- **Auto-publishing or auto-DM sequences.** No content leaves without a human approval.
- **B2B / Skarion Engineering content.** Separate brand, out of scope.
- **Immigration advice content.** Approved boundary language only.
- **Full CRM** (pipeline stages, deals) and **bulk lead-list processing** — TalentOS and
  SkarionCRM respectively.

## 4. What changes vs the legacy plan

Kept: Next.js 14 + Supabase + Vercel scaffold, provider-agnostic AI layer with the Vertex slot,
draft→approve lifecycle, chunk-per-migration build ordering.

Re-cut around the content engine:

1. **`marketing_content` becomes the star table**, upgraded with the content-plan field set:
   channel, campaign/theme, target persona, hook, body, CTA, asset links, planned date, owner,
   status, published URL, performance snapshot.
2. **The Airtable-style `EditableGrid` is promoted from "one component, reuse something" to a
   flagship Phase-2 deliverable** — inline editing, saved views, calendar + kanban + grid views.
3. **Idea backlog and channel-rule tables are added**; channel rules seed the per-channel
   generation prompts.
4. **Compliance lint becomes a pipeline stage** on every generate/regenerate call, with
   violation details stored on the content row.
5. **Bulk generation** (idea rows → draft rows) is a first-class endpoint with per-campaign
   AI-spend caps.
6. Outreach/CRM chunks shrink to the light bridge described in G6.

## 5. Success metrics

| Metric | Why |
|---|---|
| Posts shipped per week per channel | The plan actually executing |
| % of planned content delivered on time | G1 calendar discipline |
| Drafts passing compliance lint first pass | G3 pipeline quality |
| Human edit distance before approval | AI draft quality (lower = better) |
| AI cost per published piece | G2 cost control |
| Calls booked attributable to content | G5/G6 — the funnel is the point |

## 6. Open items the app must not guess (Master Context §26)

Exact success fee, approved stats/testimonials, mentionable employer names, follow-up cadence,
current team roles, approved posting cadence per channel. Stored as admin-editable settings with
conservative defaults; generation uses approved fallback language until leadership fills them in.
