import { useState } from 'react'
import Modal from './Modal'
import type { Session, Bloc, Settings } from '../types'
import { getDateStr } from '../utils'

const LONG_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface Props {
  open:     boolean
  onClose:  () => void
  sessions: Session[]
  blocs:    Bloc[]
  settings: Settings
}

type Preset = 'month' | 'quarter' | 'year' | 'all'

export default function ExportModal({ open, onClose, sessions, blocs, settings }: Props) {
  const today = getDateStr()
  const now   = new Date()

  const [from, setFrom] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [to,   setTo]   = useState(today)

  const filtered = sessions.filter(s => s.date >= from && s.date <= to)
  const totalSecs = filtered.reduce((a, s) => a + s.duration, 0)

  function applyPreset(preset: Preset) {
    const n = new Date()
    if (preset === 'month') {
      setFrom(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`)
      setTo(today)
    } else if (preset === 'quarter') {
      const q = Math.floor(n.getMonth() / 3)
      setFrom(`${n.getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`)
      setTo(today)
    } else if (preset === 'year') {
      setFrom(`${n.getFullYear()}-01-01`)
      setTo(today)
    } else if (preset === 'all') {
      const dates = sessions.map(s => s.date).sort()
      if (dates.length) setFrom(dates[0])
      setTo(today)
    }
  }

  function downloadCSV() {
    const sorted = [...filtered].sort((a, b) =>
      a.date.localeCompare(b.date) || a.startTime - b.startTime,
    )

    const header = ['Date', 'Jour', 'Bloc', 'Durée (min)', 'Durée (h)', 'Configuration', 'Posture', 'Zone', 'Tag']

    const rows = sorted.map(s => {
      const bloc  = blocs.find(b => b.id === s.blocId)
      const d     = new Date(s.date + 'T12:00:00')
      const jour  = LONG_DAYS[d.getDay()]
      const zone  = s.zone === 'zone1' ? settings.zoneName1 : s.zone === 'zone2' ? settings.zoneName2 : ''
      const durMin = Math.round(s.duration / 60)
      const durH  = (s.duration / 3600).toFixed(2).replace('.', ',')
      return [s.date, jour, bloc?.name ?? '', durMin, durH, s.config ?? '', s.posture ?? '', zone, s.tag ?? '']
    })

    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `chrono-quest-${from}_${to}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  const presets: { label: string; value: Preset }[] = [
    { label: 'Ce mois',     value: 'month'   },
    { label: 'Ce trimestre',value: 'quarter' },
    { label: 'Cette année', value: 'year'    },
    { label: 'Tout',        value: 'all'     },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Exporter en CSV">
      <div className="space-y-4">

        {/* Quick presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Période rapide</label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button key={p.value} onClick={() => applyPreset(p.value)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input type="date" value={from} max={to}
              onChange={e => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input type="date" value={to} min={from} max={today}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
          {filtered.length > 0 ? (
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{filtered.length}</span>
              {' '}session{filtered.length > 1 ? 's' : ''}
              {' · '}
              <span className="font-bold text-gray-900">
                {Math.round(totalSecs / 3600 * 10) / 10}h
              </span>
              {' '}au total
            </p>
          ) : (
            <p className="text-sm text-gray-400">Aucune session sur cette période</p>
          )}
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 text-center">
          Format CSV avec séparateur « ; » — compatible Excel
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
            Annuler
          </button>
          <button onClick={downloadCSV} disabled={filtered.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white disabled:opacity-40">
            ⬇ Télécharger
          </button>
        </div>
      </div>
    </Modal>
  )
}
