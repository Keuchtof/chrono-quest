import { useState } from 'react'
import Modal from './Modal'
import type { Bloc, Session, Settings } from '../types'
import { getDateStr, generateId } from '../utils'

interface Props {
  open: boolean
  blocs: Bloc[]
  settings: Settings
  defaultDate?: string
  onAdd: (s: Omit<Session, 'id'>) => void
  onClose: () => void
}

export default function AddSessionModal({ open, blocs, settings, defaultDate, onAdd, onClose }: Props) {
  const [blocId,   setBlocId]   = useState(blocs[0]?.id ?? '')
  const [tag,      setTag]      = useState('')
  const [config,   setConfig]   = useState('')
  const [posture,  setPosture]  = useState('')
  const [hours,    setHours]    = useState('0')
  const [minutes,  setMinutes]  = useState('30')
  const [date,     setDate]     = useState(defaultDate ?? getDateStr())

  function reset() {
    setTag(''); setConfig(''); setPosture('')
    setHours('0'); setMinutes('30')
    setDate(getDateStr())
  }

  function handleAdd() {
    const duration = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60
    if (duration < 1 || !blocId) return
    onAdd({ blocId, date, startTime: Date.now(), endTime: Date.now(), duration, tag, config, posture })
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} max={getDateStr()} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </div>

        <DimSelector label="Configuration" options={settings.configurations} value={config} onChange={setConfig} color="#3B82F6" />
        <DimSelector label="Posture"        options={settings.postures}       value={posture} onChange={setPosture} color="#8B5CF6" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tag libre <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input type="text" value={tag} onChange={e => setTag(e.target.value)}
            placeholder="Ex : Séminaire Alpes..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
        </div>

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
