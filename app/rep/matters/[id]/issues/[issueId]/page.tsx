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

// Plain-language translation of each category — written for the
// conversation happening across the desk with the veteran, not for
// the case file. This is the thing that makes the screen useful to
// both people looking at it, not just the rep.
const CATEGORY_PLAIN_LANGUAGE: Record<string, string> = {
  original_direct:
    "This would be a new claim, connected directly to something that happened in service.",
  new_direct:
    "This would be a new claim, connected directly to something that happened in service.",
  secondary_causation:
    "This condition may have been caused by a condition you're already service-connected for. That link has to be documented before it can be claimed on its own.",
  secondary_aggravation:
    "A condition you already have may have been made worse by something service-connected. The claim is for the worsening, not the whole condition.",
  presumptive:
    "Because of where and when you served, VA may assume this condition is related to service without you having to prove it directly \u2014 if the service dates and location qualify.",
  toxic_exposure:
    "This may qualify under exposure-related provisions based on where you served. That depends on matching your service record to the qualifying criteria.",
  increased_evaluation:
    "You're already rated for this. This is about whether it's gotten worse since your last rating and whether the current percentage still reflects that.",
  previously_denied:
    "VA said no to this before. This is about whether there's new evidence now that addresses the specific reason it was denied.",
  supplemental_claim_candidate:
    "There may be a path to reopen this with new evidence VA hasn't seen yet.",
  tdiu_indicator:
    "This may affect your ability to work. That's a separate, more involved determination \u2014 flagged here for a full professional review, not decided by this screen.",
  smc_indicator:
    "This may qualify for additional compensation beyond standard ratings \u2014 flagged for a full professional review, not decided by this screen.",
  professional_review_required:
    "This needs a full professional review before anything is decided.",
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

async function requestFromVeteran(formData: FormData) {
  "use server";

  const issueId = formData.get("issue_id") as string;
  const matterId = formData.get("matter_id") as string;
  const veteranUserId = formData.get("veteran_user_id") as string;
  const title = formData.get("title") as string;
  const instructions = formData.get("instructions") as string;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  if (!veteranUserId) {
    // No veteran account linked yet in this demo matter — nothing to
    // assign to. In the real flow this can't happen once the intake
    // invitation has been accepted.
    redirect(
      `/rep/matters/${matterId}/issues/${issueId}?error=no_veteran_linked`
    );
  }

  await supabase.from("development_tasks").insert({
    matter_id: matterId,
    issue_id: issueId,
    assigned_to: veteranUserId,
    assigned_by: userData.user!.id,
    title,
    instructions,
    status: "assigned",
  });

  redirect(`/rep/matters/${matterId}/issues/${issueId}`);
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

  const { data: matter } = await supabase
    .from("veteran_matters")
    .select("id, veteran_user_id, display_name")
    .eq("id", params.id)
    .single();

  const { data: existingTasks } = await supabase
    .from("development_tasks")
    .select("id, title, status, created_at")
    .eq("issue_id", params.issueId)
    .order("created_at", { ascending: false });

  if (!issue) {
    return (
      <main className="min-h-screen bg-paper px-6 py-10">
        <p className="text-sm text-muted">Issue not found.</p>
      </main>
    );
  }

  const needsFollowUp = (evidence ?? []).filter((e) =>
    ["missing", "conflicting", "requires_representative_review"].includes(
      e.status
    )
  );

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
          <p className="text-sm text-muted mb-3">{issue.claimed_theory}</p>
        )}

        {/* Plain-language translation — read this to the veteran. */}
        <div className="bg-accent-light border border-hairline px-4 py-3 mb-6">
          <p className="text-[11px] text-accent din uppercase tracking-wide mb-1">
            in plain terms
          </p>
          <p className="text-sm">
            {CATEGORY_PLAIN_LANGUAGE[issue.category] ??
              "This issue needs representative review before anything is decided."}
          </p>
        </div>

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

        {needsFollowUp.length > 0 && (
          <div className="border-t border-hairline pt-6 mb-8">
            <p className="text-xs text-muted din uppercase tracking-wide mb-3">
              needs follow-up from the veteran
            </p>
            <div className="space-y-3">
              {needsFollowUp.map((e) => (
                <form
                  key={e.id}
                  action={requestFromVeteran}
                  className="border border-hairline p-3 flex items-center justify-between gap-4"
                >
                  <input type="hidden" name="issue_id" value={issue.id} />
                  <input type="hidden" name="matter_id" value={params.id} />
                  <input
                    type="hidden"
                    name="veteran_user_id"
                    value={matter?.veteran_user_id ?? ""}
                  />
                  <input
                    type="hidden"
                    name="title"
                    value={`Follow-up needed: ${
                      ELEMENT_LABELS[e.element] ?? e.element
                    } — ${issue.condition_name}`}
                  />
                  <input
                    type="hidden"
                    name="instructions"
                    value={
                      e.narrative ??
                      `Additional information needed for ${ELEMENT_LABELS[e.element] ?? e.element}.`
                    }
                  />
                  <p className="text-sm">
                    {ELEMENT_LABELS[e.element] ?? e.element}
                    <span className="text-xs text-muted ml-2">
                      {e.status.replaceAll("_", " ")}
                    </span>
                  </p>
                  <button
                    type="submit"
                    className="border border-ink px-3 py-1.5 text-xs din uppercase tracking-wide whitespace-nowrap"
                  >
                    request from veteran
                  </button>
                </form>
              ))}
            </div>
            {!matter?.veteran_user_id && (
              <p className="text-xs text-status-conflicting mt-2">
                No veteran account is linked to this matter yet, so requests
                can't be assigned. Nothing will save until it is.
              </p>
            )}
          </div>
        )}

        {existingTasks && existingTasks.length > 0 && (
          <div className="border-t border-hairline pt-6 mb-8">
            <p className="text-xs text-muted din uppercase tracking-wide mb-3">
              requested from veteran
            </p>
            <div className="border border-hairline divide-y divide-hairline">
              {existingTasks.map((t) => (
                <div
                  key={t.id}
                  className="px-4 py-2 flex items-center justify-between text-sm"
                >
                  <span>{t.title}</span>
                  <span className="text-xs text-accent din uppercase tracking-wide">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
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
