import { createBrowserClient } from "@supabase/ssr";

// Used in client components. Anon key only — RLS does the real access
// control, this key never grants anything on its own.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
