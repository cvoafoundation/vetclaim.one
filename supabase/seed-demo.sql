-- VetClaim.one — synthetic demo case seed
-- Run in Supabase SQL Editor AFTER schema.sql, once.
-- Replace the two IDs below with your own org id and user id
-- (the same ones you used for your org_members insert).

do $$
declare
  v_org_id uuid := '515a778c-4ef9-47e6-9224-637a451e8482';
  v_user_id uuid := '70d9d150-1110-413f-8b45-1f72c445a83a';
  v_matter_id uuid;
  v_issue_tinnitus uuid;
  v_issue_sleep_apnea uuid;
  v_issue_ptsd uuid;
  v_issue_back uuid;
begin

  -- Fictional veteran matter, entirely synthetic.
  insert into veteran_matters
    (organization_id, primary_representative_id, created_by, display_name, stage)
  values
    (v_org_id, v_user_id, v_user_id, 'R. Alden', 'representative_review')
  returning id into v_matter_id;

  insert into matter_stage_history (matter_id, from_stage, to_stage, changed_by, reason)
  values (v_matter_id, null, 'representative_review', v_user_id, 'Synthetic demo case seeded');

  -- Multiple periods of service.
  insert into service_periods (matter_id, branch, entry_date, discharge_date, discharge_type, occupational_specialty)
  values
    (v_matter_id, 'Army', '2005-06-01', '2009-05-30', 'Honorable', '11B Infantryman'),
    (v_matter_id, 'Army National Guard', '2010-01-15', '2013-01-14', 'Honorable', '11B Infantryman');

  -- Afghanistan deployment with exposures.
  insert into deployments (matter_id, location, start_date, end_date, suspected_exposures)
  values (v_matter_id, 'Kandahar Province, Afghanistan', '2011-03-01', '2011-11-15',
          array['burn pits', 'IED blast exposure', 'sustained loud equipment noise']);

  -- ===== Issue 1: Tinnitus, secondary to existing SC hearing loss =====
  -- Missing nexus, conflicting onset date — matches the design mockup.
  insert into claim_issues
    (matter_id, condition_name, category, claimed_theory, symptom_onset_date,
     current_severity, system_confidence, disposition)
  values
    (v_matter_id, 'Tinnitus', 'secondary_causation',
     'Secondary to service-connected bilateral hearing loss (currently rated 10%).',
     '2011-06-01', 'Constant bilateral ringing', 'medium', 'pending')
  returning id into v_issue_tinnitus;

  insert into evidence_items (issue_id, element, status, narrative)
  values
    (v_issue_tinnitus, 'current_diagnosis', 'present', 'Diagnosed during 2022 audiology consult.'),
    (v_issue_tinnitus, 'existing_sc_condition', 'present', 'Hearing loss rated 10% since 2014.'),
    (v_issue_tinnitus, 'nexus', 'missing', 'No nexus opinion of record connecting tinnitus to rated hearing loss.'),
    (v_issue_tinnitus, 'lay_evidence', 'conflicting', 'Veteran statement gives onset as 2011; treatment note references onset "a few years ago" filed in 2016.');

  -- ===== Issue 2: Sleep apnea, presumptive / toxic-exposure theory =====
  insert into claim_issues
    (matter_id, condition_name, category, claimed_theory, symptom_onset_date,
     current_severity, system_confidence, disposition)
  values
    (v_matter_id, 'Obstructive sleep apnea', 'presumptive',
     'Possible presumptive condition under burn pit exposure provisions given documented Afghanistan service.',
     '2015-02-10', 'Moderate, uses CPAP nightly', 'medium', 'pending')
  returning id into v_issue_sleep_apnea;

  insert into evidence_items (issue_id, element, status, narrative)
  values
    (v_issue_sleep_apnea, 'current_diagnosis', 'present', 'Diagnosed via sleep study, 2016.'),
    (v_issue_sleep_apnea, 'presumptive_service', 'present', 'Qualifying Kandahar deployment with documented burn pit proximity.'),
    (v_issue_sleep_apnea, 'causation', 'requires_medical_review', 'Presumptive pathway available; direct causation not independently established.');

  -- ===== Issue 3: PTSD, increased-rating question =====
  insert into claim_issues
    (matter_id, condition_name, category, claimed_theory, symptom_onset_date,
     current_severity, functional_impact, system_confidence, disposition)
  values
    (v_matter_id, 'PTSD', 'increased_evaluation',
     'Currently rated 30%; veteran reports worsening symptoms since last examination.',
     '2012-01-01', 'Increased frequency of intrusive symptoms per veteran statement',
     'Reports difficulty maintaining employment in the past 12 months', 'medium', 'pending')
  returning id into v_issue_ptsd;

  insert into evidence_items (issue_id, element, status, narrative)
  values
    (v_issue_ptsd, 'current_severity', 'partially_supported', 'Veteran statement supports worsening; no recent C&P exam of record.'),
    (v_issue_ptsd, 'functional_impact', 'present', 'Veteran reports two missed-work incidents tied to symptoms in the past year.'),
    (v_issue_ptsd, 'missing_evidence', 'missing', 'Updated mental health treatment records not yet uploaded.');

  -- ===== Issue 4: Lower back condition, previously denied =====
  insert into claim_issues
    (matter_id, condition_name, category, claimed_theory, symptom_onset_date,
     current_severity, system_confidence, disposition)
  values
    (v_matter_id, 'Lumbar strain', 'previously_denied',
     'Denied in 2018 for insufficient evidence of in-service incurrence; new evidence may support a supplemental claim.',
     '2008-09-01', 'Chronic low back pain, flare-ups with prolonged standing', 'low', 'pending')
  returning id into v_issue_back;

  insert into evidence_items (issue_id, element, status, narrative)
  values
    (v_issue_back, 'contrary_evidence', 'present', '2018 rating decision cites no service treatment record documenting a back injury.'),
    (v_issue_back, 'in_service_event', 'requires_representative_review', 'Veteran statement describes a 2008 fall during ruck march; unit records not yet located.'),
    (v_issue_back, 'nexus', 'missing', 'No current nexus opinion connecting present symptoms to any in-service event.');

end $$;
