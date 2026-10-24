/**
 * Client for YOUR OWN Supabase project (not the Lovable Cloud backend).
 *
 * Fill in the two values below with your project's URL and publishable
 * (anon) key. Both are safe to keep in client code — never put the
 * service role key here.
 *
 * You can also provide them as env vars:
 *   VITE_MY_SUPABASE_URL
 *   VITE_MY_SUPABASE_PUBLISHABLE_KEY
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const EXTERNAL_SUPABASE_URL =
  (import.meta.env["VITE_MY_SUPABASE_URL"] as string | undefined) ??
  "https://npjkjdncirtycjvdkstf.supabase.co";

export const EXTERNAL_SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env["VITE_MY_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wamtqZG5jaXJ0eWNqdmRrc3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjAxNDEsImV4cCI6MjA5MDQ5NjE0MX0.aqPFBBhtT7P0DmqMTo3-6Nsr00h0jEtAScIvh8oSPSc";

export const isExternalSupabaseConfigured =
  !EXTERNAL_SUPABASE_URL.includes("YOUR-PROJECT-REF") &&
  !EXTERNAL_SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR-");

function isNewApiKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, k) => headers.set(k, value));
    }
    if (isNewApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

// Untyped on purpose: schema types are generated only for Lovable Cloud.
export const supabase: SupabaseClient = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: { fetch: makeFetch(EXTERNAL_SUPABASE_PUBLISHABLE_KEY) },
  },
);
