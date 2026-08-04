-- VetClaim.one — MVP schema (run in Supabase SQL Editor)
-- Order matters: org hierarchy -> membership -> matters -> everything else.

create extension if not exists "pgcrypto";

-- =========================================================================
-- ORG HIERARCHY
-- =========================================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references organizations(id),
  org_type text not null check (org_type in
    ('platform','state','county','office','team')),
  name text not null,
  created_at timestamptz not null default now()
);

create table org_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  organization_id uuid not null references organizations(id),
  role text not null check (role in
    ('platform_admin','state_admin','org_admin','supervisor',
     'representative','support_staff')),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, role)
);

-- Recursive helper: every descendant org id under a given org, inclusive.
create or replace function org_descendants(root uuid) returns setof uuid as $$
  with recursive tree as (
    select id from organizations where id = root
    union all
    select o.id from organizations o join tree t on o.parent_id = t.id
  )
  select id from tree;
$$ language sql stable;

-- Recursive helper: every ancestor org id above a given org, inclusive.
create or replace function org_ancestors(node uuid) returns setof uuid as $$
  with recursive tree as (
    select id, parent_id from organizations where id = node
    union all
    select o.id, o.parent_id from organizations o join tree t on o.id = t.parent_id
  )
  select id from tree;
$$ language sql stable;

-- =========================================================================
-- VETERAN MATTER
-- =========================================================================
create table veteran_matters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  veteran_user_id uuid references auth.users(id),
  primary_representative_id uuid references auth.users(id),
  stage text not null default 'intake_invited' check (stage in
    ('intake_invited','intake_in_progress','records_needed','under_analysis',
     'representative_review','veteran_action_required','development_in_progress',
     'ready_for_final_review','claim_ready','submitted_externally',
     'va_development','decision_received','decision_review','closed')),
  display_name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table matter_stage_history (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_by uuid not null references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- VETERAN INTAKE (service history — first vertical-slice screens)
-- =========================================================================
create table service_periods (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  branch text not null,
  entry_date date not null,
  discharge_date date,
  discharge_type text,
  occupational_specialty text,
  created_at timestamptz not null default now()
);

create table deployments (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  location text not null,
  start_date date,
  end_date date,
  suspected_exposures text[],
  created_at timestamptz not null default now()
);

-- =========================================================================
-- DOCUMENTS + EXTRACTED FACTS
-- =========================================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  document_type text,
  document_date date,
  source text,
  processing_status text not null default 'queued' check (processing_status in
    ('queued','processing','needs_review','complete','failed')),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table extracted_facts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  fact_type text not null,
  fact_value text not null,
  page_number int,
  confidence text not null check (confidence in ('high','medium','low')),
  origin text not null default 'record_extraction' check (origin in
    ('veteran_reported','record_extraction','rules_engine','ai_summary','representative_judgment')),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- CLAIM ISSUES + EVIDENCE
-- =========================================================================
create table claim_issues (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  condition_name text not null,
  category text not null check (category in
    ('original_direct','new_direct','secondary_causation','secondary_aggravation',
     'presumptive','toxic_exposure','increased_evaluation','previously_denied',
     'supplemental_claim_candidate','tdiu_indicator','smc_indicator',
     'professional_review_required')),
  claimed_theory text,
  symptom_onset_date date,
  current_severity text,
  functional_impact text,
  system_confidence text check (system_confidence in ('high','medium','low')),
  disposition text not null default 'pending' check (disposition in
    ('pending','accepted','rejected','modified','deferred','needs_more_info')),
  disposition_reason text,
  disposed_by uuid references auth.users(id),
  disposed_at timestamptz,
  authority_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_items (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references claim_issues(id) on delete cascade,
  element text not null check (element in
    ('current_diagnosis','in_service_event','nexus','existing_sc_condition',
     'causation','aggravation','presumptive_service','current_severity',
     'functional_impact','lay_evidence','contrary_evidence','missing_evidence')),
  status text not null check (status in
    ('present','partially_supported','missing','conflicting',
     'requires_medical_review','requires_representative_review','unable_to_determine')),
  source_document_id uuid references documents(id),
  source_fact_id uuid references extracted_facts(id),
  narrative text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- RULES ENGINE
-- =========================================================================
create table rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  authority text not null,
  citation text not null,
  source_url text,
  effective_date date not null,
  version int not null default 1,
  last_reviewed_date date,
  reviewer text,
  status text not null default 'active' check (status in ('active','archived')),
  logic jsonb not null
);

-- =========================================================================
-- TASKS
-- =========================================================================
create table development_tasks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  issue_id uuid references claim_issues(id),
  assigned_to uuid not null references auth.users(id),
  assigned_by uuid not null references auth.users(id),
  title text not null,
  instructions text,
  status text not null default 'assigned' check (status in
    ('assigned','in_progress','submitted','verified')),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- AUDIT LOG
-- =========================================================================
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references veteran_matters(id),
  actor_id uuid references auth.users(id),
  actor_role text,
  action text not null,
  target_table text,
  target_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create or replace function log_audit() returns trigger as $$
begin
  insert into audit_log (matter_id, actor_id, action, target_table, target_id, before, after)
  values (
    coalesce(new.matter_id, old.matter_id),
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op != 'INSERT' then to_jsonb(old) else null end,
    case when tg_op != 'DELETE' then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger audit_claim_issues after insert or update or delete on claim_issues
  for each row execute function log_audit();
create trigger audit_stage_history after insert on matter_stage_history
  for each row execute function log_audit();
create trigger audit_development_tasks after insert or update or delete on development_tasks
  for each row execute function log_audit();

-- evidence_items has no matter_id column of its own — it hangs off
-- claim_issues, which is where matter_id actually lives — so it needs
-- its own trigger function that looks the matter_id up via issue_id.
create or replace function log_audit_evidence() returns trigger as $$
declare
  v_matter_id uuid;
begin
  select matter_id into v_matter_id
  from claim_issues
  where id = coalesce(new.issue_id, old.issue_id);

  insert into audit_log (matter_id, actor_id, action, target_table, target_id, before, after)
  values (
    v_matter_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op != 'INSERT' then to_jsonb(old) else null end,
    case when tg_op != 'DELETE' then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger audit_evidence_items after insert or update or delete on evidence_items
  for each row execute function log_audit_evidence();

-- =========================================================================
-- ROW-LEVEL SECURITY
-- =========================================================================
alter table organizations enable row level security;
alter table org_members enable row level security;
alter table veteran_matters enable row level security;
alter table matter_stage_history enable row level security;
alter table service_periods enable row level security;
alter table deployments enable row level security;
alter table documents enable row level security;
alter table extracted_facts enable row level security;
alter table claim_issues enable row level security;
alter table evidence_items enable row level security;
alter table development_tasks enable row level security;
alter table audit_log enable row level security;
alter table rules enable row level security;

-- Staff (rep/supervisor/org_admin/state_admin/platform_admin) can see a
-- matter if it's in an org they're a member of, at or below their org node.
create or replace function is_staff_on_matter(m_org uuid) returns boolean as $$
  select exists (
    select 1 from org_members om
    where om.user_id = auth.uid()
      and m_org in (select org_descendants(om.organization_id))
      and om.role in ('platform_admin','org_admin','supervisor','representative','support_staff')
  );
$$ language sql stable security definer;

create policy "staff read matters in their org tree"
  on veteran_matters for select
  using (is_staff_on_matter(organization_id));

create policy "representative manages assigned matters"
  on veteran_matters for update
  using (primary_representative_id = auth.uid() or is_staff_on_matter(organization_id));

create policy "staff creates matters in their org"
  on veteran_matters for insert
  with check (is_staff_on_matter(organization_id));

create policy "veteran reads own matter"
  on veteran_matters for select
  using (veteran_user_id = auth.uid());

-- Same pattern applied to every matter-scoped child table: staff-on-matter
-- OR the veteran themself, resolved via the parent matter's org/veteran.
create policy "matter-scoped staff or veteran read: service_periods"
  on service_periods for select
  using (
    matter_id in (
      select id from veteran_matters
      where veteran_user_id = auth.uid() or is_staff_on_matter(organization_id)
    )
  );
create policy "veteran writes own service_periods"
  on service_periods for insert
  with check (
    matter_id in (select id from veteran_matters where veteran_user_id = auth.uid())
  );

create policy "matter-scoped staff or veteran read: deployments"
  on deployments for select
  using (
    matter_id in (
      select id from veteran_matters
      where veteran_user_id = auth.uid() or is_staff_on_matter(organization_id)
    )
  );
create policy "veteran writes own deployments"
  on deployments for insert
  with check (
    matter_id in (select id from veteran_matters where veteran_user_id = auth.uid())
  );

create policy "staff only: claim_issues"
  on claim_issues for all
  using (
    matter_id in (select id from veteran_matters where is_staff_on_matter(organization_id))
  );

create policy "staff only: evidence_items"
  on evidence_items for all
  using (
    issue_id in (
      select ci.id from claim_issues ci
      join veteran_matters vm on vm.id = ci.matter_id
      where is_staff_on_matter(vm.organization_id)
    )
  );

create policy "staff read documents in their org"
  on documents for select
  using (
    matter_id in (select id from veteran_matters where is_staff_on_matter(organization_id))
  );
create policy "veteran manages own documents"
  on documents for all
  using (matter_id in (select id from veteran_matters where veteran_user_id = auth.uid()));

create policy "staff read own org membership"
  on org_members for select
  using (user_id = auth.uid());

create policy "staff read their org tree"
  on organizations for select
  using (id in (select org_ancestors(om.organization_id) from org_members om where om.user_id = auth.uid())
      or id in (select org_descendants(om.organization_id) from org_members om where om.user_id = auth.uid()));

-- NOTE: state_admin gets its own, separate, narrower policy set against
-- rollup/materialized views only — deliberately NOT granted here against
-- base tables. Add those views + policies in the state-admin build pass,
-- never by loosening the policies above.
