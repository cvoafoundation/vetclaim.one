import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StageDrilldown({
  params,
}: {
  params: { stage: string };
}) {
  const supabase = createClient();

  const [{ data: matters }, { data: orgs }] = await Promise.all([
    supabase
      .from("veteran_matters")
      .select("organization_id")
      .eq("stage", params.stage),
    supabase.from("organizations").select("id, name"),
  ]);

  const orgNames = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  const byOrg: Record<string, number> = {};
  for (const m of matters ?? []) {
    const name = orgNames.get(m.organization_id) ?? "Unknown office";
    byOrg[name] = (byOrg[name] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/state" className="text-xs text-muted din uppercase tracking-wide">
          &larr; statewide overview
        </Link>
        <h1 className="din text-2xl mt-2 mb-2">
          {params.stage.replaceAll("_", " ")}
        </h1>
        <p className="text-sm text-muted mb-8 max-w-lg">
          Breakdown by office only &mdash; this is as far down as the state
          admin view goes. No veteran names, condition names, or case
          content are ever exposed at this level, by design.
        </p>

        {Object.keys(byOrg).length === 0 ? (
          <p className="text-sm text-muted">No matters at this stage.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(byOrg).map(([name, count]) => (
                <tr key={name} className="border-b border-hairline">
                  <td className="py-2 din uppercase tracking-wide text-xs">
                    {name}
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
