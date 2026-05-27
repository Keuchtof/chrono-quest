import { useState } from 'react'
import type { Store } from '../store'
import { COLORS, SUGGESTED_TAGS } from '../constants'
import { formatTimer, formatDuration, secondsToDisplay, getMonthSessions } from '../utils'
import Modal from '../components/Modal'
import AddSessionModal from '../components/AddSessionModal'

interface Props { store: Store; now: number }

export default function SuiviTab({ store, now }: Props) {
  const [tagBlocId, setTagBlocId] = useState<string | null>(null)
  const [tagValue,  setTagValue]  = useState('')
  const [showAdd,   setShowAdd]   = useState(false)

  const today = new Date()
  const monthSessions = getMonthSessions(store.sessions, today.getFullYear(), today.getMonth())

  function getBlocMonthSeconds(blocId: string) {
    const base = monthSessions.filter(s => s.blocId === blocId).reduce((a, s) => a + s.duration, 0)
    const extra = store.activeTimer?.blocId === blocId
      ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
    return base + extra
  }

  function handleTagOpen(blocId: string) {
    const current = store.activeTimer?.blocId === blocId ? store.activeTimer.tag : ''
    setTagValue(current)
    setTagBlocId(blocId)
  }

  function handleTagSave() {
    if (store.activeTimer?.blocId === tagBlocId) {
      store.setTimerTag(tagValue)
    }
    setTagBlocId(null)
  }

  // Monthly ranking
  const ranked = [...store.blocs]
    .map(b => ({ bloc: b, secs: getBlocMonthSeconds(b.id) }))
    .sort((a, b) => b.secs - a.secs)

  const rankColors = ['#EAB308','#6B7280','#B45309','#3B82F6','#8B5CF6']

  return (
    <div className="px-4 pt-4 pb-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 tracking-wider">CHRONOS</p>

      {store.blocs.map(bloc => {
        const color = COLORS[bloc.color]
        const isRunning = store.activeTimer?.blocId === bloc.id
        const elapsedSecs = isRunning ? Math.round((now - store.activeTimer!.startTime) / 1000) : 0
        const tag = isRunning ? store.activeTimer!.tag : ''

        return (
          <div
            key={bloc.id}
            className="rounded-2xl p-4 shadow-sm"
            style={{ backgroundColor: color.light, borderLeft: `4px solid ${color.main}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: color.main + '22' }}
                >{bloc.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{bloc.name}</span>
                    {isRunning && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF08A', color: '#92400E' }}>● EN COURS</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5" style={{ color: isRunning ? color.main : undefined }}>
                    {formatTimer(elapsedSecs)}
                  </p>
                  {tag ? (
                    <button onClick={() => handleTagOpen(bloc.id)} className="flex items-center gap-1 text-xs mt-0.5" style={{ color: color.main }}>
                      <span>🏷</span><span>{tag}</span>
                    </button>
                  ) : (
                    <button onClick={() => handleTagOpen(bloc.id)} className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <span>🏷</span><span>Ajouter un tag...</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => isRunning ? store.stopTimer() : store.startTimer(bloc.id)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity active:opacity-80"
                style={{ backgroundColor: color.main }}
              >
                {isRunning
                  ? <><PauseIcon /> Arrêter</>
                  : <><PlayIcon /> Démarrer</>
                }
              </button>
              <button
                onClick={() => handleTagOpen(bloc.id)}
                className="w-11 rounded-xl border flex items-center justify-center"
                style={{ borderColor: color.main + '44', backgroundColor: '#ffffff88' }}
              >
                <TagIcon color={color.main} />
              </button>
            </div>
          </div>
        )
      })}

      {/* Monthly ranking */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">CLASSEMENT DU MOIS</p>
        <div className="space-y-2">
          {ranked.map(({ bloc, secs }, i) => {
            const objectiveSecs = bloc.objectifJours * store.settings.heuresParJour * 3600
            const progress = objectiveSecs > 0 ? Math.min(secs / objectiveSecs, 1) : 0
            const color = COLORS[bloc.color]
            return (
              <div key={bloc.id} className="bg-white rounded-xl px-3 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: rankColors[i] ?? '#9CA3AF' }}>
                    {i + 1}
                  </span>
                  <span className="text-base">{bloc.icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{bloc.name}</span>
                  <span className="text-xs text-gray-500">{secondsToDisplay(secs)} / {secondsToDisplay(objectiveSecs)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress * 100}%`, backgroundColor: color.main }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
      >+</button>

      {/* Tag dialog */}
      <Modal open={!!tagBlocId} onClose={() => setTagBlocId(null)} title="Tag de la session">
        <div className="space-y-3">
          <input
            type="text"
            value={tagValue}
            onChange={e => setTagValue(e.target.value)}
            placeholder="Ex : Séminaire Alpes..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map(t => (
              <button
                key={t}
                onClick={() => setTagValue(t === tagValue ? '' : t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${tagValue === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
              >{t}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTagBlocId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Annuler</button>
            <button onClick={handleTagSave} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white">OK</button>
          </div>
        </div>
      </Modal>

      <AddSessionModal
        open={showAdd}
        blocs={store.blocs}
        onAdd={store.addSession}
        onClose={() => setShowAdd(false)}
      />
    </div>
  )
}

function PlayIcon() {
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
}
function PauseIcon() {
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
}
function TagIcon({ color }: { color: string }) {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 00.586 1.414l9 9a2 2 0 002.828 0l4-4a2 2 0 000-2.828l-9-9A2 2 0 007 3z"/></svg>
}
