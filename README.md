# Marketing OS

An Airtable-style Marketing CRM for Skarion, built as an extension of the `skarion-app` (TalentOS)
codebase: Next.js 14 (App Router) + Supabase (Postgres/Auth) + Vercel, with a provider-agnostic AI
layer that this project fills in with Google Vertex AI (Gemini + Imagen) for research and content
generation.

See [docs/PLAN.md](docs/PLAN.md) for the full build plan: 4 phases, 30 chunks each, each chunk
sized as a single self-contained coding task. Work the chunks in order — later chunks depend on
tables/routes/providers built in earlier ones.

## Stack conventions to follow

- Next.js 14 App Router, TypeScript, Supabase client (`@supabase/supabase-js`)
- AI calls go through the `AiProvider` interface (`send({system, messages, tools})`), not
  provider SDKs called directly from route handlers
- Every AI-generated content record starts as `status: draft` — nothing auto-sends. A human
  approves before anything goes out.
- Migrations live under `supabase/migrations/`, one file per chunk, following the existing
  numbered-prefix naming convention
- Run `npm run typecheck` after every ~10 chunks, not just at the end of a phase
