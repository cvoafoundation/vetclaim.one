-- Adds a place for AI-drafted summaries on an issue — kept in its own
-- columns, never blended with claimed_theory (representative's own
-- words) or disposition_reason (representative's own judgment), per
-- the rule that veteran-reported / extracted / rules-engine / AI /
-- representative-judgment content must never blend together.

alter table claim_issues
  add column ai_summary text,
  add column ai_summary_generated_at timestamptz,
  add column ai_summary_generated_by uuid references auth.users(id);
