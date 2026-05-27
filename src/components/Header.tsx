import type { Store } from '../store'
import { formatMonthYear, getMonthSessions, secondsToDisplay } from '../utils'
import { COLORS } from '../constants'

interface Props { store: Store; now: number }

export default function Header({ store, now }: Props) {
  const today = new Date()
  const monthSessions = getMonthSessions(store.sessions, today.getFullYear(), today.getMonth())
  const monthTotal = monthSessions.reduce((s, sess) => s + sess.duration, 0)
  const activeExtra = store.activeTimer ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
  const totalSecs = monthTotal + activeExtra
  const objectiveSecs = store.settings.joursParMois * store.settings.heuresParJour * 3600
  const progress = objectiveSecs > 0 ? Math.min(totalSecs / objectiveSecs, 1) : 0

  const activeBloc = store.activeTimer ? store.blocs.find(b => b.id === store.activeTimer!.blocId) : null
  const barColor = activeBloc ? COLORS[activeBloc.color].main : '#3B82F6'

  return (
    <header className="bg-white px-4 pt-4 pb-3 shadow-sm flex-shrink-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Chrono Quest</h1>
          <p className="text-xs text-gray-400 capitalize">{formatMonthYear(today)}</p>
        </div>
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
