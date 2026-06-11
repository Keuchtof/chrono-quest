import { useMemo } from 'react'
import type { Store } from '../store'
import { formatMonthYear, getMonthSessions, secondsToDisplay, calcVitals, getMonthObjectiveSecs, pvColor } from '../utils'
import { COLORS } from '../constants'

interface Props { store: Store; now: number }

export default function Header({ store, now }: Props) {
  const today = new Date()
  const reposId = store.blocs.find(b => b.isRest)?.id ?? 'b_repos'
  const monthSessions = getMonthSessions(store.sessions, today.getFullYear(), today.getMonth())
  const monthTotal = monthSessions.filter(s => s.blocId !== reposId).reduce((s, sess) => s + sess.duration, 0)
  const activeExtra = store.activeTimer ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
  const totalSecs = monthTotal + activeExtra
  const objectiveSecs = getMonthObjectiveSecs(store.sessions, store.settings, today.getFullYear(), today.getMonth(), reposId)
  const progress = objectiveSecs > 0 ? Math.min(totalSecs / objectiveSecs, 1) : 0

  const activeBloc = store.activeTimer ? store.blocs.find(b => b.id === store.activeTimer!.blocId) : null
  const barColor = activeBloc ? COLORS[activeBloc.color].main : '#3B82F6'

  const vitals  = useMemo(
    () => calcVitals(store.sessions, reposId, store.settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.sessions, store.settings, reposId]
  )

  const pvCol       = pvColor(vitals.pv)
  const pvLabel     = vitals.pv % 1 === 0 ? String(Math.round(vitals.pv)) : vitals.pv.toFixed(1)
  const energyColor = vitals.energy >= 60 ? '#22C55E' : vitals.energy >= 30 ? '#F59E0B' : '#EF4444'

  return (
    <header className="bg-white px-4 pt-4 pb-3 shadow-sm flex-shrink-0">
      <div className="flex items-start justify-between mb-2">

        {/* Gauche : titre + REC */}
        <div>
          <div className="flex items-center gap-2 leading-tight">
            <h1 className="text-lg font-bold text-gray-900">Chrono Quest</h1>
            {store.activeTimer && (
              <span className="flex items-center gap-1">
                <span className="animate-rec-blink w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-red-500 tracking-widest">REC</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 capitalize">{formatMonthYear(today)}</p>
        </div>

        {/* Centre : Énergie + PV */}
        <div className="flex flex-col items-center pt-0.5">
          <div className="flex items-center gap-2 leading-none mb-0.5">
            <span className={`text-sm font-bold ${vitals.energy < 30 ? 'animate-rec-blink' : ''}`}
              style={{ color: energyColor }}>⚡{vitals.energy}%</span>
            <span className="w-px h-3.5 bg-gray-200 flex-shrink-0" />
            <span className="text-sm font-bold" style={{ color: pvCol }}>❤️{pvLabel}</span>
          </div>
          <span className="text-[9px] font-semibold text-gray-400 tracking-wider leading-none">NRJ · VIE</span>
        </div>

        {/* Droite : heures du mois */}
        <div className="text-right">
          <span className="text-base font-bold text-gray-900">{secondsToDisplay(totalSecs)}</span>
          <span className="text-sm text-gray-400"> / {secondsToDisplay(objectiveSecs)}</span>
        </div>

      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, backgroundColor: barColor }} />
      </div>
    </header>
  )
}
