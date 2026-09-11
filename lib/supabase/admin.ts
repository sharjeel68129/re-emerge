import { createClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY. Uses the service role key, which bypasses row-level
 * security entirely — never import this file into a Client Component,
 * and never expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix.
 * It's only needed for things the anon key structurally can't do, like
 * deleting an auth user (self-serve account deletion).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
