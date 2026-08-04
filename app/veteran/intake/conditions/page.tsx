import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function saveCondition(formData: FormData) {
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

  await supabase.from("conditions").insert({
    matter_id: matter.id,
    condition_name: formData.get("condition_name") as string,
    symptoms: (formData.get("symptoms") as string) || null,
    onset_date: (formData.get("onset_date") as string) || null,
    still_experiencing: formData.get("still_experiencing") === "yes",
  });

  redirect("/veteran/intake/conditions");
}

export default async function ConditionsStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: conditions } = matter
    ? await supabase
        .from("conditions")
        .select("id, condition_name, symptoms, onset_date, still_experiencing")
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">step 3 of 6</p>
        <h1 className="din text-3xl mb-2">Current conditions</h1>
        <p className="text-muted text-sm mb-6">
          Add anything you're currently dealing with, whether or not you
          think it's connected to your service. We'll sort that out later.
        </p>

        {conditions && conditions.length > 0 && (
          <div className="border border-hairline divide-y divide-hairline mb-6">
            {conditions.map((c) => (
              <div key={c.id} className="px-4 py-3 text-sm">
                <p className="din uppercase tracking-wide text-xs text-accent mb-1">
                  {c.condition_name}
                </p>
                {c.symptoms && <p className="text-muted text-xs">{c.symptoms}</p>}
                <p className="text-muted text-xs mt-1">
                  {c.onset_date ? `Since ${c.onset_date}` : "Onset date not given"}
                  {c.still_experiencing ? " \u2022 ongoing" : " \u2022 resolved"}
                </p>
              </div>
            ))}
          </div>
        )}

        <form action={saveCondition} className="space-y-4 border border-hairline p-4">
          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="condition_name">
              Condition or symptom
            </label>
            <input
              id="condition_name"
              name="condition_name"
              placeholder="e.g. Lower back pain"
              required
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="symptoms">
              Describe what you're experiencing
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white h-20"
              placeholder="When it happens, how bad it gets, what makes it worse"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="onset_date">
                When did it start? (best guess is fine)
              </label>
              <input
                id="onset_date"
                name="onset_date"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">
                Still dealing with this?
              </label>
              <select
                name="still_experiencing"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
                defaultValue="yes"
              >
                <option value="yes">Yes, ongoing</option>
                <option value="no">No, it resolved</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full border border-ink py-2 text-sm din uppercase tracking-wide"
          >
            Add this condition
          </button>
        </form>

        <Link
          href="/veteran/intake/ratings"
          className="block w-full text-center bg-ink text-paper py-2.5 text-sm mt-4 din uppercase tracking-wide"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
