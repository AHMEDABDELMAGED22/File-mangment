import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-side operations.
 * This bypasses RLS — use with extreme caution.
 * NEVER import this file in client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
