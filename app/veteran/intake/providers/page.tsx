import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function saveProvider(formData: FormData) {
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

  await supabase.from("providers").insert({
    matter_id: matter.id,
    provider_name: formData.get("provider_name") as string,
    provider_type: (formData.get("provider_type") as string) || null,
    location: (formData.get("location") as string) || null,
    treatment_start: (formData.get("treatment_start") as string) || null,
    treatment_end: (formData.get("treatment_end") as string) || null,
  });

  redirect("/veteran/intake/providers");
}

export default async function ProvidersStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: providers } = matter
    ? await supabase
        .from("providers")
        .select("id, provider_name, provider_type, location, treatment_start, treatment_end")
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">step 6 of 6</p>
        <h1 className="din text-3xl mb-2">Medical providers</h1>
        <p className="text-muted text-sm mb-6">
          Add anywhere you've gotten treatment &mdash; VA or private. This
          tells us where to look for records.
        </p>

        {providers && providers.length > 0 && (
          <div className="border border-hairline divide-y divide-hairline mb-6">
            {providers.map((p) => (
              <div key={p.id} className="px-4 py-3 text-sm">
                <p className="din uppercase tracking-wide text-xs text-accent mb-1">
                  {p.provider_name}
                </p>
                <p className="text-muted text-xs">
                  {[p.provider_type, p.location].filter(Boolean).join(" \u2022 ")}
                </p>
              </div>
            ))}
          </div>
        )}

        <form action={saveProvider} className="space-y-4 border border-hairline p-4">
          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="provider_name">
              Provider or facility name
            </label>
            <input
              id="provider_name"
              name="provider_name"
              placeholder="e.g. VA Medical Center, or a private doctor's name"
              required
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="provider_type">
                Type
              </label>
              <select
                id="provider_type"
                name="provider_type"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              >
                <option value="">Select one</option>
                <option>VA facility</option>
                <option>Private physician</option>
                <option>Specialist</option>
                <option>Mental health provider</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="location">
                City / state
              </label>
              <input
                id="location"
                name="location"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="treatment_start">
                First treated
              </label>
              <input
                id="treatment_start"
                name="treatment_start"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="treatment_end">
                Last treated
              </label>
              <input
                id="treatment_end"
                name="treatment_end"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
              <p className="text-xs text-muted mt-1">Leave blank if ongoing.</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full border border-ink py-2 text-sm din uppercase tracking-wide"
          >
            Add this provider
          </button>
        </form>

        <Link
          href="/veteran/intake/review"
          className="block w-full text-center bg-ink text-paper py-2.5 text-sm mt-4 din uppercase tracking-wide"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
