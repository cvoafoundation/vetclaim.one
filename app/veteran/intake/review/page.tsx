import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function certify(formData: FormData) {
  "use server";

  const matterId = formData.get("matter_id") as string;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: matter } = await supabase
    .from("veteran_matters")
    .select("stage")
    .eq("id", matterId)
    .single();

  await supabase
    .from("veteran_matters")
    .update({ stage: "records_needed" })
    .eq("id", matterId);

  await supabase.from("matter_stage_history").insert({
    matter_id: matterId,
    from_stage: matter?.stage ?? null,
    to_stage: "records_needed",
    changed_by: userData.user!.id,
    reason: "Veteran certified intake as complete",
  });

  redirect("/veteran");
}

export default async function ReviewStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id, display_name")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  if (!matter) {
    return (
      <main className="min-h-screen bg-paper px-6 py-10">
        <p className="text-sm text-muted max-w-lg mx-auto">
          No matter is linked to this account yet.
        </p>
      </main>
    );
  }

  const [
    { data: periods },
    { data: deploys },
    { data: conditions },
    { data: ratings },
    { data: denials },
    { data: providers },
  ] = await Promise.all([
    supabase.from("service_periods").select("branch, entry_date, discharge_date").eq("matter_id", matter.id),
    supabase.from("deployments").select("location").eq("matter_id", matter.id),
    supabase.from("conditions").select("condition_name").eq("matter_id", matter.id),
    supabase.from("existing_ratings").select("condition_name, percentage").eq("matter_id", matter.id),
    supabase.from("prior_denials").select("condition_name").eq("matter_id", matter.id),
    supabase.from("providers").select("provider_name").eq("matter_id", matter.id),
  ]);

  const sections = [
    {
      label: "Service history",
      items: (periods ?? []).map(
        (p) => `${p.branch} (${p.entry_date} \u2013 ${p.discharge_date ?? "present"})`
      ),
    },
    { label: "Deployments", items: (deploys ?? []).map((d) => d.location) },
    { label: "Current conditions", items: (conditions ?? []).map((c) => c.condition_name) },
    {
      label: "Existing ratings",
      items: (ratings ?? []).map((r) => `${r.condition_name} \u2014 ${r.percentage ?? "?"}%`),
    },
    { label: "Prior denials", items: (denials ?? []).map((d) => d.condition_name) },
    { label: "Providers", items: (providers ?? []).map((p) => p.provider_name) },
  ];

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">
          step 7 &mdash; last one
        </p>
        <h1 className="din text-3xl mb-2">Review and certify</h1>
        <p className="text-muted text-sm mb-6">
          Here's everything you've told us. Check it over &mdash; your
          representative will follow up on anything that needs more detail.
        </p>

        <div className="border border-hairline divide-y divide-hairline mb-6">
          {sections.map((s) => (
            <div key={s.label} className="px-4 py-3">
              <p className="text-xs text-muted din uppercase tracking-wide mb-1.5">
                {s.label}
              </p>
              {s.items.length === 0 ? (
                <p className="text-sm text-muted">Nothing added.</p>
              ) : (
                <ul className="text-sm space-y-0.5">
                  {s.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <form action={certify}>
          <input type="hidden" name="matter_id" value={matter.id} />
          <label className="flex items-start gap-2 text-sm text-muted mb-4">
            <input type="checkbox" required className="mt-0.5" />
            I confirm this information is accurate to the best of my
            knowledge.
          </label>
          <button
            type="submit"
            className="w-full bg-ink text-paper py-2.5 text-sm din uppercase tracking-wide"
          >
            Certify and submit to my representative
          </button>
        </form>
      </div>
    </main>
  );
}
