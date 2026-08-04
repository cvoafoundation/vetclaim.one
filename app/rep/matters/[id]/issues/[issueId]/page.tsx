import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ELEMENT_LABELS: Record<string, string> = {
  current_diagnosis: "Current diagnosis",
  in_service_event: "In-service event",
  nexus: "Nexus",
  existing_sc_condition: "Existing SC condition",
  causation: "Causation",
  aggravation: "Aggravation",
  presumptive_service: "Presumptive service",
  current_severity: "Current severity",
  functional_impact: "Functional impact",
  lay_evidence: "Lay evidence",
  contrary_evidence: "Contrary evidence",
  missing_evidence: "Missing evidence",
};

const STATUS_STYLE: Record<string, string> = {
  present: "text-status-present",
  partially_supported: "text-accent",
  missing: "text-status-missing",
  conflicting: "text-status-conflicting",
  requires_medical_review: "text-status-conflicting",
  requires_representative_review: "text-accent",
  unable_to_determine: "text-muted",
};

async function disposeIssue(formData: FormData) {
  "use server";

  const issueId = formData.get("issue_id") as string;
  const matterId = formData.get("matter_id") as string;
  const disposition = formData.get("disposition") as string;
  const reason = (formData.get("reason") as string) || null;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  // High-priority dispositions (reject / modify) require a reason —
  // enforced here as well as expected at the UI layer, since this is
  // the point that actually writes the audited change.
  if ((disposition === "rejected" || disposition === "modified") && !reason) {
    redirect(
      `/rep/matters/${matterId}/issues/${issueId}?error=reason_required`
    );
  }

  await supabase
    .from("claim_issues")
    .update({
      disposition,
      disposition_reason: reason,
      disposed_by: userData.user!.id,
      disposed_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  redirect(`/rep/matters/${matterId}`);
}

export default async function IssueDetail({
  params,
}: {
  params: { id: string; issueId: string };
}) {
  const supabase = createClient();

  const { data: issue } = await supabase
    .from("claim_issues")
    .select("*")
    .eq("id", params.issueId)
    .single();

  const { data: evidence } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("issue_id", params.issueId);

  if (!issue) {
    return (
      <main className="min-h-screen bg-paper px-6 py-10">
        <p className="text-sm text-muted">Issue not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-hairline">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href={`/rep/matters/${params.id}`}
            className="text-xs text-muted din uppercase tracking-wide"
          >
            &larr; case
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="din text-2xl">{issue.condition_name}</h1>
          <span className="text-xs text-accent din uppercase tracking-wide">
            {issue.category.replaceAll("_", " ")}
          </span>
        </div>
        {issue.claimed_theory && (
          <p className="text-sm text-muted mb-6">{issue.claimed_theory}</p>
        )}

        <p className="text-xs text-muted din uppercase tracking-wide mb-3">
          evidence by element
        </p>

        {!evidence || evidence.length === 0 ? (
          <p className="text-sm text-muted mb-8">No evidence recorded yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {evidence.map((e) => (
              <div key={e.id} className="border border-hairline p-3">
                <p className="text-[11px] text-muted din uppercase tracking-wide mb-1">
                  {ELEMENT_LABELS[e.element] ?? e.element}
                </p>
                <p
                  className={`text-sm din uppercase tracking-wide ${
                    STATUS_STYLE[e.status] ?? "text-muted"
                  }`}
                >
                  {e.status.replaceAll("_", " ")}
                </p>
                {e.narrative && (
                  <p className="text-xs text-muted mt-2">{e.narrative}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-hairline pt-6">
          <p className="text-xs text-muted din uppercase tracking-wide mb-3">
            representative disposition
          </p>
          <form action={disposeIssue} className="space-y-3">
            <input type="hidden" name="issue_id" value={issue.id} />
            <input type="hidden" name="matter_id" value={params.id} />

            <textarea
              name="reason"
              placeholder="Reason (required if rejecting or modifying)"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white h-20"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                name="disposition"
                value="accepted"
                className="border border-ink px-4 py-2 text-sm din uppercase tracking-wide"
              >
                Accept
              </button>
              <button
                type="submit"
                name="disposition"
                value="deferred"
                className="border border-hairline text-muted px-4 py-2 text-sm din uppercase tracking-wide"
              >
                Defer
              </button>
              <button
                type="submit"
                name="disposition"
                value="rejected"
                className="border border-hairline text-status-missing px-4 py-2 text-sm din uppercase tracking-wide"
              >
                Reject
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
