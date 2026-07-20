# MarketingOS — Goals (v2, redefined 2026-07-20)

Grounded in: `Skarion_Master_AI_Context.md` (2026-07-15) + the legacy build plan in
`alsaki27/MarketingOS/docs/PLAN.md` (technical scaffold retained, business layer rewritten).

---

## 1. What this app actually is

MarketingOS is **Skarion's candidate-acquisition engine**. It is not a generic B2B marketing CRM.

Skarion sells end-to-end career consultation, preparation, and placement support to candidates —
mostly international students and recent grads on OPT/STEM OPT, plus career pivots. Revenue arrives
only after a successful placement (success-fee model, no upfront fee). MarketingOS owns everything
between "we have a name on a lead list" and "this person signed the agreement and becomes a
TalentOS candidate."

Position in the product family:

| System | Owns |
|---|---|
| SkarionCRM | Raw lead lists, enrichment, bulk filtering |
| **MarketingOS** | Outreach → conversation → qualification → booked consultation call → signed agreement |
| TalentOS (skarion-app) | Everything after signing: training, resumes, applications, interviews, placement |

The single integration contract with TalentOS: **when a prospect reaches "Agreement signed /
Active candidate", MarketingOS hands the record off into the TalentOS candidate pipeline.**

## 2. The goals

### G1 — Book qualified consultation calls (the north star)
The business metric that matters is booked + completed consultation calls with *qualified*
candidates, and ultimately signed agreements. Every feature is justified by whether it moves a
prospect through the funnel: New lead → Contacted → Replied → Qualifying → Warm lead →
Call offered → Call booked → Call completed → Agreement sent → Active candidate.

### G2 — Every AI message must obey the Skarion voice and compliance rules
The Skarion Master AI Context is the law. Generated content must enforce it mechanically, not
just by prompt:
- "Hi [Name]," never "Dear"; short, warm, human, profile-specific
- no upfront fee language, never "free", never quote an exact fee
- never guarantee a job, timing, salary, sponsorship, or immigration outcome
- channel rules differ (LinkedIn short DM vs email vs Reddit help-first comments vs Facebook groups)
- no booking link before the candidate shows interest
- no invented employer relationships, placement stats, or success claims
A compliance lint pass runs on every generated draft *before* a human sees it, and nothing
auto-sends — every send is a human approval. This is a brand-safety feature, not a nice-to-have:
one spammy mass campaign can get Abdullah's LinkedIn or a Reddit account banned.

### G3 — Personalization at scale, grounded in the prospect's real background
Historical lesson from prior outreach: profile-specific messages outperform generic ones; generic
"we take over everything" copy sounds spammy. MarketingOS builds per-prospect context (degree,
school, tools, target roles, authorization timeline, source) into generation prompts, uses
grounded research for anything factual, and dedupes scripts so the same sentence never goes to
500 people.

### G4 — Score and prioritize leads like the team already does manually
Fit / timing / authorization / openness scoring, matching the existing Skarion lead-scoring
philosophy (a score is a prioritization aid, not a judgment of a person). Warm-lead signals
(asks about fees, asks how Skarion works, open to adjacent roles, requests the booking link)
must be detectable in conversation replies and should automatically raise the lead and create
a task for the owner.

### G5 — Know what works: attribution from channel → call → agreement
Which channel (LinkedIn / email / Reddit / Facebook / referral), which campaign, and which
message style actually produced booked calls and signed agreements. Historical baselines exist
(590 emails → 34 replies → 17 calls; 184 DMs → 14 replies → 4 calls) — the app should beat and
explain these numbers, plus track AI spend per campaign with caps.

### G6 — Human-in-the-loop everywhere
AI drafts, scores, researches, and suggests next actions. Humans approve, send, and talk to
candidates. The consult call, the fee conversation, and the fit decision stay human. This is a
hard architectural constraint (all content starts as `status: draft`), inherited from the legacy
plan and now promoted to a product goal.

## 3. Explicit non-goals

- **B2B / employer-side marketing.** Skarion Engineering marketing is out of scope entirely —
  the two brands must never mix in candidate messaging.
- **Auto-sending anything.** No fully autonomous outreach sequences.
- **Immigration advice.** The app may surface approved boundary language, never legal guidance.
- **A job board, job crawler, or placement tracking.** That is TalentOS.
- **Replacing SkarionCRM's bulk list management.** MarketingOS imports clean lists; it does not
  re-do the 4,000-row Excel filtering workflows.

## 4. What the legacy plan got right vs. what changes

Keep from `alsaki27/MarketingOS/docs/PLAN.md` (it becomes `docs/LEGACY_PLAN.md` here):
- Next.js 14 App Router + Supabase + Vercel, extending skarion-app conventions
- provider-agnostic AI layer with a Google Vertex (Gemini + Imagen) slot
- draft → approve → send content lifecycle
- migrations-per-chunk, repo-before-routes-before-UI chunk ordering, typecheck cadence

Changes driven by the goals above:
1. **Prospect model gets the Skarion CRM field set** (degree, school, graduation date,
   authorization status, OPT start date, target roles, relocation flexibility, source, lead
   temperature, owner) and the **18-status funnel** from the Master Context — not generic
   "opportunity stages".
2. **Prompt templates encode the Master Context** (section 25 system prompt, channel rules,
   prohibited phrases) and a **compliance lint** checks drafts against the prohibited-claims list
   before they are shown for approval.
3. **Warm-lead signal detection** on incoming replies becomes a first-class feature (auto-raise
   status, create follow-up task) instead of just "next action suggestion".
4. **TalentOS handoff** is defined precisely: trigger on agreement-signed, payload = the CRM
   field set, and it lands as a new TalentOS candidate.
5. **Attribution targets calls and agreements**, not just "opportunities generated".

## 5. Success metrics

| Metric | Why |
|---|---|
| Reply rate per channel/campaign | Beat 34/590 email, 14/184 DM baselines |
| Booked calls per campaign | G1 north star |
| Signed agreements per campaign | The actual revenue pipeline |
| % drafts passing compliance lint on first pass | G2 health |
| AI cost per booked call | G5 cost control |
| Time from lead import → first human-approved touch | G3 throughput |

## 6. Open items the app must not guess (from Master Context §26)

Exact success fee, payment schedule, placement definition, approved stats/testimonials,
employer names mentionable, follow-up cadence, current team roles. The app stores these as
admin-editable settings with conservative defaults, and generated content must use the
conservative fallback language until leadership fills them in.
