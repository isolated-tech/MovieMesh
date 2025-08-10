import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

/**
 * Singleton Supabase client for the browser.
 * Uses NEXT_PUBLIC_ envs as recommended for Next.js client access. [^2]
 */
let client: SupabaseClient<Database> | null = null

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      )
    }
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    })
  }
  return client
}
