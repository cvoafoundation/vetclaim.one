import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STAGE_LABELS: Record<string, string> = {
  intake_invited: "Intake invited",
  intake_in_progress: "Intake in progress",
  records_needed: "Records needed",
  under_analysis: "Under analysis",
  representative_review: "Representative review",
  veteran_action_required: "Veteran action required",
  development_in_progress: "Development in progress",
  ready_for_final_review: "Ready for final review",
  claim_ready: "Claim ready",
  submitted_externally: "Submitted externally",
  va_development: "VA development",
  decision_received: "Decision received",
  decision_review: "Decision review",
  closed: "Closed",
};

export default async function RepDashboard() {
  const supabase = createClient();

  // RLS scopes this to matters the signed-in representative is assigned
  // to, or that fall under their org — no explicit filter needed here.
  const { data: matters } = await supabase
    .from("veteran_matters")
    .select("id, display_name, stage, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-hairline">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-sm">VETCLAIM.ONE</span>
          <Link
            href="/rep/matters/new"
            className="bg-ink text-paper px-4 py-2 text-sm"
          >
            Create matter
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-6">Your caseload</h1>

        {!matters || matters.length === 0 ? (
          <div className="border border-hairline p-10 text-center">
            <p className="text-muted mb-4">No matters yet.</p>
            <Link
              href="/rep/matters/new"
              className="text-sm text-accent underline"
            >
              Create your first matter
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="py-2 font-normal">Case</th>
                <th className="py-2 font-normal">Veteran</th>
                <th className="py-2 font-normal">Stage</th>
                <th className="py-2 font-normal">Created</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-hairline hover:bg-accent-light cursor-pointer"
                >
                  <td className="py-3">
                    <span className="case-id">
                      CASE-{m.id.slice(0, 6).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 font-serif">{m.display_name}</td>
                  <td className="py-3">
                    <span className="border border-hairline px-2 py-0.5 text-xs font-mono text-accent">
                      {STAGE_LABELS[m.stage] ?? m.stage}
                    </span>
                  </td>
                  <td className="py-3 text-muted font-mono text-xs">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
