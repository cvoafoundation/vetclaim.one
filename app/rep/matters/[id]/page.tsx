import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORY_LABELS: Record<string, string> = {
  original_direct: "Original direct claim",
  new_direct: "New direct claim",
  secondary_causation: "Secondary causation",
  secondary_aggravation: "Secondary aggravation",
  presumptive: "Presumptive condition",
  toxic_exposure: "Toxic-exposure theory",
  increased_evaluation: "Increased evaluation",
  previously_denied: "Previously denied condition",
  supplemental_claim_candidate: "Supplemental claim candidate",
  tdiu_indicator: "TDIU indicator",
  smc_indicator: "SMC indicator",
  professional_review_required: "Professional review required",
};

const DISPOSITION_STYLE: Record<string, string> = {
  pending: "text-accent",
  accepted: "text-status-present",
  rejected: "text-status-missing",
  modified: "text-accent",
  deferred: "text-muted",
  needs_more_info: "text-status-conflicting",
};

export default async function MatterDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [
    { data: matter },
    { data: issues },
    { data: periods },
    { data: deploys },
    { data: conditions },
    { data: ratings },
    { data: denials },
    { data: providers },
  ] = await Promise.all([
    supabase.from("veteran_matters").select("id, display_name, stage").eq("id", params.id).single(),
    supabase
      .from("claim_issues")
      .select("id, condition_name, category, disposition, system_confidence")
      .eq("matter_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("service_periods")
      .select("branch, entry_date, discharge_date, discharge_type, occupational_specialty")
      .eq("matter_id", params.id),
    supabase.from("deployments").select("location, start_date, end_date, suspected_exposures").eq("matter_id", params.id),
    supabase.from("conditions").select("condition_name, symptoms, onset_date, still_experiencing").eq("matter_id", params.id),
    supabase.from("existing_ratings").select("condition_name, percentage, effective_date").eq("matter_id", params.id),
    supabase.from("prior_denials").select("condition_name, decision_date, reason").eq("matter_id", params.id),
    supabase.from("providers").select("provider_name, provider_type, location").eq("matter_id", params.id),
  ]);

  if (!matter) {
    return (
      <main className="min-h-screen bg-paper px-6 py-10">
        <p className="text-sm text-muted">Matter not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-hairline">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/rep" className="text-xs text-muted din uppercase tracking-wide">
            &larr; caseload
          </Link>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <p className="case-id mb-1">
                CASE-{matter.id.slice(0, 6).toUpperCase()}
              </p>
              <h1 className="din text-2xl">{matter.display_name}</h1>
            </div>
            <span className="border border-hairline px-2 py-0.5 text-[11px] text-accent din uppercase tracking-wide">
              {matter.stage.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-xs text-muted din uppercase tracking-wide mb-3">
          intake overview
        </p>
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="border border-hairline p-3">
            <p className="text-[11px] text-muted din uppercase tracking-wide mb-1.5">
              service history
            </p>
            {!periods || periods.length === 0 ? (
              <p className="text-xs text-muted">Not yet provided.</p>
            ) : (
              <ul className="text-sm space-y-0.5">
                {periods.map((p, i) => (
                  <li key={i}>
                    {p.branch} ({p.entry_date} &ndash; {p.discharge_date ?? "present"})
                    {p.occupational_specialty ? ` \u2014 ${p.occupational_specialty}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-hairline p-3">
            <p className="text-[11px] text-muted din uppercase tracking-wide mb-1.5">
              deployments
            </p>
            {!deploys || deploys.length === 0 ? (
              <p className="text-xs text-muted">Not yet provided.</p>
            ) : (
              <ul className="text-sm space-y-0.5">
                {deploys.map((d, i) => (
                  <li key={i}>
                    {d.location} ({d.start_date ?? "?"} &ndash; {d.end_date ?? "?"})
                    {d.suspected_exposures && d.suspected_exposures.length > 0
                      ? ` \u2014 ${d.suspected_exposures.join(", ")}`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-hairline p-3">
            <p className="text-[11px] text-muted din uppercase tracking-wide mb-1.5">
              current conditions
            </p>
            {!conditions || conditions.length === 0 ? (
              <p className="text-xs text-muted">Not yet provided.</p>
            ) : (
              <ul className="text-sm space-y-0.5">
                {conditions.map((c, i) => (
                  <li key={i}>
                    {c.condition_name}
                    {c.onset_date ? ` (since ${c.onset_date})` : ""}
                    {!c.still_experiencing ? " \u2014 resolved" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-hairline p-3">
            <p className="text-[11px] text-muted din uppercase tracking-wide mb-1.5">
              existing ratings
            </p>
            {!ratings || ratings.length === 0 ? (
              <p className="text-xs text-muted">None on record.</p>
            ) : (
              <ul className="text-sm space-y-0.5">
                {ratings.map((r, i) => (
                  <li key={i}>
                    {r.condition_name} &mdash; {r.percentage ?? "?"}%
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-hairline p-3">
            <p className="text-[11px] text-muted din uppercase tracking-wide mb-1.5">
              prior denials
            </p>
            {!denials || denials.length === 0 ? (
              <p className="text-xs text-muted">None on record.</p>
            ) : (
              <ul className="text-sm space-y-0.5">
                {denials.map((d, i) => (
                  <li key={i} className="text-status-missing">
                    {d.condition_name}
                    {d.decision_date ? ` (${d.decision_date})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-hairline p-3">
            <p className="text-[11px] text-muted din uppercase tracking-wide mb-1.5">
              providers
            </p>
            {!providers || providers.length === 0 ? (
              <p className="text-xs text-muted">Not yet provided.</p>
            ) : (
              <ul className="text-sm space-y-0.5">
                {providers.map((p, i) => (
                  <li key={i}>
                    {p.provider_name}
                    {p.provider_type ? ` \u2014 ${p.provider_type}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="text-xs text-muted din uppercase tracking-wide mb-3">
          potential issues &mdash; {issues?.length ?? 0}
        </p>

        {!issues || issues.length === 0 ? (
          <p className="text-sm text-muted">
            No issues identified yet. Issues appear here once the rules
            engine has run against verified intake and documents.
          </p>
        ) : (
          <div className="border border-hairline divide-y divide-hairline">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/rep/matters/${matter.id}/issues/${issue.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent-light block"
              >
                <div>
                  <p className="text-sm">{issue.condition_name}</p>
                  <p className="text-xs text-muted din uppercase tracking-wide mt-0.5">
                    {CATEGORY_LABELS[issue.category] ?? issue.category}
                  </p>
                </div>
                <span
                  className={`text-[11px] din uppercase tracking-wide ${
                    DISPOSITION_STYLE[issue.disposition] ?? "text-muted"
                  }`}
                >
                  {issue.disposition.replaceAll("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
