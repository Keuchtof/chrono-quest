import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { Session, Bloc } from '../types'
import { SUGGESTED_TAGS } from '../constants'
import { getDateStr } from '../utils'

interface Props {
  open: boolean
  session: Session | null
  blocs: Bloc[]
  onSave: (patch: Partial<Session>) => void
  onClose: () => void
}

export default function EditSessionModal({ open, session, blocs, onSave, onClose }: Props) {
  const [blocId,  setBlocId]  = useState('')
  const [tag,     setTag]     = useState('')
  const [hours,   setHours]   = useState('0')
  const [minutes, setMinutes] = useState('0')
  const [date,    setDate]    = useState('')

  useEffect(() => {
    if (session) {
      setBlocId(session.blocId)
      setTag(session.tag)
      const h = Math.floor(session.duration / 3600)
      const m = Math.floor((session.duration % 3600) / 60)
      setHours(String(h))
      setMinutes(String(m))
      setDate(session.date)
    }
  }, [session])

  function handleSave() {
    const totalSecs = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60
    if (totalSecs < 1) return
    onSave({ blocId, tag, duration: totalSecs, date })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier la session">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
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
                onClick={() => setTag(t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${tag === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >Annuler</button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white hover:bg-blue-600"
          >Enregistrer</button>
        </div>
      </div>
    </Modal>
  )
}
