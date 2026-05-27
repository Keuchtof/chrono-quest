import { useState } from 'react'
import type { Store } from '../store'

interface Props { store: Store }

export default function ReglTab({ store }: Props) {
  const { settings, updateSettings } = store

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <h2 className="text-base font-bold text-gray-900">Paramètres</h2>

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

      <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
        Tes données sont stockées localement sur cet appareil.<br />
        Rien n'est envoyé sur internet.
      </p>
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
