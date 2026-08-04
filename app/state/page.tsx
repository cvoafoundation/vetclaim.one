import { createClient } from "@/lib/supabase/server";

export default async function StateAdminDashboard() {
  const supabase = createClient();

  const { data: matters } = await supabase
    .from("veteran_matters")
    .select("stage, organization_id");

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, org_type, name");

  const totalMatters = matters?.length ?? 0;
  const totalOrgs = orgs?.length ?? 0;

  const byStage: Record<string, number> = {};
  for (const m of matters ?? []) {
    byStage[m.stage] = (byStage[m.stage] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">
          state administration
        </p>
        <h1 className="din text-3xl mb-2">Statewide overview</h1>
        <p className="text-sm text-muted mb-8 max-w-xl">
          Stub view for the MVP slice &mdash; aggregate counts only. The
          real build serves this from rollup views with a separate, narrower
          RLS policy set so state admins never reach individual matter or
          medical data, even by accident.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-hairline p-5">
            <p className="text-xs text-muted din uppercase tracking-wide mb-1">
              participating offices
            </p>
            <p className="din text-3xl">{totalOrgs}</p>
          </div>
          <div className="border border-hairline p-5">
            <p className="text-xs text-muted din uppercase tracking-wide mb-1">
              matters statewide
            </p>
            <p className="din text-3xl">{totalMatters}</p>
          </div>
          <div className="border border-hairline p-5">
            <p className="text-xs text-muted din uppercase tracking-wide mb-1">
              stages represented
            </p>
            <p className="din text-3xl">{Object.keys(byStage).length}</p>
          </div>
        </div>

        <p className="text-xs text-muted din uppercase tracking-wide mb-3">
          matters by stage
        </p>
        {Object.keys(byStage).length === 0 ? (
          <p className="text-sm text-muted">No matters yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(byStage).map(([stage, count]) => (
                <tr key={stage} className="border-b border-hairline">
                  <td className="py-2 text-accent din uppercase tracking-wide text-xs">
                    {stage.replaceAll("_", " ")}
                  </td>
                  <td className="py-2 text-right w-16">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
