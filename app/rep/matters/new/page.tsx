import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createMatter(formData: FormData) {
  "use server";

  const displayName = formData.get("display_name") as string;
  const veteranEmail = formData.get("veteran_email") as string;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  // Representative's org is resolved from org_members; in the MVP slice
  // we take their first membership. Multi-org representatives get a
  // proper org picker in a later pass.
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", userData.user!.id)
    .limit(1)
    .single();

  const { data: matter, error } = await supabase
    .from("veteran_matters")
    .insert({
      display_name: displayName,
      organization_id: membership?.organization_id,
      primary_representative_id: userData.user!.id,
      created_by: userData.user!.id,
      stage: "intake_invited",
    })
    .select("id")
    .single();

  if (error || !matter) {
    // Surface the failure rather than silently redirecting to a
    // nonexistent case.
    redirect("/rep/matters/new?error=create_failed");
  }

  await supabase.from("matter_stage_history").insert({
    matter_id: matter.id,
    from_stage: null,
    to_stage: "intake_invited",
    changed_by: userData.user!.id,
    reason: "Matter created",
  });

  // Sending the actual invitation email is wired once the notification
  // pipeline exists; for the MVP slice the veteran record is created and
  // the representative can share the intake link directly.
  console.log(`Intake invite pending for ${veteranEmail} on ${matter.id}`);

  redirect(`/rep`);
}

export default function NewMatterPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <form
        action={createMatter}
        className="w-full max-w-md border border-hairline p-8"
      >
        <p className="font-mono text-xs text-muted mb-1">VETCLAIM.ONE</p>
        <h1 className="font-serif text-2xl mb-6">Create matter</h1>

        <label className="block text-sm text-muted mb-1" htmlFor="display_name">
          Veteran name
        </label>
        <input
          id="display_name"
          name="display_name"
          className="w-full border border-hairline px-3 py-2 mb-4 text-sm bg-white"
          placeholder="Full name"
          required
        />

        <label className="block text-sm text-muted mb-1" htmlFor="veteran_email">
          Veteran email
        </label>
        <input
          id="veteran_email"
          name="veteran_email"
          type="email"
          className="w-full border border-hairline px-3 py-2 mb-6 text-sm bg-white"
          placeholder="name@example.com"
          required
        />

        <p className="text-xs text-muted mb-6">
          The veteran receives a secure intake invitation at this address.
          No medical or claims information is entered by you at this step.
        </p>

        <button
          type="submit"
          className="w-full bg-ink text-paper py-2.5 text-sm"
        >
          Create matter and send invitation
        </button>
      </form>
    </main>
  );
}
