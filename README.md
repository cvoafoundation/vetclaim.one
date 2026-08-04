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
  with evidence matrix, plain-language explanations, one-click "request from
  veteran" task assignment, and accept/reject/defer with required reasons
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
