import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client for the anonymous public cohort atlas.
 *
 * Uses ONLY the publishable (anon) key — never a privileged server key.
 * When the environment variables are absent the client is null and callers must
 * surface a "shared database not configured" state instead of pretending data
 * was saved. We never throw at import time so the rest of the static app still
 * works offline / on a fork without Supabase.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export const COHORT_TABLE = 'cohort_records';
