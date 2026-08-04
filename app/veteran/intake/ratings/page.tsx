import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function saveRating(formData: FormData) {
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

  await supabase.from("existing_ratings").insert({
    matter_id: matter.id,
    condition_name: formData.get("condition_name") as string,
    percentage: formData.get("percentage") ? Number(formData.get("percentage")) : null,
    effective_date: (formData.get("effective_date") as string) || null,
  });

  redirect("/veteran/intake/ratings");
}

export default async function RatingsStep() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: matter } = userData.user
    ? await supabase
        .from("veteran_matters")
        .select("id")
        .eq("veteran_user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const { data: ratings } = matter
    ? await supabase
        .from("existing_ratings")
        .select("id, condition_name, percentage, effective_date")
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">step 4 of 6</p>
        <h1 className="din text-3xl mb-2">Existing VA ratings</h1>
        <p className="text-muted text-sm mb-6">
          Add anything you're already rated for. If you're not currently
          rated for anything, just continue.
        </p>

        {ratings && ratings.length > 0 && (
          <div className="border border-hairline divide-y divide-hairline mb-6">
            {ratings.map((r) => (
              <div key={r.id} className="px-4 py-3 text-sm flex items-center justify-between">
                <div>
                  <p className="din uppercase tracking-wide text-xs text-accent mb-1">
                    {r.condition_name}
                  </p>
                  <p className="text-muted text-xs">
                    {r.effective_date ? `Since ${r.effective_date}` : ""}
                  </p>
                </div>
                <span className="din text-lg">{r.percentage ?? "?"}%</span>
              </div>
            ))}
          </div>
        )}

        <form action={saveRating} className="space-y-4 border border-hairline p-4">
          <div>
            <label className="block text-sm text-muted mb-1" htmlFor="condition_name">
              Condition
            </label>
            <input
              id="condition_name"
              name="condition_name"
              placeholder="e.g. Bilateral hearing loss"
              required
              className="w-full border border-hairline px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="percentage">
                Current rating (%)
              </label>
              <input
                id="percentage"
                name="percentage"
                type="number"
                min="0"
                max="100"
                step="10"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1" htmlFor="effective_date">
                Effective date
              </label>
              <input
                id="effective_date"
                name="effective_date"
                type="date"
                className="w-full border border-hairline px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full border border-ink py-2 text-sm din uppercase tracking-wide"
          >
            Add this rating
          </button>
        </form>

        <Link
          href="/veteran/intake/denials"
          className="block w-full text-center bg-ink text-paper py-2.5 text-sm mt-4 din uppercase tracking-wide"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
