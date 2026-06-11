import { useState } from 'react'
import Modal from './Modal'
import type { Bloc, Session, Settings } from '../types'
import { getDateStr, generateId } from '../utils'
import ChargeSelector from './ChargeSelector'
import { REPOS_MOTIFS, REPOS_MOMENTS } from '../constants'

interface Props {
  open: boolean
  blocs: Bloc[]
  settings: Settings
  defaultDate?: string
  onAdd: (s: Omit<Session, 'id'>) => void
  onClose: () => void
}

export default function AddSessionModal({ open, blocs, settings, defaultDate, onAdd, onClose }: Props) {
  const [blocId,       setBlocId]       = useState(blocs[0]?.id ?? '')
  const [tag,          setTag]          = useState('')
  const [config,       setConfig]       = useState('')
  const [posture,      setPosture]      = useState('')
  const [zone,         setZone]         = useState('')
  const [hours,        setHours]        = useState('0')
  const [minutes,      setMinutes]      = useState('30')
  const [date,         setDate]         = useState(defaultDate ?? getDateStr())
  const [startTimeStr, setStartTimeStr] = useState(() => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
  })
  const [chargeNiveau, setChargeNiveau] = useState(0)

  function reset() {
    const n = new Date()
    setStartTimeStr(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`)
    setTag(''); setConfig(''); setPosture(''); setZone('')
    setHours('0'); setMinutes('30')
    setDate(getDateStr())
    setChargeNiveau(0)
  }

  const isRest = blocs.find(b => b.id === blocId)?.isRest ?? false

  function handleAdd() {
    if (!blocId) return
    if (isRest) {
      // Congé/repos : pas de durée — le jour est marqué, l'objectif du jour est ajusté
      const startTs = new Date(date + 'T12:00:00').getTime()
      onAdd({ blocId, date, startTime: startTs, endTime: startTs, duration: 0,
        tag, config: config || 'Journée', posture: '', zone: '', chargeNiveau: 0 })
    } else {
      const duration = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60
      if (duration < 1) return
      const startTs = new Date(date + 'T' + startTimeStr + ':00').getTime()
      onAdd({ blocId, date, startTime: startTs, endTime: startTs + duration * 1000, duration, tag, config, posture, zone, chargeNiveau })
    }
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une session">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bloc</label>
          <select value={blocId} onChange={e => setBlocId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400">
            {blocs.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
        </div>

        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type="number" min="0" max="23" value={hours} onChange={e => setHours(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">h</span>
              </div>
              <div className="flex-1 relative">
                <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 pr-10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} max={getDateStr()} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </div>

        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
            <input type="time" value={startTimeStr} onChange={e => setStartTimeStr(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
          </div>
        )}

        {/* ── Champs spécifiques selon le type de bloc ──────────────── */}
        {blocs.find(b => b.id === blocId)?.isRest ? (
          <ReposFields motif={tag} moment={config} onMotif={setTag} onMoment={setConfig} />
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Charge mentale</label>
              <ChargeSelector value={chargeNiveau} onChange={setChargeNiveau} />
            </div>

            <DimSelector label="Configuration" options={settings.configurations} value={config} onChange={setConfig} color="#3B82F6" />
            <DimSelector label="Posture"        options={settings.postures}       value={posture} onChange={setPosture} color="#8B5CF6" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
              <div className="flex gap-2">
                <button onClick={() => setZone(zone === 'zone1' ? '' : 'zone1')}
                  className="flex-1 py-2 rounded-xl border text-sm font-medium transition-colors"
                  style={zone === 'zone1'
                    ? { backgroundColor: '#3B82F6', color: '#fff', borderColor: '#3B82F6' }
                    : { backgroundColor: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }}>
                  {settings.zoneName1}
                </button>
                <button onClick={() => setZone(zone === 'zone2' ? '' : 'zone2')}
                  className="flex-1 py-2 rounded-xl border text-sm font-medium transition-colors"
                  style={zone === 'zone2'
                    ? { backgroundColor: '#F97316', color: '#fff', borderColor: '#F97316' }
                    : { backgroundColor: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }}>
                  {settings.zoneName2}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag libre <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input type="text" value={tag} onChange={e => setTag(e.target.value)}
                placeholder="Ex : Séminaire Alpes..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Annuler</button>
          <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white">Ajouter</button>
        </div>
      </div>
    </Modal>
  )
}

function DimSelector({ label, options, value, onChange, color }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; color: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o} onClick={() => onChange(value === o ? '' : o)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
            style={value === o
              ? { backgroundColor: color, color: '#fff', borderColor: color }
              : { backgroundColor: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReposFields({ motif, moment, onMotif, onMoment }: {
  motif: string; moment: string; onMotif: (v: string) => void; onMoment: (v: string) => void
}) {
  // avoid TypeScript narrowing issues by using includes()
  const isDemi = (['Matin', 'Après-midi', 'Demi-journée'] as string[]).includes(moment)
  const on = { backgroundColor: '#6B7280', color: '#fff',    borderColor: '#6B7280' }
  const off = { backgroundColor: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
        <div className="flex flex-wrap gap-1.5">
          {REPOS_MOTIFS.map(m => (
            <button key={m} type="button" onClick={() => onMotif(motif === m ? '' : m)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={motif === m ? on : off}>{m}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Durée</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onMoment(moment === 'Journée' ? '' : 'Journée')}
            className="flex-1 py-2 rounded-xl border text-sm font-medium transition-colors"
            style={moment === 'Journée' ? on : off}>Journée</button>
          <button type="button" onClick={() => onMoment(isDemi ? '' : 'Demi-journée')}
            className="flex-1 py-2 rounded-xl border text-sm font-medium transition-colors"
            style={isDemi ? on : off}>Demi-journée</button>
        </div>
        {isDemi && (
          <div className="flex gap-2 mt-2">
            {['Matin', 'Après-midi'].map(opt => (
              <button key={opt} type="button"
                onClick={() => onMoment(moment === opt ? 'Demi-journée' : opt)}
                className="flex-1 py-1.5 rounded-xl border text-sm font-medium transition-colors"
                style={moment === opt ? on : off}>{opt}</button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
