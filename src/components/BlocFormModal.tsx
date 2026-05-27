import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { Bloc, ColorName } from '../types'
import { COLORS, COLOR_NAMES, EMOJI_OPTIONS } from '../constants'

interface Props {
  open: boolean
  bloc?: Bloc | null
  onSave: (data: Omit<Bloc, 'id'>) => void
  onClose: () => void
}

export default function BlocFormModal({ open, bloc, onSave, onClose }: Props) {
  const [name,     setName]     = useState('')
  const [icon,     setIcon]     = useState('📋')
  const [color,    setColor]    = useState<ColorName>('blue')
  const [objectif, setObjectif] = useState('2')

  useEffect(() => {
    if (bloc) {
      setName(bloc.name)
      setIcon(bloc.icon)
      setColor(bloc.color)
      setObjectif(String(bloc.objectifJours))
    } else {
      setName('')
      setIcon('📋')
      setColor('blue')
      setObjectif('2')
    }
  }, [bloc, open])

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), icon, color, objectifJours: parseInt(objectif) || 1 })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={bloc ? 'Modifier le bloc' : 'Nouveau bloc'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex : Communication..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Icône</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setIcon(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${icon === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}
              >{e}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_NAMES.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: COLORS[c].main }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Objectif (jours/mois)</label>
          <input
            type="number" min="1" max="31"
            value={objectif}
            onChange={e => setObjectif(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Annuler</button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: COLORS[color].main }}
          >{bloc ? 'Modifier' : 'Créer'}</button>
        </div>
      </div>
    </Modal>
  )
}
