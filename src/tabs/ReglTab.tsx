import { useState } from 'react'
import type { Store } from '../store'
import ExportModal from '../components/ExportModal'
import ImportModal from '../components/ImportModal'
import BlocFormModal from '../components/BlocFormModal'
import { isSupabaseConfigured, getSupabaseConfig, setSupabaseConfig } from '../lib/sync'
import { MONTHS } from '../utils'
import { COLORS } from '../constants'
import type { Bloc } from '../types'

interface Props {
  store:           Store
  username:        string
  onLogout:        () => void
  onSyncActivated: () => Promise<void>
}

export default function ReglTab({ store, username, onLogout, onSyncActivated }: Props) {
  const { settings, updateSettings } = store
  const [showExport,   setShowExport]   = useState(false)
  const [showImport,   setShowImport]   = useState(false)
  const [syncing,      setSyncing]      = useState(false)
  const [showBlocForm, setShowBlocForm] = useState(false)
  const [editBloc,     setEditBloc]     = useState<Bloc | null>(null)

  function handleEditBloc(bloc: Bloc)  { setEditBloc(bloc); setShowBlocForm(true) }
  function handleBlocClose()           { setShowBlocForm(false); setEditBloc(null) }

  // Surcharges jours/mois
  const today = new Date()
  const defaultMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const [newOverrideMonth, setNewOverrideMonth] = useState(defaultMonthKey)
  const [newOverrideDays,  setNewOverrideDays]  = useState(String(settings.joursParMois))

  function addOverride() {
    const days = parseInt(newOverrideDays)
    if (!newOverrideMonth || !days || days < 1 || days > 31) return
    updateSettings({ joursParMoisOverrides: { ...(settings.joursParMoisOverrides ?? {}), [newOverrideMonth]: days } })
  }
  function removeOverride(key: string) {
    const overrides = { ...(settings.joursParMoisOverrides ?? {}) }
    delete overrides[key]
    updateSettings({ joursParMoisOverrides: overrides })
  }
  function monthKeyLabel(key: string) {
    const [y, m] = key.split('-')
    return `${MONTHS[parseInt(m) - 1]} ${y}`
  }

  // Supabase config form
  const existing = getSupabaseConfig()
  const [sbUrl,   setSbUrl]   = useState(existing?.url ?? '')
  const [sbKey,   setSbKey]   = useState(existing?.key ?? '')
  const [sbSaved, setSbSaved] = useState(isSupabaseConfigured())

  async function saveSync() {
    const url = sbUrl.trim()
    const key = sbKey.trim()
    if (!url || !key) return
    setSupabaseConfig({ url, key })
    setSbSaved(true)
    // Immediately pull data from cloud and remount store
    setSyncing(true)
    await onSyncActivated()
    setSyncing(false)
  }

  async function resync() {
    setSyncing(true)
    await onSyncActivated()
    setSyncing(false)
  }

  function clearSync() {
    setSupabaseConfig(null)
    setSbUrl('')
    setSbKey('')
    setSbSaved(false)
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <h2 className="text-base font-bold text-gray-900">Paramètres</h2>

      {/* Compte */}
      <Section title="Compte">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{username}</p>
            <p className="text-xs text-gray-400">
              {sbSaved ? '☁️ Synchronisation cloud active' : '💾 Données locales uniquement'}
            </p>
          </div>
          <button onClick={onLogout}
            className="text-sm text-red-500 font-medium px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
            Déconnexion
          </button>
        </div>
      </Section>

      {/* Sync cloud */}
      <Section title="Synchronisation cloud">
        <div className="px-4 py-3 space-y-3">
          {sbSaved ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">☁️ Connecté à Supabase</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{sbUrl}</p>
                </div>
                <button onClick={clearSync}
                  className="text-xs text-gray-500 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50">
                  Modifier
                </button>
              </div>
              <button onClick={resync} disabled={syncing}
                className="w-full py-2 rounded-xl border border-green-200 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors">
                {syncing ? '⏳ Synchronisation…' : '🔄 Resynchroniser depuis le cloud'}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-relaxed">
                Entrez vos clés Supabase pour synchroniser vos données sur plusieurs appareils.
                Récupérez ces valeurs dans <strong>votre projet Supabase → Home → Copy</strong>.
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project URL</label>
                  <input type="text" value={sbUrl} onChange={e => setSbUrl(e.target.value)}
                    placeholder="https://xxxx.supabase.co"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:border-blue-400 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Publishable key (anon)</label>
                  <input type="text" value={sbKey} onChange={e => setSbKey(e.target.value)}
                    placeholder="sb_publishable_..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:border-blue-400 font-mono" />
                </div>
              </div>
              <button onClick={saveSync} disabled={!sbUrl.trim() || !sbKey.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white disabled:opacity-40 transition-opacity">
                Activer la sync
              </button>
            </>
          )}
        </div>
      </Section>

      {/* Blocs de temps */}
      <Section title="Blocs de temps">
        <div className="px-4 py-2 space-y-1">
          {store.blocs.map(bloc => {
            const color = COLORS[bloc.color]
            return (
              <div key={bloc.id} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: color.light }}>{bloc.icon}</div>
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">{bloc.name}</span>
                <button onClick={() => handleEditBloc(bloc)}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-gray-500 rounded-lg">✏️</button>
                {!bloc.isRest && (
                  <button onClick={() => { if (confirm(`Supprimer "${bloc.name}" ?`)) store.deleteBloc(bloc.id) }}
                    className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 rounded-lg">🗑</button>
                )}
              </div>
            )
          })}
        </div>
        <div className="px-4 pb-3">
          <button onClick={() => setShowBlocForm(true)}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
            <span className="text-base leading-none">+</span> Nouveau bloc
          </button>
        </div>
      </Section>

      {/* Temps */}
      <Section title="Temps">
        <Field label="Jours travaillés / mois (défaut)">
          <input type="number" min="1" max="31"
            value={settings.joursParMois}
            onChange={e => updateSettings({ joursParMois: parseFloat(e.target.value) || 20 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>
        <Field label="Heures par jour">
          <input type="number" min="0.5" max="24" step="0.5"
            value={settings.heuresParJour}
            onChange={e => updateSettings({ heuresParJour: parseFloat(e.target.value) || 7.5 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>

        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Afficher le week-end</p>
            <p className="text-xs text-gray-400">Samedi et dimanche dans la vue semaine</p>
          </div>
          <button onClick={() => updateSettings({ showWeekend: !(settings.showWeekend ?? false) })}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
            style={{ backgroundColor: (settings.showWeekend ?? false) ? '#3B82F6' : '#E5E7EB' }}>
            <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              style={{ transform: (settings.showWeekend ?? false) ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </div>

        {/* Exceptions par mois */}
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 tracking-wide pt-1">EXCEPTIONS PAR MOIS</p>

          {/* Liste des exceptions existantes */}
          {Object.keys(settings.joursParMoisOverrides ?? {}).sort().map(key => (
            <div key={key} className="flex items-center justify-between py-1.5 px-3 bg-blue-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 capitalize">{monthKeyLabel(key)}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-600">{settings.joursParMoisOverrides![key]}j</span>
                <button onClick={() => removeOverride(key)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 font-bold text-sm transition-colors">
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Formulaire d'ajout */}
          <div className="flex gap-2">
            <input type="month" value={newOverrideMonth}
              onChange={e => setNewOverrideMonth(e.target.value)}
              max={`${today.getFullYear() + 1}-12`}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
            <div className="relative w-20">
              <input type="number" min="1" max="31" value={newOverrideDays}
                onChange={e => setNewOverrideDays(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 pr-6" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">j</span>
            </div>
            <button onClick={addOverride}
              className="px-3 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">+</button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
            Objectif par défaut : <strong>{Math.round(settings.joursParMois * settings.heuresParJour * 10) / 10}h</strong>
            {' · '}Journalier : <strong>{settings.heuresParJour}h</strong>
          </p>
        </div>
      </Section>

      {/* Heures supplémentaires */}
      <Section title="Heures supplémentaires">
        <Field label="Stock initial (heures)">
          <input type="number" step="0.25"
            value={settings.hsStockInitial ?? ''}
            placeholder="ex: 12.5 ou -3"
            onChange={e => {
              const v = e.target.value
              updateSettings({ hsStockInitial: v === '' ? undefined : parseFloat(v) || 0 })
            }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>
        <Field label="Date de prise en compte">
          <input type="date" max={new Date().toISOString().slice(0, 10)}
            value={settings.hsStockDate ?? ''}
            onChange={e => updateSettings({ hsStockDate: e.target.value || undefined })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>
        <div className="px-4 pb-3">
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
            Le stock évolue chaque jour saisi : heures réelles − objectif du jour
            (congés et demi-journées pris en compte). Visible dans l'onglet Santé.
          </p>
        </div>
      </Section>

      {/* Dimension Configuration */}
      <Section title="Dimension — Configuration">
        <div className="px-4 pb-4">
          <DimEditor values={settings.configurations}
            onChange={v => updateSettings({ configurations: v })} color="#3B82F6" />
        </div>
      </Section>

      {/* Dimension Posture */}
      <Section title="Dimension — Posture">
        <div className="px-4 pb-4">
          <DimEditor values={settings.postures}
            onChange={v => updateSettings({ postures: v })} color="#8B5CF6" />
        </div>
      </Section>

      {/* Zones */}
      <Section title="Zones géographiques">
        <Field label="Nom de la zone 1">
          <input type="text" value={settings.zoneName1}
            onChange={e => updateSettings({ zoneName1: e.target.value || 'Alpes' })}
            placeholder="ex: Alpes"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>
        <Field label="Nom de la zone 2">
          <input type="text" value={settings.zoneName2}
            onChange={e => updateSettings({ zoneName2: e.target.value || 'Territoire' })}
            placeholder="ex: Territoire"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>
        <div className="px-4 pb-3">
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
            Ces noms apparaissent sur le switch lors du chronométrage et dans les statistiques.
          </p>
        </div>
      </Section>

      {/* Données */}
      <Section title="Données">
        <div className="px-4 py-3 space-y-2">
          <button onClick={() => setShowExport(true)}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            ⬇ Exporter en CSV
          </button>
          <button onClick={() => setShowImport(true)}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            📥 Importer depuis CSV
          </button>
        </div>
      </Section>

      <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
        {sbSaved
          ? 'Données sauvegardées en ligne et accessibles sur tous tes appareils.'
          : 'Données stockées localement. Active la sync pour accéder depuis plusieurs appareils.'}
      </p>

      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        sessions={store.sessions}
        blocs={store.blocs}
        settings={store.settings}
      />
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        store={store}
      />

      <BlocFormModal
        open={showBlocForm}
        bloc={editBloc}
        onSave={data => {
          if (editBloc) store.updateBloc(editBloc.id, data)
          else          store.addBloc(data)
        }}
        onClose={handleBlocClose}
      />
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <p className="text-xs font-semibold text-gray-400 tracking-wider px-4 pt-3 pb-1">{title.toUpperCase()}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-gray-50">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function DimEditor({ values, onChange, color }: {
  values: string[]; onChange: (v: string[]) => void; color: string
}) {
  const [newVal, setNewVal] = useState('')

  function add() {
    const v = newVal.trim()
    if (v && !values.includes(v)) { onChange([...values, v]); setNewVal('') }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: color + '18', color }}>
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70 font-bold"
              style={{ color }}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={newVal} onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Ajouter une valeur..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        <button onClick={add} className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: color }}>+</button>
      </div>
    </div>
  )
}
