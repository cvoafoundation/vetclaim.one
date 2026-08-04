import { createClient } from "@/lib/supabase/server";

const STEP_LABELS = [
  "Service history",
  "Deployments and exposures",
  "Current conditions",
  "Existing VA ratings",
  "Previous claims and denials",
  "Medical providers",
];

export default async function VeteranHome() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id, display_name, stage")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: tasks } = userData.user
    ? await supabase
        .from("development_tasks")
        .select("id, title, instructions, status")
        .eq("assigned_to", userData.user.id)
        .order("created_at", { ascending: false })
    : { data: null };

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
              {STEP_LABELS.map((label, i) => (
                <li
                  key={label}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span>
                    <span className="text-muted mr-2">{i + 1}.</span>
                    {label}
                  </span>
                  {i === 0 ? (
                    <span className="text-xs text-accent din uppercase tracking-wide">
                      in progress
                    </span>
                  ) : (
                    <span className="text-xs text-muted din uppercase tracking-wide">
                      not started
                    </span>
                  )}
                </li>
              ))}
            </ol>

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
