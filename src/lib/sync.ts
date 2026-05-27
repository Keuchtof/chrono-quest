/**
 * Supabase cloud sync for Chrono Quest
 *
 * Config stored in localStorage('cq_supabase') — set directly from the app UI
 * (Paramètres → Compte → Synchronisation cloud).
 *
 * Supabase table setup (run once in the SQL editor):
 * ───────────────────────────────────────────────────
 * CREATE TABLE chrono_quest_data (
 *   username   TEXT PRIMARY KEY,
 *   blocs      JSONB NOT NULL DEFAULT '[]'::jsonb,
 *   sessions   JSONB NOT NULL DEFAULT '[]'::jsonb,
 *   settings   JSONB NOT NULL DEFAULT '{}'::jsonb,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE chrono_quest_data ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "allow_all" ON chrono_quest_data
 *   FOR ALL TO anon USING (true) WITH CHECK (true);
 */

const TABLE = 'chrono_quest_data'
const LS_KEY = 'cq_supabase'

export interface SupabaseConfig { url: string; key: string }

/** Read config from localStorage (set by the user in Settings). */
export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw) as SupabaseConfig
    return cfg.url && cfg.key ? cfg : null
  } catch { return null }
}

/** Persist config to localStorage. Pass null to clear. */
export function setSupabaseConfig(cfg: SupabaseConfig | null) {
  if (cfg) localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  else localStorage.removeItem(LS_KEY)
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null
}

function hdrs(cfg: SupabaseConfig, extra: Record<string, string> = {}) {
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
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
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/${TABLE}?username=eq.${encodeURIComponent(username)}&select=blocs,sessions,settings`,
      { headers: hdrs(cfg) },
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
  const cfg = getSupabaseConfig()
  if (!cfg) return
  try {
    await fetch(`${cfg.url}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: hdrs(cfg, { Prefer: 'resolution=merge-duplicates' }),
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
