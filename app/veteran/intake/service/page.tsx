import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function saveServicePeriod(formData: FormData) {
  "use server";

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: matter } = await supabase
    .from("veteran_matters")
    .select("id, stage")
    .eq("veteran_user_id", userData.user!.id)
    .single();

  if (!matter) redirect("/sign-in");

  await supabase.from("service_periods").insert({
    matter_id: matter.id,
    branch: formData.get("branch") as string,
    entry_date: formData.get("entry_date") as string,
    discharge_date: (formData.get("discharge_date") as string) || null,
    discharge_type: (formData.get("discharge_type") as string) || null,
    occupational_specialty: (formData.get("mos") as string) || null,
  });

  if (matter.stage === "intake_invited") {
    await supabase
      .from("veteran_matters")
      .update({ stage: "intake_in_progress" })
      .eq("id", matter.id);

    await supabase.from("matter_stage_history").insert({
      matter_id: matter.id,
      from_stage: "intake_invited",
      to_stage: "intake_in_progress",
      changed_by: userData.user!.id,
      reason: "Veteran began service history intake",
    });
  }

  redirect("/veteran/intake/service");
}

export default async function ServiceHistoryStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: periods } = matter
    ? await supabase
        .from("service_periods")
        .select("id, branch, entry_date, discharge_date, discharge_type, occupational_specialty")
        .eq("matter_id", matter.id)
        .order("entry_date", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">step 1 of 6</p>
        <h1 className="din text-3xl mb-2">Your service history</h1>
        <p className="text-muted text-sm mb-6">
          Add each period you served. You can add more than one if you
          served more than once.
        </p>

        {periods && periods.length > 0 && (
          <div className="border border-hairline divide-y divide-hairline mb-6">
            {periods.map((p) => (
              <div key={p.id} className="px-4 py-3 text-sm">
                <p className="din uppercase tracking-wide text-xs text-accent mb-1">
                  {p.branch}
                </p>
                <p className="text-muted text-xs">
                  {p.entry_date} &mdash; {p.discharge_date ?? "present"}
                  {p.occupational_specialty ? ` \u2022 ${p.occupational_specialty}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        <form action={saveServicePeriod} className="space-y-4 border border-hairline p-4">
          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="branch">
              Branch of service
            </label>
            <select
              id="branch"
              name="branch"
              required
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            >
              <option value="">Select one</option>
              <option>Army</option>
              <option>Navy</option>
              <option>Air Force</option>
              <option>Marine Corps</option>
              <option>Coast Guard</option>
              <option>Space Force</option>
              <option>National Guard</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="entry_date">
                Entry date
              </label>
              <input
                id="entry_date"
                name="entry_date"
                type="date"
                required
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="discharge_date">
                Discharge date
              </label>
              <input
                id="discharge_date"
                name="discharge_date"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
              <p className="text-xs text-muted mt-1">Leave blank if still serving.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="discharge_type">
              Discharge type
            </label>
            <select
              id="discharge_type"
              name="discharge_type"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            >
              <option value="">Not applicable yet</option>
              <option>Honorable</option>
              <option>General under honorable conditions</option>
              <option>Other than honorable</option>
              <option>Bad conduct</option>
              <option>Dishonorable</option>
              <option>Not sure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="mos">
              Job or occupational specialty (optional)
            </label>
            <input
              id="mos"
              name="mos"
              placeholder="e.g. 11B Infantryman"
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full border border-ink py-2 text-sm din uppercase tracking-wide"
          >
            Add this period
          </button>
        </form>

        <Link
          href="/veteran/intake/deployments"
          className="block w-full text-center bg-ink text-paper py-2.5 text-sm mt-4 din uppercase tracking-wide"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
