import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = createClient();

  // RLS scopes this to the signed-in representative's own caseload —
  // this export is allowed to be case-level because the person pulling
  // it already has access to every row in it.
  const { data: matters } = await supabase
    .from("veteran_matters")
    .select("id, display_name, stage, created_at")
    .order("created_at", { ascending: false });

  const rows = [
    ["case_id", "veteran_name", "stage", "created_at", "created_month"],
    ...(matters ?? []).map((m) => [
      `CASE-${m.id.slice(0, 6).toUpperCase()}`,
      m.display_name,
      m.stage,
      m.created_at,
      new Date(m.created_at).toISOString().slice(0, 7),
    ]),
  ];

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vetclaim-caseload-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
