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

  const { data: matter } = await supabase
    .from("veteran_matters")
    .select("id, display_name, stage")
    .eq("id", params.id)
    .single();

  const { data: issues } = await supabase
    .from("claim_issues")
    .select("id, condition_name, category, disposition, system_confidence")
    .eq("matter_id", params.id)
    .order("created_at", { ascending: true });

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
