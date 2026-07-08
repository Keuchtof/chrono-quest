import { useState } from 'react'
import type { Store } from '../store'
import { COLORS, ZONE1_COLOR, ZONE2_COLOR } from '../constants'
import { formatTimer } from '../utils'
import AddSessionModal from '../components/AddSessionModal'
import ChargeSelector from '../components/ChargeSelector'
import MonthRanking from '../components/MonthRanking'
import TagPicker from '../components/TagPicker'

interface Props { store: Store; now: number }

export default function SuiviTab({ store, now }: Props) {
  const [showAdd, setShowAdd] = useState(false)

  const today = new Date()

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      <p className="text-xs font-semibold text-gray-400 tracking-wider">CHRONOS</p>

      {store.blocs.map(bloc => {
        const color      = COLORS[bloc.color]
        const isRunning  = store.activeTimer?.blocId === bloc.id
        const t          = isRunning ? store.activeTimer! : null
        const elapsedSecs = t ? Math.round((now - t.startTime) / 1000) : 0

        return (
          <div key={bloc.id} className="rounded-2xl shadow-sm overflow-hidden"
            style={{ backgroundColor: color.light, borderLeft: `4px solid ${color.main}` }}>

            {/* ── REPOS (non chronométrable) ────────────────────────────── */}
            {bloc.isRest && !isRunning && (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: '#E5E7EB' }}>
                  {bloc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-500">{bloc.name}</span>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5">Saisir via le bouton +</p>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider">REPOS</span>
              </div>
            )}

            {/* ── COMPACT (not running, not rest) ──────────────────────── */}
            {!isRunning && !bloc.isRest && (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: color.main + '22' }}>
                  {bloc.icon}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-900">{bloc.name}</span>
                <button
                  onClick={() => store.startTimer(bloc.id)}
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center active:opacity-80 transition-opacity flex-shrink-0"
                  style={{ backgroundColor: color.main }}>
                  <PlayIcon />
                </button>
              </div>
            )}

            {/* ── EXPANDED (running) ────────────────────────────────────── */}
            {isRunning && (
              <div className="p-4">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: color.main + '22' }}>
                    {bloc.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{bloc.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ● EN COURS
                      </span>
                    </div>
                    <p className="text-2xl font-bold leading-tight" style={{ color: color.main }}>
                      {formatTimer(elapsedSecs)}
                    </p>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-2 mb-3">
                  {/* Charge mentale */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Charge mentale</p>
                    <ChargeSelector
                      compact
                      value={t!.chargeNiveau}
                      onChange={v => store.setTimerMeta({ chargeNiveau: v })}
                    />
                  </div>
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
                  {/* Tag */}
                  <TagPicker
                    value={t!.tag}
                    onChange={v => store.setTimerMeta({ tag: v })}
                    tags={store.settings.tags ?? []}
                    onAddTag={store.addTag}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:border-blue-300 placeholder:text-gray-400"
                  />
                </div>

                {/* Stop button */}
                <button
                  onClick={() => store.stopTimer()}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
                  style={{ backgroundColor: color.main }}>
                  <PauseIcon /> Arrêter
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Classement du mois */}
      <div className="pt-2">
        <MonthRanking
          blocs={store.blocs} sessions={store.sessions} settings={store.settings}
          year={today.getFullYear()} month={today.getMonth()}
          activeTimer={store.activeTimer} now={now}
        />
      </div>

      {/* Quick-start FABs */}
      {(() => {
        const gestionBloc = store.blocs.find(b => b.name === 'Gestion')
        const develBloc   = store.blocs.find(b => b.name === 'Développement')
        const fabRight    = 'max(16px, calc((100vw - 448px) / 2 + 16px))'
        return (
          <>
            {gestionBloc && (
              <button
                title="Démarrer : Gestion de la boîte mail"
                onClick={() => {
                  store.startTimer(gestionBloc.id)
                  store.setTimerMeta({ config: 'Solo', posture: 'Pilote', zone: 'zone2', tag: 'Gestion de la boîte mail', chargeNiveau: 1 })
                }}
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
                style={{ position: 'fixed', bottom: '144px', right: fabRight, backgroundColor: '#7C3AED' }}>
                <MailIcon />
              </button>
            )}
            {develBloc && (
              <button
                title="Démarrer : Pôle Offre Communauté"
                onClick={() => {
                  store.startTimer(develBloc.id)
                  store.setTimerMeta({ config: 'Solo', posture: 'Pilote', zone: 'zone1', tag: 'Pôle Offre Communauté' })
                }}
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
                style={{ position: 'fixed', bottom: '208px', right: fabRight, backgroundColor: '#22C55E' }}>
                <span className="text-xs font-bold text-white tracking-wide">POC</span>
              </button>
            )}
          </>
        )
      })()}

      {/* FAB + */}
      <button onClick={() => setShowAdd(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: 'max(16px, calc((100vw - 448px) / 2 + 16px))' }}>
        +
      </button>

      <AddSessionModal open={showAdd} blocs={store.blocs} settings={store.settings}
        onAdd={store.addSession} onAddTag={store.addTag} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function PlayIcon()  { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> }
function PauseIcon() { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> }
function MailIcon()  {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  )
}
