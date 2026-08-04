import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  { label: "Service history", table: "service_periods", href: "/veteran/intake/service" },
  { label: "Deployments and exposures", table: "deployments", href: "/veteran/intake/deployments" },
  { label: "Current conditions", table: "conditions", href: "/veteran/intake/conditions" },
  { label: "Existing VA ratings", table: "existing_ratings", href: "/veteran/intake/ratings" },
  { label: "Previous claims and denials", table: "prior_denials", href: "/veteran/intake/denials" },
  { label: "Medical providers", table: "providers", href: "/veteran/intake/providers" },
];

export default async function VeteranHome() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const [{ data: matter }, { data: tasks }] = userData.user
    ? await Promise.all([
        supabase
          .from("veteran_matters")
          .select("id, display_name, stage")
          .eq("veteran_user_id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("development_tasks")
          .select("id, title, instructions, status")
          .eq("assigned_to", userData.user.id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }];

  // Real progress, not a hardcoded guess — one count query per step
  // table, run together rather than one at a time.
  const stepCounts = matter
    ? await Promise.all(
        STEPS.map((s) =>
          supabase
            .from(s.table)
            .select("id", { count: "exact", head: true })
            .eq("matter_id", matter.id)
        )
      )
    : [];

  const intakeCertified = matter
    ? !["intake_invited", "intake_in_progress"].includes(matter.stage)
    : false;

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">
          veteran portal
        </p>
        <h1 className="din text-3xl mb-6">Welcome</h1>

        {!matter ? (
          <div className="border border-hairline p-6">
            <p className="text-sm text-muted mb-2">
              No matter is linked to this account yet.
            </p>
            <p className="text-sm text-muted">
              This is the veteran-facing shell &mdash; in the real workflow,
              a veteran lands here after accepting an intake invitation from
              their representative, and sees exactly one thing: how far
              along they are.
            </p>
          </div>
        ) : (
          <>
            <div className="border border-hairline p-6 mb-6">
              <p className="case-id mb-1">
                CASE-{matter.id.slice(0, 6).toUpperCase()}
              </p>
              <p className="text-sm text-muted">
                Current stage &mdash;{" "}
                <span className="text-accent din uppercase tracking-wide text-xs">
                  {matter.stage.replaceAll("_", " ")}
                </span>
              </p>
            </div>

            <p className="text-sm text-muted mb-3">
              Your intake, step by step:
            </p>
            <ol className="border border-hairline divide-y divide-hairline">
              {STEPS.map((step, i) => {
                const count = stepCounts[i]?.count ?? 0;
                const status = intakeCertified
                  ? "complete"
                  : count > 0
                  ? "in progress"
                  : "not started";
                return (
                  <li key={step.label} className="flex items-center justify-between px-4 py-3 text-sm">
                    <Link href={step.href} className="hover:text-accent">
                      <span className="text-muted mr-2">{i + 1}.</span>
                      {step.label}
                      {count > 0 && (
                        <span className="text-muted text-xs ml-2">
                          ({count})
                        </span>
                      )}
                    </Link>
                    <span
                      className={`text-xs din uppercase tracking-wide ${
                        status === "complete"
                          ? "text-status-present"
                          : status === "in progress"
                          ? "text-accent"
                          : "text-muted"
                      }`}
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ol>

            {!intakeCertified && (
              <Link
                href="/veteran/intake/review"
                className="block w-full text-center border border-ink py-2.5 text-sm mt-4 din uppercase tracking-wide"
              >
                Review and certify when ready
              </Link>
            )}

            {tasks && tasks.length > 0 && (
              <>
                <p className="text-sm text-muted mb-3 mt-8">
                  Your office has asked for a few more things:
                </p>
                <div className="border border-hairline divide-y divide-hairline">
                  {tasks.map((t) => (
                    <div key={t.id} className="px-4 py-3">
                      <p className="text-sm">{t.title}</p>
                      {t.instructions && (
                        <p className="text-xs text-muted mt-1">
                          {t.instructions}
                        </p>
                      )}
                      <span className="text-xs text-accent din uppercase tracking-wide mt-2 inline-block">
                        {t.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
