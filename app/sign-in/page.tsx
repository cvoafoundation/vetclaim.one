"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("That email and password don't match. Try again.");
      return;
    }

    // Role-based landing is resolved server-side by middleware/route
    // guards in later passes; for the MVP slice, representatives land
    // on the caseload dashboard.
    router.push("/rep");
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-sm border border-hairline p-8"
      >
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">VETCLAIM.ONE</p>
        <h1 className="din text-3xl mb-6">Sign in</h1>

        <label className="block text-sm text-muted mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-hairline px-3 py-2 mb-4 text-sm bg-white"
          required
        />

        <label className="block text-sm text-muted mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-hairline px-3 py-2 mb-6 text-sm bg-white"
          required
        />

        {error && (
          <p className="text-sm text-status-missing mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper py-2.5 text-sm din uppercase tracking-wide"
        >
          {loading ? "Signing in\u2026" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
