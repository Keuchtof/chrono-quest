import { useState } from 'react'
import type { Store } from '../store'
import { COLORS, ZONE1_COLOR, ZONE2_COLOR } from '../constants'
import { formatTimer, secondsToDisplay, getMonthSessions } from '../utils'
import AddSessionModal from '../components/AddSessionModal'

interface Props { store: Store; now: number }

export default function SuiviTab({ store, now }: Props) {
  const [showAdd, setShowAdd] = useState(false)

  const today = new Date()
  const monthSessions = getMonthSessions(store.sessions, today.getFullYear(), today.getMonth())

  function getBlocMonthSeconds(blocId: string) {
    const base = monthSessions.filter(s => s.blocId === blocId).reduce((a, s) => a + s.duration, 0)
    const extra = store.activeTimer?.blocId === blocId
      ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
    return base + extra
  }

  const ranked = [...store.blocs]
    .map(b => ({ bloc: b, secs: getBlocMonthSeconds(b.id) }))
    .sort((a, b) => b.secs - a.secs)

  const rankColors = ['#EAB308', '#6B7280', '#B45309', '#3B82F6', '#8B5CF6']

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      <p className="text-xs font-semibold text-gray-400 tracking-wider">CHRONOS</p>

      {store.blocs.map(bloc => {
        const color = COLORS[bloc.color]
        const isRunning = store.activeTimer?.blocId === bloc.id
        const t = isRunning ? store.activeTimer! : null
        const elapsedSecs = t ? Math.round((now - t.startTime) / 1000) : 0

        return (
          <div key={bloc.id} className="rounded-2xl p-4 shadow-sm"
            style={{ backgroundColor: color.light, borderLeft: `4px solid ${color.main}` }}>

            {/* En-tête : icône + nom + timer */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: color.main + '22' }}>
                {bloc.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{bloc.name}</span>
                  {isRunning && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      ● EN COURS
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold leading-tight"
                  style={{ color: isRunning ? color.main : '#111827' }}>
                  {formatTimer(elapsedSecs)}
                </p>
              </div>
            </div>

            {/* Dimensions inline (visibles seulement quand EN COURS) */}
            {isRunning && (
              <div className="space-y-2 mb-3">
                {/* Configuration */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Configuration</p>
                  <div className="flex flex-wrap gap-1.5">
                    {store.settings.configurations.map(c => (
                      <button key={c}
                        onClick={() => store.setTimerMeta({ config: t!.config === c ? '' : c })}
                        className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                        style={t!.config === c
                          ? { backgroundColor: color.main, color: '#fff', borderColor: color.main }
                          : { backgroundColor: '#ffffff88', color: '#374151', borderColor: '#D1D5DB' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Posture */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Posture</p>
                  <div className="flex flex-wrap gap-1.5">
                    {store.settings.postures.map(p => (
                      <button key={p}
                        onClick={() => store.setTimerMeta({ posture: t!.posture === p ? '' : p })}
                        className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                        style={t!.posture === p
                          ? { backgroundColor: '#8B5CF6', color: '#fff', borderColor: '#8B5CF6' }
                          : { backgroundColor: '#ffffff88', color: '#374151', borderColor: '#D1D5DB' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Zone */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Zone</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => store.setTimerMeta({ zone: t!.zone === 'zone1' ? '' : 'zone1' })}
                      className="flex-1 py-1.5 rounded-xl border font-medium text-xs transition-all"
                      style={t!.zone === 'zone1'
                        ? { backgroundColor: ZONE1_COLOR, color: '#fff', borderColor: ZONE1_COLOR }
                        : { backgroundColor: '#ffffff88', color: '#374151', borderColor: '#D1D5DB' }}>
                      {store.settings.zoneName1}
                    </button>
                    <button
                      onClick={() => store.setTimerMeta({ zone: t!.zone === 'zone2' ? '' : 'zone2' })}
                      className="flex-1 py-1.5 rounded-xl border font-medium text-xs transition-all"
                      style={t!.zone === 'zone2'
                        ? { backgroundColor: ZONE2_COLOR, color: '#fff', borderColor: ZONE2_COLOR }
                        : { backgroundColor: '#ffffff88', color: '#374151', borderColor: '#D1D5DB' }}>
                      {store.settings.zoneName2}
                    </button>
                  </div>
                </div>
                {/* Tag libre */}
                <input
                  type="text"
                  value={t!.tag}
                  onChange={e => store.setTimerMeta({ tag: e.target.value })}
                  placeholder="Tag libre (optionnel)..."
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:border-blue-300 placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Résumé des dimensions si non-vides et timer arrêté */}
            {!isRunning && (
              <div className="mb-3 min-h-[1rem]" />
            )}

            {/* Bouton Start / Stop */}
            <button
              onClick={() => isRunning ? store.stopTimer() : store.startTimer(bloc.id)}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
              style={{ backgroundColor: color.main }}>
              {isRunning ? <><PauseIcon /> Arrêter</> : <><PlayIcon /> Démarrer</>}
            </button>
          </div>
        )
      })}

      {/* Classement du mois */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">CLASSEMENT DU MOIS</p>
        <div className="space-y-2">
          {ranked.map(({ bloc, secs }, i) => {
            const objSecs = bloc.objectifJours * store.settings.heuresParJour * 3600
            const progress = objSecs > 0 ? Math.min(secs / objSecs, 1) : 0
            const color = COLORS[bloc.color]
            return (
              <div key={bloc.id} className="bg-white rounded-xl px-3 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: rankColors[i] ?? '#9CA3AF' }}>{i + 1}</span>
                  <span className="text-base">{bloc.icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{bloc.name}</span>
                  <span className="text-xs text-gray-500">{secondsToDisplay(secs)} / {secondsToDisplay(objSecs)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%`, backgroundColor: color.main }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: 'max(16px, calc((100vw - 448px) / 2 + 16px))' }}>
        +
      </button>

      <AddSessionModal open={showAdd} blocs={store.blocs} settings={store.settings}
        onAdd={store.addSession} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function PlayIcon()  { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> }
function PauseIcon() { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> }
