# VetClaim.one — MVP vertical slice (v1)

Non-production. Synthetic demo data only.

## What's built

- Design tokens — DIN (headings/labels/nav) + Courier (body, forms, data,
  citations), hard corners, paper/ink/warm-gray base with an ochre accent
- Full Supabase schema + RLS policies for the MVP scope (`supabase/schema.sql`)
- A synthetic demo case seed (`supabase/seed-demo.sql`) — four claim issues
  with evidence, matching the plan's demo-data spec
- Landing page, sign-in
- "View as" switcher (representative / veteran / state admin) for reviewing
  all three interfaces from one login — dev convenience, not real role security
- Representative: caseload dashboard, create matter, case detail with
  issues list, issue detail with evidence matrix and accept/reject/defer
- Veteran: welcome/progress home, intake steps 1–2 (service history,
  deployments), step 3 stub (conditions)
- State admin: aggregate stub dashboard (counts only)

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
   with four issues to review.
6. Upload this project via the GitHub web uploader (or GitHub Desktop),
   then connect the repo to Vercel and set the same environment variables
   there.

## How to test what's built

1. Sign in, land on `/rep` — you should see the seeded case if you ran
   the seed script.
2. Click the case → see the four issues (tinnitus, sleep apnea, PTSD,
   lumbar strain), each tagged with its category and disposition status.
3. Click into any issue → see its evidence matrix (present / missing /
   conflicting / requires review) and accept, defer, or reject it.
   Rejecting or modifying requires a reason — try leaving it blank to see
   the guard.
4. Use the "view as" bar to jump to `/veteran` and `/state` and see those
   interfaces.

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
