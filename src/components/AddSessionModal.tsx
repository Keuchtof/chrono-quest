import { useState } from 'react'
import Modal from './Modal'
import type { Bloc, Session } from '../types'
import { SUGGESTED_TAGS } from '../constants'
import { getDateStr, generateId } from '../utils'

interface Props {
  open: boolean
  blocs: Bloc[]
  defaultDate?: string
  onAdd: (s: Omit<Session, 'id'>) => void
  onClose: () => void
}

export default function AddSessionModal({ open, blocs, defaultDate, onAdd, onClose }: Props) {
  const [blocId,  setBlocId]  = useState(blocs[0]?.id ?? '')
  const [tag,     setTag]     = useState('')
  const [hours,   setHours]   = useState('0')
  const [minutes, setMinutes] = useState('30')
  const [date,    setDate]    = useState(defaultDate ?? getDateStr())

  function handleAdd() {
    const duration = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60
    if (duration < 1 || !blocId) return
    onAdd({
      blocId,
      date,
      startTime: Date.now(),
      endTime: Date.now(),
      duration,
      tag,
    })
    setTag('')
    setHours('0')
    setMinutes('30')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une session">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bloc</label>
          <select
            value={blocId}
            onChange={e => setBlocId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
          >
            {blocs.map(b => (
              <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number" min="0" max="23"
                value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">h</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number" min="0" max="59"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={getDateStr()}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tag <span className="text-gray-400 font-normal">(optionnel)</span></label>
          <input
            type="text"
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="Ex : Réunion, Projet..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map(t => (
              <button
                key={t}
                onClick={() => setTag(t === tag ? '' : t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${tag === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Annuler</button>
          <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white">Ajouter</button>
        </div>
      </div>
    </Modal>
  )
}
