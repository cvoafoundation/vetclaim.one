# VetClaim.one — MVP vertical slice (v1)

Non-production. Synthetic demo data only.

## What's built
 
- Design tokens (`tailwind.config.ts`, `app/globals.css`) — paper/ink/warm-gray
  base, ochre accent, serif/sans/mono type roles, mono citation tags
- Full Supabase schema + RLS policies for the MVP scope (`supabase/schema.sql`)
- Landing page, sign-in
- Representative: caseload dashboard, create matter
- Veteran: intake step 1 (service history), step 2 stub (deployments)

## Setup

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql` in full.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API). Do not put the service-role key
   anywhere client-reachable.
4. Create a demo organization row and an `org_members` row for yourself as
   `representative` so the RLS policies let you create matters.
5. Upload this project via the GitHub web uploader, then connect the repo
   to Vercel and set the same environment variables there.

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
