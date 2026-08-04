import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = createClient();

  const { data: matters } = await supabase
    .from("veteran_matters")
    .select("organization_id, stage, created_at");

  const { data: orgs } = await supabase.from("organizations").select("id, name");
  const orgNames = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  // Aggregate only — office, stage, month, count. Deliberately no
  // matter id, veteran name, or condition ever appears in this export,
  // matching the same isolation boundary as the on-screen drilldown.
  const counts: Record<string, number> = {};
  for (const m of matters ?? []) {
    const office = orgNames.get(m.organization_id) ?? "Unknown office";
    const month = new Date(m.created_at).toISOString().slice(0, 7);
    const key = `${month}|${office}|${m.stage}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const rows = [
    ["month", "office", "stage", "matter_count"],
    ...Object.entries(counts).map(([key, count]) => [
      ...key.split("|"),
      count,
    ]),
  ];

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vetclaim-statewide-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
