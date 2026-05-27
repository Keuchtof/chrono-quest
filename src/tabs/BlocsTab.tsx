import { useState } from 'react'
import type { Store } from '../store'
import { COLORS } from '../constants'
import { getMonthSessions, secondsToDisplay } from '../utils'
import BlocFormModal from '../components/BlocFormModal'
import type { Bloc } from '../types'

interface Props { store: Store; now: number }

export default function BlocsTab({ store, now }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editBloc,  setEditBloc]  = useState<Bloc | null>(null)

  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()
  const monthSessions = getMonthSessions(store.sessions, year, month)

  function getBlocStats(blocId: string) {
    const bSess  = monthSessions.filter(s => s.blocId === blocId)
    const totalSecs = bSess.reduce((a, s) => a + s.duration, 0)
      + (store.activeTimer?.blocId === blocId ? Math.round((now - store.activeTimer.startTime) / 1000) : 0)
    const workedDays = new Set(bSess.map(s => s.date)).size
    return { totalSecs, workedDays }
  }

  function handleEdit(bloc: Bloc) { setEditBloc(bloc); setShowForm(true) }
  function handleClose()          { setShowForm(false); setEditBloc(null) }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Mes blocs</h2>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-xl">
          <span>+</span> Nouveau
        </button>
      </div>

      <div className="space-y-3">
        {store.blocs.map(bloc => {
          const color = COLORS[bloc.color]
          const { totalSecs, workedDays } = getBlocStats(bloc.id)
          const targetDays  = bloc.objectifJours
          const targetSecs  = targetDays * store.settings.heuresParJour * 3600
          const dayProgress = targetDays > 0 ? Math.min(workedDays / targetDays, 1) : 0

          return (
            <div key={bloc.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm"
              style={{ borderLeft: `4px solid ${color.main}` }}>

              {/* Header row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: color.light }}>{bloc.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{bloc.name}</p>
                  <p className="text-xs text-gray-400">
                    {secondsToDisplay(totalSecs)} ce mois
                    {targetSecs > 0 && <span className="text-gray-300"> / {secondsToDisplay(targetSecs)}</span>}
                  </p>
                </div>
                <button onClick={() => handleEdit(bloc)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✏️</button>
                <button onClick={() => { if (confirm(`Supprimer "${bloc.name}" ?`)) store.deleteBloc(bloc.id) }}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">🗑</button>
              </div>

              {/* Monthly progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Jours travaillés ce mois</span>
                  <span className="font-semibold" style={{ color: color.main }}>
                    {workedDays} / {targetDays} j
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${dayProgress * 100}%`, backgroundColor: color.main }} />
                </div>
                {workedDays >= targetDays && targetDays > 0 && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">✓ Objectif atteint !</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {store.blocs.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p className="text-3xl mb-2">📦</p>
          <p>Aucun bloc pour l'instant</p>
          <p>Créez votre premier bloc !</p>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowForm(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: 'max(16px, calc((100vw - 448px) / 2 + 16px))' }}>+</button>

      <BlocFormModal
        open={showForm}
        bloc={editBloc}
        onSave={data => {
          if (editBloc) store.updateBloc(editBloc.id, data)
          else store.addBloc(data)
        }}
        onClose={handleClose}
      />
    </div>
  )
}
