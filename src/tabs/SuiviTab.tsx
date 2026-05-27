import { useState } from 'react'
import type { Store } from '../store'
import { COLORS } from '../constants'
import { formatTimer, secondsToDisplay, getMonthSessions } from '../utils'
import Modal from '../components/Modal'
import AddSessionModal from '../components/AddSessionModal'

interface Props { store: Store; now: number }

export default function SuiviTab({ store, now }: Props) {
  const [metaBlocId, setMetaBlocId] = useState<string | null>(null)
  const [metaTag,    setMetaTag]    = useState('')
  const [metaConfig, setMetaConfig] = useState('')
  const [metaPosture,setMetaPosture]= useState('')
  const [showAdd,    setShowAdd]    = useState(false)

  const today = new Date()
  const monthSessions = getMonthSessions(store.sessions, today.getFullYear(), today.getMonth())

  function getBlocMonthSeconds(blocId: string) {
    const base = monthSessions.filter(s => s.blocId === blocId).reduce((a, s) => a + s.duration, 0)
    const extra = store.activeTimer?.blocId === blocId
      ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
    return base + extra
  }

  function openMeta(blocId: string) {
    const t = store.activeTimer
    if (t?.blocId === blocId) {
      setMetaTag(t.tag)
      setMetaConfig(t.config)
      setMetaPosture(t.posture)
    } else {
      setMetaTag(''); setMetaConfig(''); setMetaPosture('')
    }
    setMetaBlocId(blocId)
  }

  function saveMeta() {
    if (store.activeTimer?.blocId === metaBlocId) {
      store.setTimerMeta({ tag: metaTag, config: metaConfig, posture: metaPosture })
    }
    setMetaBlocId(null)
  }

  // Classement mensuel
  const ranked = [...store.blocs]
    .map(b => ({ bloc: b, secs: getBlocMonthSeconds(b.id) }))
    .sort((a, b) => b.secs - a.secs)

  const rankColors = ['#EAB308','#6B7280','#B45309','#3B82F6','#8B5CF6']

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      <p className="text-xs font-semibold text-gray-400 tracking-wider">CHRONOS</p>

      {store.blocs.map(bloc => {
        const color = COLORS[bloc.color]
        const isRunning = store.activeTimer?.blocId === bloc.id
        const elapsedSecs = isRunning ? Math.round((now - store.activeTimer!.startTime) / 1000) : 0
        const t = isRunning ? store.activeTimer! : null

        return (
          <div
            key={bloc.id}
            className="rounded-2xl p-4 shadow-sm"
            style={{ backgroundColor: color.light, borderLeft: `4px solid ${color.main}` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: color.main + '22' }}>
                {bloc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{bloc.name}</span>
                  {isRunning && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">● EN COURS</span>
                  )}
                </div>
                <p className="text-2xl font-bold leading-tight mt-0.5"
                  style={{ color: isRunning ? color.main : '#111827' }}>
                  {formatTimer(elapsedSecs)}
                </p>
              </div>
            </div>

            {/* Zone tags / dimensions — cliquable */}
            <button
              onClick={() => openMeta(bloc.id)}
              className="w-full text-left mb-3"
            >
              {(t?.config || t?.posture || t?.tag) ? (
                <div className="flex flex-wrap gap-1.5">
                  {t.config  && <Chip label={t.config}  color={color.main} />}
                  {t.posture && <Chip label={t.posture} color="#8B5CF6" />}
                  {t.tag     && <Chip label={t.tag}     color="#6B7280" />}
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  🏷 <span>Ajouter un tag...</span>
                </span>
              )}
            </button>

            {/* Bouton Démarrer / Arrêter */}
            <button
              onClick={() => isRunning ? store.stopTimer() : store.startTimer(bloc.id)}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity active:opacity-80"
              style={{ backgroundColor: color.main }}
            >
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
      <button
        onClick={() => setShowAdd(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: 'max(16px, calc((100vw - 448px) / 2 + 16px))' }}
      >+</button>

      {/* Dialog tag + dimensions */}
      <Modal open={!!metaBlocId} onClose={() => setMetaBlocId(null)} title="Tag & dimensions">
        <div className="space-y-4">
          <DimSelector
            label="Configuration"
            options={store.settings.configurations}
            value={metaConfig}
            onChange={setMetaConfig}
            color="#3B82F6"
          />
          <DimSelector
            label="Posture"
            options={store.settings.postures}
            value={metaPosture}
            onChange={setMetaPosture}
            color="#8B5CF6"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Tag libre</p>
            <input
              type="text"
              value={metaTag}
              onChange={e => setMetaTag(e.target.value)}
              placeholder="Ex : Séminaire Alpes..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setMetaBlocId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Annuler</button>
            <button onClick={saveMeta} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white">OK</button>
          </div>
        </div>
      </Modal>

      <AddSessionModal
        open={showAdd}
        blocs={store.blocs}
        settings={store.settings}
        onAdd={store.addSession}
        onClose={() => setShowAdd(false)}
      />
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: color + '22', color }}>
      {label}
    </span>
  )
}

function DimSelector({ label, options, value, onChange, color }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; color: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button
            key={o}
            onClick={() => onChange(value === o ? '' : o)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
            style={value === o
              ? { backgroundColor: color, color: '#fff', borderColor: color }
              : { backgroundColor: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }}
          >{o}</button>
        ))}
      </div>
    </div>
  )
}

function PlayIcon()  { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> }
function PauseIcon() { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> }
