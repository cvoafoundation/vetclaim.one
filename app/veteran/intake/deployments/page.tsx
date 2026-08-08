import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IntakeProgress from "@/components/IntakeProgress";

async function saveDeployment(formData: FormData) {
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

  const exposuresRaw = formData.get("exposures") as string;
  const exposures = exposuresRaw
    ? exposuresRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  await supabase.from("deployments").insert({
    matter_id: matter.id,
    location: formData.get("location") as string,
    start_date: (formData.get("start_date") as string) || null,
    end_date: (formData.get("end_date") as string) || null,
    suspected_exposures: exposures,
  });

  redirect("/veteran/intake/deployments");
}

async function deleteDeployment(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  await supabase.from("deployments").delete().eq("id", formData.get("id") as string);
  redirect("/veteran/intake/deployments");
}

export default async function DeploymentsStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: deploys } = matter
    ? await supabase
        .from("deployments")
        .select("id, location, start_date, end_date, suspected_exposures")
        .eq("matter_id", matter.id)
        .order("start_date", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <IntakeProgress step={2} />
        <h1 className="din text-3xl mb-2">Deployments and exposures</h1>
        <p className="text-muted text-sm mb-6">
          Add each place you deployed to. If you're not sure of exact dates,
          your best estimate is fine. If you never deployed, just continue.
        </p>

        {deploys && deploys.length > 0 && (
          <div className="border border-hairline divide-y divide-hairline mb-6">
            {deploys.map((d) => (
              <div key={d.id} className="px-4 py-3 text-sm flex items-center justify-between gap-3">
                <div>
                  <p className="din uppercase tracking-wide text-xs text-accent mb-1">
                    {d.location}
                  </p>
                  <p className="text-muted text-xs">
                    {d.start_date ?? "?"} &mdash; {d.end_date ?? "?"}
                    {d.suspected_exposures && d.suspected_exposures.length > 0
                      ? ` \u2022 ${d.suspected_exposures.join(", ")}`
                      : ""}
                  </p>
                </div>
                <form action={deleteDeployment}>
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

        <form action={saveDeployment} className="space-y-4 border border-hairline p-4">
          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              placeholder="e.g. Kandahar Province, Afghanistan"
              required
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="start_date">
                Start date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="end_date">
                End date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
          <p className="text-xs text-muted -mt-2">Best guess is fine on both dates.</p>

          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="exposures">
              Anything you were exposed to there? (optional)
            </label>
            <input
              id="exposures"
              name="exposures"
              placeholder="e.g. burn pits, IED blasts, loud equipment"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
            <p className="text-xs text-muted mt-1">
              Separate more than one with a comma.
            </p>
          </div>

          <button
            type="submit"
            className="w-full border border-ink py-2 text-sm din uppercase tracking-wide"
          >
            Add this deployment
          </button>
        </form>

        <Link
          href="/veteran/intake/conditions"
          className="block w-full text-center bg-ink text-paper py-2.5 text-sm mt-4 din uppercase tracking-wide"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
