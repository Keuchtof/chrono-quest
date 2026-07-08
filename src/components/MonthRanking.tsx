import { useState } from 'react'
import type { Bloc, Session, Settings, ActiveTimer } from '../types'
import { COLORS } from '../constants'
import { getMonthSessions, secondsToDisplay, formatDuration, formatDateShort } from '../utils'

interface Props {
  blocs:       Bloc[]
  sessions:    Session[]
  settings:    Settings
  year:        number
  month:       number
  activeTimer?: ActiveTimer | null
  now?:        number
}

const RANK_COLORS = ['#EAB308', '#6B7280', '#B45309', '#3B82F6', '#8B5CF6']

/**
 * Classement des blocs sur un mois donné. Chaque ligne est cliquable et
 * déplie la liste des sessions du mois (de la plus ancienne à la plus récente).
 */
export default function MonthRanking({ blocs, sessions, settings, year, month, activeTimer, now }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const today          = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const monthSessions  = getMonthSessions(sessions, year, month)

  const ranked = [...blocs]
    .map(b => {
      const base  = monthSessions.filter(s => s.blocId === b.id).reduce((a, s) => a + s.duration, 0)
      const extra = isCurrentMonth && activeTimer?.blocId === b.id && now
        ? Math.round((now - activeTimer.startTime) / 1000) : 0
      return { bloc: b, secs: base + extra }
    })
    .sort((a, b) => b.secs - a.secs)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">CLASSEMENT DU MOIS</p>
      <div className="space-y-2">
        {ranked.map(({ bloc, secs }, i) => {
          const objSecs  = bloc.objectifJours * settings.heuresParJour * 3600
          const progress = objSecs > 0 ? Math.min(secs / objSecs, 1) : 0
          const color    = COLORS[bloc.color]
          const isOpen   = expanded === bloc.id
          const blocSessions = isOpen
            ? monthSessions
                .filter(s => s.blocId === bloc.id)
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime - b.startTime)
            : []

          return (
            <div key={bloc.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : bloc.id)}
                className="w-full px-3 py-2.5 text-left active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: RANK_COLORS[i] ?? '#9CA3AF' }}>{i + 1}</span>
                  <span className="text-base">{bloc.icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{bloc.name}</span>
                  <span className="text-xs text-gray-500">{secondsToDisplay(secs)} / {secondsToDisplay(objSecs)}</span>
                  <span className="text-[10px] text-gray-300">{isOpen ? '▲' : '▼'}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%`, backgroundColor: color.main }} />
                </div>
              </button>

              {/* Sessions du mois (plus ancienne → plus récente) */}
              {isOpen && (
                <div className="border-t border-gray-50 px-3 py-1.5">
                  {blocSessions.length === 0 ? (
                    <p className="text-xs text-gray-400 py-1.5">Aucune session ce mois</p>
                  ) : (
                    blocSessions.map(s => (
                      <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-b-0">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0 capitalize">{formatDateShort(s.date)}</span>
                        <span className="text-xs font-semibold text-gray-700 w-14 flex-shrink-0">
                          {bloc.isRest ? '🌴' : formatDuration(s.duration)}
                        </span>
                        <span className="text-xs text-gray-400 truncate">{s.tag || '—'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
