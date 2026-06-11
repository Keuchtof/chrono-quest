import { useState } from 'react'
import type { Store } from '../store'
import { COLORS } from '../constants'
import { formatDateShort, formatDuration, secondsToDisplay, formatTime } from '../utils'
import EditSessionModal from '../components/EditSessionModal'
import { ChargeDisplay } from '../components/ChargeSelector'
import type { Session } from '../types'

interface Props { store: Store }

export default function HistoTab({ store }: Props) {
  const [editSession,    setEditSession]    = useState<Session | null>(null)
  const [expandedDates,  setExpandedDates]  = useState<Set<string>>(new Set())

  function toggleDate(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else                next.add(date)
      return next
    })
  }

  const byDate: Record<string, Session[]> = {}
  for (const s of store.sessions) {
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      {dates.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p className="text-3xl mb-2">📭</p>
          <p>Aucune session enregistrée</p>
          <p>Démarrez un chrono pour commencer !</p>
        </div>
      )}

      {dates.map(date => {
        const sessions  = byDate[date].sort((a, b) => b.startTime - a.startTime)
        const dayTotal  = sessions.reduce((a, s) => a + s.duration, 0)
        const expanded  = expandedDates.has(date)

        return (
          <div key={date}>
            {/* ── En-tête du jour (cliquable) ──────────────────────────── */}
            <button
              onClick={() => toggleDate(date)}
              className="w-full flex items-center justify-between px-1 mb-1.5 group">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 transition-transform duration-200"
                  style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  ▶
                </span>
                <span className="text-sm font-semibold text-gray-700 capitalize group-hover:text-gray-900">
                  {formatDateShort(date)}
                </span>
                <span className="text-xs text-gray-400">
                  ({sessions.length} session{sessions.length > 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500">{secondsToDisplay(dayTotal)}</span>
            </button>

            {/* ── Liste des sessions (dépliée) ─────────────────────────── */}
            {expanded && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {sessions.map((s, i) => {
                  const bloc  = store.blocs.find(b => b.id === s.blocId)
                  const color = bloc ? COLORS[bloc.color] : { main: '#9CA3AF', light: '#F9FAFB' }
                  return (
                    <div key={s.id}
                      className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: color.light }}>
                        {bloc?.icon ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900">{bloc?.name ?? 'Bloc supprimé'}</p>
                          <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                            {bloc?.isRest ? '🌴' : formatDuration(s.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!bloc?.isRest && <span className="text-xs text-gray-400">{formatTime(s.startTime)}</span>}
                          {s.config  && <Chip label={s.config}  color="#3B82F6" />}
                          {s.posture && <Chip label={s.posture} color="#8B5CF6" />}
                          {s.tag     && <Chip label={s.tag}     color="#6B7280" />}
                          {!s.config && !s.posture && !s.tag && !bloc?.isRest && (
                            <button onClick={() => setEditSession(s)} className="text-xs text-gray-400 italic">
                              + tag...
                            </button>
                          )}
                        </div>
                        {/* Charge cliquable — masquée pour le bloc Repos */}
                        {!bloc?.isRest && (
                          <ChargeDisplay
                            niveau={s.chargeNiveau}
                            onSelect={level => store.updateSession(s.id, { chargeNiveau: level })}
                          />
                        )}
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                        <button onClick={() => setEditSession(s)}
                          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-gray-500 rounded-lg">✏️</button>
                        <button onClick={() => store.deleteSession(s.id)}
                          className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 rounded-lg">🗑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <EditSessionModal
        open={!!editSession}
        session={editSession}
        blocs={store.blocs}
        settings={store.settings}
        onSave={patch => editSession && store.updateSession(editSession.id, patch)}
        onClose={() => setEditSession(null)}
      />
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: color + '22', color }}>{label}</span>
  )
}
