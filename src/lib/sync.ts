/**
 * Supabase cloud sync for Chrono Quest
 *
 * SETUP (run once in the Supabase SQL editor):
 * ─────────────────────────────────────────────
 * CREATE TABLE chrono_quest_data (
 *   username   TEXT PRIMARY KEY,
 *   blocs      JSONB NOT NULL DEFAULT '[]'::jsonb,
 *   sessions   JSONB NOT NULL DEFAULT '[]'::jsonb,
 *   settings   JSONB NOT NULL DEFAULT '{}'::jsonb,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * ALTER TABLE chrono_quest_data ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "allow_all" ON chrono_quest_data
 *   FOR ALL TO anon USING (true) WITH CHECK (true);
 *
 * ENVIRONMENT VARIABLES (Cloudflare Pages → Settings → Environment variables):
 *   VITE_SUPABASE_URL       = https://xxxxxxxxxxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY  = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env   = (import.meta as any).env ?? {}
const URL_  = (env.VITE_SUPABASE_URL       as string | undefined) ?? ''
const KEY_  = (env.VITE_SUPABASE_ANON_KEY  as string | undefined) ?? ''
const TABLE = 'chrono_quest_data'

export const isSupabaseConfigured = !!(URL_ && KEY_)

function hdrs(extra: Record<string, string> = {}) {
  return {
    apikey: KEY_,
    Authorization: `Bearer ${KEY_}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export interface CloudData {
  blocs:    unknown[]
  sessions: unknown[]
  settings: Record<string, unknown>
}

/** Load user data from Supabase. Returns null if not found or not configured. */
export async function loadUserData(username: string): Promise<CloudData | null> {
  if (!isSupabaseConfigured) return null
  try {
    const res = await fetch(
      `${URL_}/rest/v1/${TABLE}?username=eq.${encodeURIComponent(username)}&select=blocs,sessions,settings`,
      { headers: hdrs() },
    )
    if (!res.ok) return null
    const rows: CloudData[] = await res.json()
    return rows[0] ?? null
  } catch {
    return null
  }
}

/** Upsert user data to Supabase. Silent on error (offline-safe). */
export async function saveUserData(username: string, data: CloudData): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await fetch(`${URL_}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: hdrs({ Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify({
        username,
        blocs:      data.blocs,
        sessions:   data.sessions,
        settings:   data.settings,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch {
    // Silent — app works offline
  }
}
