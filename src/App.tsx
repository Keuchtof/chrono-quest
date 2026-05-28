import { useState, useEffect } from 'react'
import { useStore } from './store'
import Header from './components/Header'
import TabBar from './components/TabBar'
import LoginScreen from './components/LoginScreen'
import SuiviTab from './tabs/SuiviTab'
import JourTab from './tabs/JourTab'
import BlocsTab from './tabs/BlocsTab'
import HistoTab from './tabs/HistoTab'
import ReglTab from './tabs/ReglTab'
import { loadUserData, saveUserData } from './lib/sync'

export type Tab = 'suivi' | 'jour' | 'blocs' | 'histo' | 'regl'

// ─── Main App (handles login gate) ───────────────────────────────────────────
export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('cq_username') ?? '')
  const [loading,  setLoading]  = useState(false)
  const [storeKey, setStoreKey] = useState(0)

  async function handleLogin(name: string) {
    setLoading(true)
    const prev = localStorage.getItem('cq_username')
    if (prev !== name) {
      localStorage.removeItem('cq_blocs')
      localStorage.removeItem('cq_sessions')
      localStorage.removeItem('cq_timer')
    }
    await pullFromCloud(name)
    localStorage.setItem('cq_username', name)
    setUsername(name)
    setStoreKey(k => k + 1)
    setLoading(false)
  }

  /** Pull cloud data for a username and update localStorage. */
  async function pullFromCloud(name: string) {
    try {
      const data = await loadUserData(name)
      if (!data) return
      if (data.blocs    && (data.blocs    as unknown[]).length)       localStorage.setItem('cq_blocs',    JSON.stringify(data.blocs))
      if (data.sessions && (data.sessions as unknown[]).length)       localStorage.setItem('cq_sessions', JSON.stringify(data.sessions))
      if (data.settings && Object.keys(data.settings as object).length) localStorage.setItem('cq_settings', JSON.stringify(data.settings))
    } catch { /* offline — keep local data */ }
  }

  /** Called by ReglTab when Supabase config is saved or user hits "Resync". */
  async function handleSyncActivated() {
    const name = localStorage.getItem('cq_username') ?? username
    await pullFromCloud(name)
    setStoreKey(k => k + 1) // Remount store from fresh localStorage
  }

  function handleLogout() {
    localStorage.removeItem('cq_username')
    setUsername('')
  }

  if (!username || loading) {
    return <LoginScreen onLogin={handleLogin} loading={loading} />
  }

  return (
    <AppContent
      key={storeKey}
      username={username}
      onLogout={handleLogout}
      onSyncActivated={handleSyncActivated}
    />
  )
}

// ─── AppContent (remounted on login/resync to reload store) ──────────────────
function AppContent({
  username,
  onLogout,
  onSyncActivated,
}: {
  username:        string
  onLogout:        () => void
  onSyncActivated: () => Promise<void>
}) {
  const [tab, setTab] = useState<Tab>('suivi')
  const [now, setNow] = useState(Date.now())
  const store = useStore()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Debounced cloud sync — 2 s after last change
  useEffect(() => {
    const t = setTimeout(() => {
      saveUserData(username, {
        blocs:    store.blocs    as unknown[],
        sessions: store.sessions as unknown[],
        settings: store.settings as unknown as Record<string, unknown>,
      })
    }, 2000)
    return () => clearTimeout(t)
  }, [store.blocs, store.sessions, store.settings, username])

  return (
    <div className="h-full w-full max-w-md mx-auto flex flex-col bg-gray-50 shadow-2xl">
      <Header store={store} now={now} />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'suivi' && <SuiviTab store={store} now={now} />}
        {tab === 'jour'  && <JourTab  store={store} now={now} />}
        {tab === 'blocs' && <BlocsTab store={store} now={now} />}
        {tab === 'histo' && <HistoTab store={store} />}
        {tab === 'regl'  && (
          <ReglTab
            store={store}
            username={username}
            onLogout={onLogout}
            onSyncActivated={onSyncActivated}
          />
        )}
      </main>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  )
}
