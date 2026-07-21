# Integrations

MarketingOS connects to TalentOS and SkarionCRM at defined handoff points. No data flows automatically — every transfer is a human-approved action or feature-flagged.

## TalentOS (skarion-app)

**Trigger:** Lead reaches `agreement_signed` status in MarketingOS.

**Action:** `handoffToTalentOS()` POSTs the candidate's fields to the TalentOS candidate-intake endpoint.

**Feature flag:** `TALENTOS_HANDOFF_ENABLED=true` (default: off). No data leaves MarketingOS unless this flag is on.

**Endpoint:** `TALENTOS_INTAKE_ENDPOINT` env var — point this at the real skarion-app intake route.

**Payload:**
```json
{
  "name": "string",
  "email": "string",
  "linkedin_url": "string",
  "degree": "string",
  "school": "string",
  "authorization": "string (OPT/STEM OPT/CPT/etc.)",
  "source": "MarketingOS content",
  "notes": "string"
}
```

## SkarionCRM

**Purpose:** Import clean lead lists (bulk). MarketingOS does not manage bulk lists — SkarionCRM is the source.

**Direction:** SkarionCRM → MarketingOS (import clean lists via CSV import).

**Boundary:** Post-signing operations stay in TalentOS. Bulk list processing stays in SkarionCRM. MarketingOS handles content-to-lead attribution and warm-signal detection.
