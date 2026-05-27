import type { Store } from '../store'

interface Props { store: Store }

export default function ReglTab({ store }: Props) {
  const { settings, updateSettings } = store

  return (
    <div className="px-4 pt-4 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-5">Paramètres</h2>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jours travaillés / mois
          </label>
          <input
            type="number" min="1" max="31"
            value={settings.joursParMois}
            onChange={e => updateSettings({ joursParMois: parseFloat(e.target.value) || 20 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="px-4 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Heures par jour
          </label>
          <input
            type="number" min="0.5" max="24" step="0.5"
            value={settings.heuresParJour}
            onChange={e => updateSettings({ heuresParJour: parseFloat(e.target.value) || 7.5 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="mt-4 bg-blue-50 rounded-2xl px-4 py-3">
        <p className="text-xs text-blue-600 leading-relaxed">
          Objectif mensuel calculé : <strong>{store.settings.joursParMois * store.settings.heuresParJour}h</strong>
          <br />
          Objectif journalier : <strong>{store.settings.heuresParJour}h</strong>
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
        Tes données sont stockées localement sur cet appareil.<br />
        Rien n'est envoyé sur internet.
      </p>
    </div>
  )
}
