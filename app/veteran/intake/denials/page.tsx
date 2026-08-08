import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IntakeProgress from "@/components/IntakeProgress";

async function saveDenial(formData: FormData) {
  "use server";

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: matter } = await supabase
    .from("veteran_matters")
    .select("id")
    .eq("veteran_user_id", userData.user!.id)
    .single();

  if (!matter) redirect("/sign-in");

  await supabase.from("prior_denials").insert({
    matter_id: matter.id,
    condition_name: formData.get("condition_name") as string,
    decision_date: (formData.get("decision_date") as string) || null,
    reason: (formData.get("reason") as string) || null,
  });

  redirect("/veteran/intake/denials");
}

async function deleteDenial(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  await supabase.from("prior_denials").delete().eq("id", formData.get("id") as string);
  redirect("/veteran/intake/denials");
}

export default async function DenialsStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: denials } = matter
    ? await supabase
        .from("prior_denials")
        .select("id, condition_name, decision_date, reason")
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <IntakeProgress step={5} />
        <h1 className="din text-3xl mb-2">Previous claims and denials</h1>
        <p className="text-muted text-sm mb-6">
          Add anything VA has said no to before. This helps us figure out if
          new evidence could change that. If nothing's ever been denied,
          just continue.
        </p>

        {denials && denials.length > 0 && (
          <div className="border border-hairline divide-y divide-hairline mb-6">
            {denials.map((d) => (
              <div key={d.id} className="px-4 py-3 text-sm flex items-start justify-between gap-3">
                <div>
                  <p className="din uppercase tracking-wide text-xs text-status-missing mb-1">
                    {d.condition_name}
                  </p>
                  <p className="text-muted text-xs">
                    {d.decision_date ? `Denied ${d.decision_date}` : "Date not given"}
                  </p>
                  {d.reason && <p className="text-muted text-xs mt-1">{d.reason}</p>}
                </div>
                <form action={deleteDenial}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-status-missing din uppercase tracking-wide whitespace-nowrap"
                  >
                    remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={saveDenial} className="space-y-4 border border-hairline p-4">
          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="condition_name">
              Condition
            </label>
            <input
              id="condition_name"
              name="condition_name"
              placeholder="e.g. Lumbar strain"
              required
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="decision_date">
              When were you denied?
            </label>
            <input
              id="decision_date"
              name="decision_date"
              type="date"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
            <p className="text-xs text-muted mt-1">Best guess is fine.</p>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="reason">
              What did the denial letter say, if you remember?
            </label>
            <textarea
              id="reason"
              name="reason"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white h-20"
              placeholder="Don't worry about exact wording — the gist is fine"
            />
          </div>

          <button
            type="submit"
            className="w-full border border-ink py-2 text-sm din uppercase tracking-wide"
          >
            Add this denial
          </button>
        </form>

        <Link
          href="/veteran/intake/providers"
          className="block w-full text-center bg-ink text-paper py-2.5 text-sm mt-4 din uppercase tracking-wide"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
