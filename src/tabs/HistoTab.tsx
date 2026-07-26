import { useState } from 'react'
import type { Store } from '../store'
import { COLORS } from '../constants'
import { formatDateShort, formatDuration, secondsToDisplay, formatTime, MONTHS } from '../utils'
import EditSessionModal from '../components/EditSessionModal'
import AddSessionModal from '../components/AddSessionModal'
import { ChargeDisplay } from '../components/ChargeSelector'
import type { Session } from '../types'

interface Props { store: Store }

function monthKey(date: string) { return date.slice(0, 7) }               // 'YYYY-MM'
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${y}`
}

export default function HistoTab({ store }: Props) {
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)

  const curMonth = new Date().toISOString().slice(0, 7)
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  function toggleMonth(key: string) {
    setCollapsedMonths(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else               next.add(key)
      return next
    })
  }

  // Regroupe sessions → mois → dates
  const byMonth: Record<string, Record<string, Session[]>> = {}
  for (const s of store.sessions) {
    const mk = monthKey(s.date)
    if (!byMonth[mk]) byMonth[mk] = {}
    if (!byMonth[mk][s.date]) byMonth[mk][s.date] = []
    byMonth[mk][s.date].push(s)
  }
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))

  const fabRight = 'max(16px, calc((100vw - 448px) / 2 + 16px))'

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      {months.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p className="text-3xl mb-2">📭</p>
          <p>Aucune session enregistrée</p>
          <p>Démarrez un chrono pour commencer !</p>
        </div>
      )}

      {months.map(mk => {
        // Par défaut : mois en cours déplié, autres repliés.
        // `collapsedMonths` mémorise les inversions par rapport à ce défaut.
        const isCollapsed = collapsedMonths.has(mk) ? mk === curMonth : mk !== curMonth
        const dates      = Object.keys(byMonth[mk]).sort((a, b) => b.localeCompare(a))
        const monthTotal = dates.reduce((a, d) => a + byMonth[mk][d].reduce((x, s) => x + s.duration, 0), 0)

        return (
          <div key={mk}>
            {/* En-tête du mois (cliquable) */}
            <button onClick={() => toggleMonth(mk)}
              className="w-full flex items-center justify-between px-1 mb-2 group">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 transition-transform duration-200"
                  style={{ display: 'inline-block', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>▶</span>
                <span className="text-sm font-bold text-gray-800 capitalize group-hover:text-gray-900">{monthLabel(mk)}</span>
              </div>
              <span className="text-xs font-semibold text-gray-500">{secondsToDisplay(monthTotal)}</span>
            </button>

            {!isCollapsed && (
              <div className="space-y-3">
                {dates.map(date => {
                  const sessions = byMonth[mk][date].sort((a, b) => b.startTime - a.startTime)
                  const dayTotal = sessions.reduce((a, s) => a + s.duration, 0)
                  return (
                    <div key={date}>
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span className="text-xs font-semibold text-gray-600 capitalize">{formatDateShort(date)}</span>
                        <span className="text-[11px] text-gray-400">{secondsToDisplay(dayTotal)}</span>
                      </div>
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* FAB + */}
      <button onClick={() => setShowAdd(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: fabRight }}>+</button>

      <EditSessionModal
        open={!!editSession}
        session={editSession}
        blocs={store.blocs}
        settings={store.settings}
        onSave={patch => editSession && store.updateSession(editSession.id, patch)}
        onAddTag={store.addTag}
        onClose={() => setEditSession(null)}
      />

      <AddSessionModal open={showAdd} blocs={store.blocs} settings={store.settings}
        onAdd={store.addSession} onAddTag={store.addTag} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: color + '22', color }}>{label}</span>
  )
}
