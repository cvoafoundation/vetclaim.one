import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  redirect("/veteran/intake/conditions");
}

export default function DeploymentsStep() {
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">step 2 of 6</p>
        <h1 className="din text-3xl mb-2">Deployments and exposures</h1>
        <p className="text-muted text-sm mb-8">
          Add each place you deployed to. If you're not sure of exact dates,
          your best estimate is fine.
        </p>

        <form action={saveDeployment} className="space-y-4">
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
            className="w-full bg-ink text-paper py-2.5 text-sm mt-6 din uppercase tracking-wide"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
