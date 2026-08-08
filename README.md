# VetClaim.one — MVP vertical slice (v1)

Non-production. Synthetic demo data only.

## What's built

- Design tokens — DIN (headings/labels/nav) + Courier (body, forms, data,
  citations), hard corners, paper/ink/warm-gray base with an ochre accent
- Full Supabase schema + RLS policies for the MVP scope (`supabase/schema.sql`,
  plus `supabase/migration-2-intake-tables.sql` for conditions/ratings/
  denials/providers if you're updating an existing database)
- A synthetic demo case seed (`supabase/seed-demo.sql`) — four claim issues
  with evidence, matching the plan's demo-data spec
- Landing page, sign-in
- "View as" switcher (representative / veteran / state admin) for reviewing
  all three interfaces from one login — dev convenience, not real role security
- **Full veteran intake, all six steps**: service history, deployments,
  current conditions, existing ratings, prior denials, providers — each one
  supports adding multiple entries, shows what's already been added, and
  has an explicit "Continue" action. A review-and-certify step closes it out
  and moves the case to "records needed."
- Representative: caseload dashboard (with CSV export), create matter, case
  detail with a compiled intake overview plus the issues list, issue detail
  with evidence matrix, plain-language explanations, an AI-drafted summary
  (grounded only in evidence/citations already on record — see below),
  one-click "request from veteran" task assignment, and accept/reject/defer
  with required reasons

## AI summary — how it's grounded, and how to self-host it

The "generate AI summary" button on each issue drafts a summary using
`lib/ai/draft.ts`, which is deliberately provider-agnostic — set one
environment variable (`AI_PROVIDER`) to switch between Anthropic's API and
a self-hosted open-source model, with no app code changes either way.

The prompt itself only ever includes the issue's own fields, its evidence
rows, and any matching rows from the `rules` table — nothing else. It's
explicitly instructed not to invent diagnoses, citations, causation, or an
approval likelihood, and to say when something needed isn't in the record
rather than filling the gap. The result is stored in its own columns on
`claim_issues` (`ai_summary`, never blended into `claimed_theory` or
`disposition_reason`) and always labeled unverified — generating one never
changes a disposition.

### Option A — Anthropic API
Set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` in Vercel. Simplest to
run, no infrastructure to maintain, but veteran case data leaves your
infrastructure on every call.

### Option B — self-hosted, on your own server (no data leaves your infrastructure)
Set `AI_PROVIDER=self_hosted` and point it at a server you control, running
[Ollama](https://ollama.com) (the simplest way to self-host an open model
with an OpenAI-compatible API):

1. Stand up a server with a GPU if you can get one (self-hosted models run
   noticeably faster and better quality on a GPU; a CPU-only box works but
   is slow). A modest cloud GPU instance (e.g. a single A10 or similar)
   from any provider running Ubuntu is enough for a model this size.
2. Install Ollama on it: `curl -fsSL https://ollama.com/install.sh | sh`
3. Pull a model: `ollama pull llama3.1:8b`
4. Ollama exposes an OpenAI-compatible endpoint automatically at
   `http://<your-server-ip>:11434/v1` — no extra setup needed.
5. In Vercel, set:
   - `AI_PROVIDER=self_hosted`
   - `SELF_HOSTED_AI_BASE_URL=http://<your-server-ip>:11434/v1`
   - `SELF_HOSTED_AI_MODEL=llama3.1:8b`
6. Lock the server down — put it behind a firewall that only allows
   inbound connections from Vercel's IP ranges, or put it behind a VPN.
   Don't leave port 11434 open to the whole internet; anyone who can reach
   it can use your GPU and, depending on configuration, see what's sent.

**Be aware of the real tradeoff:** an 8B open model is meaningfully weaker
than Claude at following strict "don't invent anything" instructions. Spot
check its outputs more carefully, especially early on, and treat "AI-
drafted — unverified" as a label to take seriously here, not boilerplate.
- Veteran: home page with real, dynamic intake progress (not hardcoded) and
  assigned tasks from the representative
- State admin: aggregate dashboard with office-level drilldown and CSV
  export — deliberately stops short of individual case data by design

## Setup

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql` in full.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API). Do not put the service-role key
   anywhere client-reachable.
4. Create a demo organization row and an `org_members` row for yourself as
   `representative` so the RLS policies let you create matters.
5. Optional but recommended for testing: run `supabase/seed-demo.sql`
   (edit the two IDs at the top first) to get a fully populated demo case
   with four issues to review. If you want the veteran view populated too,
   update the seeded matter's `veteran_user_id` to your own user id.
6. Upload this project via the GitHub web uploader (or GitHub Desktop),
   then connect the repo to Vercel and set the same environment variables
   there.

## How to test what's built

1. Sign in, land on `/rep` — you should see the seeded case if you ran
   the seed script.
2. Click "Open case" → see the compiled intake overview at the top, and
   the four issues below it.
3. Click into any issue → see its evidence matrix, a plain-language
   explanation, and the accept/defer/reject controls with explanations.
   Try "request from veteran" on a missing/conflicting evidence item.
4. Switch to the veteran view → walk through all six intake steps, adding
   a few entries at each, then certify at the end. Watch the progress
   checklist update for real as you go.
5. Check `/state` — click a stage to see the office-level breakdown, and
   try the CSV export on both `/rep` and `/state`.

## Next in the build order (per the plan)

1. Finish the remaining veteran intake steps (conditions, existing ratings,
   prior denials, providers) following the pattern in
   `app/veteran/intake/service/page.tsx`
2. Document upload + synthetic classification/extraction seed data
3. Timeline views built from verified facts
4. Rules-engine pass → populate `claim_issues` + `evidence_items`
5. Representative review UI (accept/reject/modify/defer)
6. Development task assignment
7. Claims Development Report generation
8. Mock VA decision upload + analysis

Supervisor and state-admin workspaces come after the slice is solid, per
the "one complete vertical workflow before expanding" instruction.
