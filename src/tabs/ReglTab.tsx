import { useState } from 'react'
import type { Store } from '../store'
import ExportModal from '../components/ExportModal'
import { isSupabaseConfigured } from '../lib/sync'

interface Props {
  store:    Store
  username: string
  onLogout: () => void
}

export default function ReglTab({ store, username, onLogout }: Props) {
  const { settings, updateSettings } = store
  const [showExport, setShowExport]  = useState(false)

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <h2 className="text-base font-bold text-gray-900">Paramètres</h2>

      {/* Compte */}
      <Section title="Compte">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{username}</p>
            <p className="text-xs text-gray-400">
              {isSupabaseConfigured ? '☁️ Données synchronisées en ligne' : '💾 Données locales uniquement'}
            </p>
          </div>
          <button onClick={onLogout}
            className="text-sm text-red-500 font-medium px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
            Déconnexion
          </button>
        </div>
        {!isSupabaseConfigured && (
          <div className="px-4 pb-3">
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
              <p className="font-semibold mb-0.5">Sync cloud non configurée</p>
              <p>Ajoutez <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> et <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> dans les variables d'environnement Cloudflare Pages pour activer la synchronisation multi-appareils.</p>
            </div>
          </div>
        )}
      </Section>

      {/* Temps */}
      <Section title="Temps">
        <Field label="Jours travaillés / mois">
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
        <div className="px-4 pb-3">
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
            Objectif mensuel : <strong>{settings.joursParMois * settings.heuresParJour}h</strong>
            {' · '}Journalier : <strong>{settings.heuresParJour}h</strong>
          </p>
        </div>
      </Section>

      {/* Dimension Configuration */}
      <Section title="Dimension — Configuration">
        <div className="px-4 pb-4">
          <DimEditor
            values={settings.configurations}
            onChange={v => updateSettings({ configurations: v })}
            color="#3B82F6"
          />
        </div>
      </Section>

      {/* Dimension Posture */}
      <Section title="Dimension — Posture">
        <div className="px-4 pb-4">
          <DimEditor
            values={settings.postures}
            onChange={v => updateSettings({ postures: v })}
            color="#8B5CF6"
          />
        </div>
      </Section>

      {/* Zones */}
      <Section title="Zones géographiques">
        <Field label="Nom de la zone 1">
          <input type="text"
            value={settings.zoneName1}
            onChange={e => updateSettings({ zoneName1: e.target.value || 'Alpes' })}
            placeholder="ex: Alpes"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </Field>
        <Field label="Nom de la zone 2">
          <input type="text"
            value={settings.zoneName2}
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
        <div className="px-4 py-3">
          <button onClick={() => setShowExport(true)}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            ⬇ Exporter en CSV
          </button>
        </div>
      </Section>

      <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
        {isSupabaseConfigured
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
    </div>
  )
}

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
    if (v && !values.includes(v)) {
      onChange([...values, v])
      setNewVal('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: color + '18', color }}>
            {v}
            <button
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70 font-bold"
              style={{ color }}
            >×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Ajouter une valeur..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
        />
        <button onClick={add}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: color }}>+</button>
      </div>
    </div>
  )
}
