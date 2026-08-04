-- Run this once in the Supabase SQL Editor on top of the existing schema.
-- Adds the remaining veteran-intake tables: conditions, existing ratings,
-- prior denials, providers — same tenancy/RLS pattern as service_periods
-- and deployments.

create table conditions (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  condition_name text not null,
  symptoms text,
  onset_date date,
  still_experiencing boolean not null default true,
  created_at timestamptz not null default now()
);

create table existing_ratings (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  condition_name text not null,
  percentage int,
  effective_date date,
  created_at timestamptz not null default now()
);

create table prior_denials (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  condition_name text not null,
  decision_date date,
  reason text,
  created_at timestamptz not null default now()
);

create table providers (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references veteran_matters(id) on delete cascade,
  provider_name text not null,
  provider_type text,
  location text,
  treatment_start date,
  treatment_end date,
  created_at timestamptz not null default now()
);

alter table conditions enable row level security;
alter table existing_ratings enable row level security;
alter table prior_denials enable row level security;
alter table providers enable row level security;

create policy "matter-scoped staff or veteran read: conditions"
  on conditions for select
  using (
    matter_id in (
      select id from veteran_matters
      where veteran_user_id = auth.uid() or is_staff_on_matter(organization_id)
    )
  );
create policy "veteran writes own conditions"
  on conditions for insert
  with check (matter_id in (select id from veteran_matters where veteran_user_id = auth.uid()));

create policy "matter-scoped staff or veteran read: existing_ratings"
  on existing_ratings for select
  using (
    matter_id in (
      select id from veteran_matters
      where veteran_user_id = auth.uid() or is_staff_on_matter(organization_id)
    )
  );
create policy "veteran writes own existing_ratings"
  on existing_ratings for insert
  with check (matter_id in (select id from veteran_matters where veteran_user_id = auth.uid()));

create policy "matter-scoped staff or veteran read: prior_denials"
  on prior_denials for select
  using (
    matter_id in (
      select id from veteran_matters
      where veteran_user_id = auth.uid() or is_staff_on_matter(organization_id)
    )
  );
create policy "veteran writes own prior_denials"
  on prior_denials for insert
  with check (matter_id in (select id from veteran_matters where veteran_user_id = auth.uid()));

create policy "matter-scoped staff or veteran read: providers"
  on providers for select
  using (
    matter_id in (
      select id from veteran_matters
      where veteran_user_id = auth.uid() or is_staff_on_matter(organization_id)
    )
  );
create policy "veteran writes own providers"
  on providers for insert
  with check (matter_id in (select id from veteran_matters where veteran_user_id = auth.uid()));
