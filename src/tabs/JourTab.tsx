import { useState } from 'react'
import type { Store } from '../store'
import { COLORS } from '../constants'
import { formatDateFull, formatDuration, secondsToDisplay, getDaySessions, getDateStr, addDays, formatTime } from '../utils'
import DonutChart from '../components/DonutChart'
import Drawer from '../components/Drawer'
import EditSessionModal from '../components/EditSessionModal'
import AddSessionModal from '../components/AddSessionModal'
import type { Session } from '../types'

interface Props { store: Store; now: number }

export default function JourTab({ store, now }: Props) {
  const [date,        setDate]        = useState(getDateStr())
  const [activeBloc,  setActiveBloc]  = useState<string | null>(null)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)

  const isToday = date === getDateStr()

  let daySessions = getDaySessions(store.sessions, date)
  // Include running timer if viewing today
  const activeExtra: number = (isToday && store.activeTimer)
    ? Math.round((now - store.activeTimer.startTime) / 1000) : 0

  // Per-bloc stats for the day
  const blocStats = store.blocs
    .map(b => {
      const bSessions = daySessions.filter(s => s.blocId === b.id)
      const extra = (isToday && store.activeTimer?.blocId === b.id) ? activeExtra : 0
      const totalSecs = bSessions.reduce((a, s) => a + s.duration, 0) + extra
      const count = bSessions.length + (extra > 0 ? 1 : 0)
      const avgSecs = count > 0 ? Math.round(totalSecs / count) : 0
      const tags = [...new Set(bSessions.map(s => s.tag).filter(Boolean))]
      return { bloc: b, totalSecs, count, avgSecs, tags }
    })
    .filter(b => b.totalSecs > 0)

  const dayTotal = blocStats.reduce((a, b) => a + b.totalSecs, 0)
  const dailyObjective = store.settings.heuresParJour * 3600
  const progress = dailyObjective > 0 ? Math.min(dayTotal / dailyObjective, 1) : 0
  const sessionCount = daySessions.length + (isToday && store.activeTimer ? 1 : 0)
  const subjectCount = new Set(daySessions.map(s => s.blocId)).size

  const donutSegments = blocStats.map(b => ({
    id: b.bloc.id,
    value: b.totalSecs,
    color: COLORS[b.bloc.color].main,
  }))

  const drawerBloc = activeBloc ? store.blocs.find(b => b.id === activeBloc) : null
  const drawerSessions = activeBloc ? daySessions.filter(s => s.blocId === activeBloc) : []

  return (
    <div className="px-4 pt-4 pb-4 space-y-3">
      {/* Date navigation */}
      <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-sm">
        <button
          onClick={() => setDate(d => addDays(d, -1))}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
        >‹</button>
        <span className="text-sm font-semibold text-gray-800 capitalize">{formatDateFull(date)}</span>
        <button
          onClick={() => setDate(d => addDays(d, 1))}
          disabled={isToday}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
        >›</button>
      </div>

      {/* Day summary card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex gap-4 items-center">
          <DonutChart
            segments={donutSegments}
            size={120}
            thickness={22}
            centerLabel={secondsToDisplay(dayTotal)}
            onSegmentClick={id => setActiveBloc(id)}
            activeId={activeBloc}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-orange-500 tracking-wide mb-0.5">TEMPS DU JOUR</p>
            <p className="text-xl font-bold text-gray-900">
              {secondsToDisplay(dayTotal)} <span className="text-sm font-normal text-gray-400">/ {secondsToDisplay(dailyObjective)}</span>
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5 mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress * 100}%`,
                  background: 'linear-gradient(to right, #3B82F6, #22C55E)',
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-xs text-gray-500">Sessions</p>
                <p className="text-base font-bold text-gray-900">{sessionCount}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-xs text-gray-500">Sujets</p>
                <p className="text-base font-bold text-gray-900">{subjectCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-bloc breakdown */}
      {blocStats.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Aucune session ce jour</div>
      )}
      {blocStats.map(({ bloc, totalSecs, count, avgSecs }) => {
        const color = COLORS[bloc.color]
        const pct = dayTotal > 0 ? Math.round((totalSecs / dayTotal) * 100) : 0
        return (
          <button
            key={bloc.id}
            onClick={() => setActiveBloc(activeBloc === bloc.id ? null : bloc.id)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm text-left transition-all active:scale-[0.99]"
            style={activeBloc === bloc.id ? { outline: `2px solid ${color.main}` } : {}}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: color.light }}>
                {bloc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">{bloc.name}</span>
                <p className="text-xs text-gray-500">{count} session{count > 1 ? 's' : ''} · moy. {formatDuration(avgSecs)}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{secondsToDisplay(totalSecs)}</span>
                <p className="text-xs text-gray-400">{pct}%</p>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color.main }} />
            </div>
          </button>
        )
      })}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: 'max(16px, calc((100vw - 448px) / 2 + 16px))' }}
      >+</button>

      {/* Sessions drawer */}
      <Drawer
        open={!!activeBloc}
        onClose={() => setActiveBloc(null)}
        title={drawerBloc ? `${drawerBloc.icon} ${drawerBloc.name}` : ''}
      >
        {drawerSessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune session enregistrée</p>
        ) : (
          <div className="space-y-2">
            {drawerSessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatTime(s.startTime)}</span>
                    {s.tag && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{s.tag}</span>}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatDuration(s.duration)}</span>
                </div>
                <button
                  onClick={() => setEditSession(s)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                >✏️</button>
                <button
                  onClick={() => store.deleteSession(s.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                >🗑</button>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <EditSessionModal
        open={!!editSession}
        session={editSession}
        blocs={store.blocs}
        onSave={patch => editSession && store.updateSession(editSession.id, patch)}
        onClose={() => setEditSession(null)}
      />

      <AddSessionModal
        open={showAdd}
        blocs={store.blocs}
        defaultDate={date}
        onAdd={store.addSession}
        onClose={() => setShowAdd(false)}
      />
    </div>
  )
}
