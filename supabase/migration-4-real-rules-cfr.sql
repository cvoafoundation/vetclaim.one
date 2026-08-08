-- Real rules built from the uploaded 38 CFR Part 4 (current as of 8/06/2026),
-- replacing the placeholder narrative text in the demo seed's claimed_theory
-- fields with actual cited rating criteria. Read and transcribed by hand
-- from the source PDF, not generated — this is exactly the kind of content
-- the plan says must never be left to an AI to invent.
--
-- IMPORTANT CAVEAT: 38 CFR Part 4 covers RATING PERCENTAGES ONLY. It does
-- NOT cover presumptive service connection (that's 38 CFR Part 3, e.g.
-- § 3.320 for PACT Act burn-pit presumptions). The sleep apnea rule below
-- can tell you how OSA is rated once service-connected — it cannot tell
-- you whether Kandahar service qualifies for presumptive service
-- connection in the first place. Upload 38 CFR Part 3 to close that gap.

insert into rules (rule_name, authority, citation, source_url, effective_date, version, last_reviewed_date, status, logic)
values
(
  'Tinnitus, recurrent — Diagnostic Code 6260',
  '38 U.S.C. 1155',
  '38 CFR § 4.87, Diagnostic Code 6260',
  'https://www.ecfr.gov/current/title-38/chapter-I/part-4/section-4.87',
  '2026-08-06',
  1,
  '2026-08-08',
  'active',
  '{
    "diagnostic_code": "6260",
    "single_rating_percent": 10,
    "notes": [
      "Assign only a single evaluation for recurrent tinnitus, whether perceived in one ear, both ears, or in the head — it does not double for bilateral tinnitus.",
      "A separate tinnitus evaluation may be combined with an evaluation under diagnostic codes 6100, 6200, 6204, or another code, except when tinnitus already supports an evaluation under one of those codes.",
      "Objective tinnitus (audible to other people, with a definable cause) is not rated under this code — it is evaluated as part of the underlying condition causing it."
    ]
  }'::jsonb
),
(
  'Sleep Apnea Syndromes (Obstructive, Central, Mixed) — Diagnostic Code 6847',
  '38 U.S.C. 1155',
  '38 CFR § 4.97, Diagnostic Code 6847',
  'https://www.ecfr.gov/current/title-38/chapter-I/part-4/section-4.97',
  '2026-08-06',
  1,
  '2026-08-08',
  'active',
  '{
    "diagnostic_code": "6847",
    "criteria": [
      {"rating": 100, "description": "Chronic respiratory failure with carbon dioxide retention or cor pulmonale, or requires tracheostomy"},
      {"rating": 50, "description": "Requires use of a breathing assistance device such as a CPAP machine"},
      {"rating": 30, "description": "Persistent day-time hypersomnolence"},
      {"rating": 0, "description": "Asymptomatic but with documented sleep-disorder breathing"}
    ],
    "caveat": "This rates severity once service-connected. It does NOT establish presumptive service connection for burn-pit or other toxic-exposure theories — that is 38 CFR Part 3, not Part 4, and is not yet loaded into this system."
  }'::jsonb
),
(
  'Posttraumatic Stress Disorder (PTSD) — Diagnostic Code 9411, General Rating Formula for Mental Disorders',
  '38 U.S.C. 1155',
  '38 CFR § 4.130, Diagnostic Code 9411',
  'https://www.ecfr.gov/current/title-38/chapter-I/part-4/section-4.130',
  '2026-08-06',
  1,
  '2026-08-08',
  'active',
  '{
    "diagnostic_code": "9411",
    "criteria": [
      {"rating": 100, "description": "Total occupational and social impairment — e.g. gross impairment in thought/communication, persistent delusions or hallucinations, grossly inappropriate behavior, persistent danger to self or others, disorientation to time or place"},
      {"rating": 70, "description": "Deficiencies in most areas (work, school, family relations, judgment, thinking, mood) — e.g. suicidal ideation, near-continuous panic or depression, impaired impulse control, neglect of personal hygiene, inability to establish/maintain relationships"},
      {"rating": 50, "description": "Reduced reliability and productivity — e.g. flattened affect, panic attacks more than once a week, impaired judgment and abstract thinking, difficulty maintaining effective work and social relationships"},
      {"rating": 30, "description": "Occasional decrease in work efficiency and intermittent periods of inability to perform occupational tasks — e.g. depressed mood, weekly or less frequent panic attacks, chronic sleep impairment, mild memory loss"},
      {"rating": 10, "description": "Mild or transient symptoms that decrease work efficiency only during periods of significant stress, or symptoms controlled by continuous medication"},
      {"rating": 0, "description": "Formally diagnosed, but symptoms not severe enough to interfere with occupational/social functioning or to require medication"}
    ]
  }'::jsonb
),
(
  'Lumbar strain (Lumbosacral or cervical strain) — Diagnostic Code 5237, General Rating Formula for Diseases and Injuries of the Spine',
  '38 U.S.C. 1155',
  '38 CFR § 4.71a, Diagnostic Code 5237',
  'https://www.ecfr.gov/current/title-38/chapter-I/part-4/section-4.71a',
  '2026-08-06',
  1,
  '2026-08-08',
  'active',
  '{
    "diagnostic_code": "5237",
    "criteria": [
      {"rating": 100, "description": "Unfavorable ankylosis of the entire spine"},
      {"rating": 50, "description": "Unfavorable ankylosis of the entire thoracolumbar spine"},
      {"rating": 40, "description": "Unfavorable ankylosis of the entire cervical spine; or forward flexion of the thoracolumbar spine 30 degrees or less; or favorable ankylosis of the entire thoracolumbar spine"},
      {"rating": 30, "description": "Forward flexion of the cervical spine 15 degrees or less; or favorable ankylosis of the entire cervical spine"},
      {"rating": 20, "description": "Forward flexion of the thoracolumbar spine 30-60 degrees; or forward flexion of the cervical spine 15-30 degrees; or muscle spasm/guarding severe enough to cause abnormal gait or spinal contour"},
      {"rating": 10, "description": "Forward flexion of the thoracolumbar spine 60-85 degrees; or forward flexion of the cervical spine 30-40 degrees; or muscle spasm, guarding, or localized tenderness without abnormal gait or contour; or vertebral body fracture with 50%+ loss of height"}
    ],
    "notes": [
      "Associated neurologic abnormalities (e.g. bowel or bladder impairment) are rated separately under the appropriate diagnostic code, not folded into this rating.",
      "Round each range-of-motion measurement to the nearest five degrees."
    ]
  }'::jsonb
);
