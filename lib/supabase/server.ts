import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-side inserts/reads only.
 * Returns null when env is not configured (MVP works without Supabase).
 */
export function createServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
