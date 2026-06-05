import { useState, useMemo, useRef } from 'react'
import Modal from './Modal'
import type { Store } from '../store'
import type { Bloc, Session, Settings } from '../types'
import { generateId } from '../utils'

interface Props {
  open:    boolean
  onClose: () => void
  store:   Store
}

// ─── CSV parser helpers ────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === ';' && !inQ) { result.push(cur); cur = '' }
    else cur += c
  }
  result.push(cur)
  return result
}

interface ParsedBloc {
  name: string; icon: string; color: string; objectifJours: number
}
interface ParsedSession {
  blocName: string; date: string
  startTime: number; endTime: number; duration: number
  tag: string; config: string; posture: string; zone: string
}
export interface ParseResult {
  format:       'new' | 'old'
  settingsPatch: Partial<Settings>
  blocs:        ParsedBloc[]
  sessions:     ParsedSession[]
  zoneName1:    string   // from file, used to map zone values back
  zoneName2:    string
}

export function parseImportCSV(
  text: string,
  existingZone1: string,
  existingZone2: string,
): ParseResult {
  const raw  = text.startsWith('﻿') ? text.slice(1) : text
  const lines = raw.split(/\r?\n/)
  const rows  = lines.map(l => parseCSVLine(l))
  const nonempty = rows.filter(r => r.some(c => c.trim()))

  if (!nonempty.length) throw new Error('Fichier vide')

  if (nonempty[0][0]?.trim() === '# PARAMÈTRES') {
    return parseNewFormat(rows)
  } else {
    return parseOldFormat(nonempty, existingZone1, existingZone2)
  }
}

function parseNewFormat(rows: string[][]): ParseResult {
  let paramsIdx = -1, blocsIdx = -1, sessionsIdx = -1

  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i][0]?.trim()
    if (cell === '# PARAMÈTRES') paramsIdx   = i
    else if (cell === '# BLOCS')     blocsIdx    = i
    else if (cell === '# SESSIONS')  sessionsIdx = i
  }

  // ── Settings ────────────────────────────────────────────────────────────────
  let settingsPatch: Partial<Settings> = {}
  let zoneName1 = 'Alpes', zoneName2 = 'Territoire'
  if (paramsIdx >= 0 && rows[paramsIdx + 2]) {
    const d         = rows[paramsIdx + 2]
    const joursParMois  = parseFloat(d[0]?.replace(',', '.') || '') || 20
    const heuresParJour = parseFloat(d[1]?.replace(',', '.') || '') || 7.5
    zoneName1 = d[2]?.trim() || 'Alpes'
    zoneName2 = d[3]?.trim() || 'Territoire'
    settingsPatch = { joursParMois, heuresParJour, zoneName1, zoneName2 }
  }

  // ── Blocs ────────────────────────────────────────────────────────────────────
  const blocs: ParsedBloc[] = []
  if (blocsIdx >= 0) {
    let i = blocsIdx + 2
    while (i < rows.length) {
      const r    = rows[i]
      const name = r[0]?.trim()
      if (!name || name.startsWith('#')) break
      blocs.push({
        name,
        icon:          r[1]?.trim() || '📌',
        color:         r[2]?.trim() || 'blue',
        objectifJours: parseFloat(r[3]?.replace(',', '.') || '') || 0,
      })
      i++
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const sessions: ParsedSession[] = []
  if (sessionsIdx >= 0) {
    const hdr      = rows[sessionsIdx + 1] ?? []
    const hasStart = hdr.some(h => h.trim() === 'Démarrage (ms)')
    const cStart   = hasStart ? 5 : -1
    const cConfig  = hasStart ? 6 : 5
    const cPosture = hasStart ? 7 : 6
    const cZone    = hasStart ? 8 : 7
    const cTag     = hasStart ? 9 : 8

    let i = sessionsIdx + 2
    while (i < rows.length) {
      const r    = rows[i++]
      const date = r[0]?.trim()
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

      const durMin    = parseFloat(r[3]?.replace(',', '.') || '') || 0
      const duration  = Math.round(durMin * 60)
      const rawStart  = cStart >= 0 ? parseInt(r[cStart] || '0', 10) : 0
      const startTime = rawStart || new Date(date + 'T08:00:00').getTime()
      const endTime   = startTime + duration * 1000

      const zoneRaw = r[cZone]?.trim() || ''
      const zone    = zoneRaw === zoneName1 ? 'zone1' : zoneRaw === zoneName2 ? 'zone2' : ''

      sessions.push({
        blocName: r[2]?.trim() || '',
        date, startTime, endTime, duration,
        tag:     r[cTag]?.trim()     || '',
        config:  r[cConfig]?.trim()  || '',
        posture: r[cPosture]?.trim() || '',
        zone,
      })
    }
  }

  return { format: 'new', settingsPatch, blocs, sessions, zoneName1, zoneName2 }
}

function parseOldFormat(
  rows: string[][],
  zone1: string,
  zone2: string,
): ParseResult {
  const hdr      = rows[0]
  const hasStart = hdr.some(h => h.trim() === 'Démarrage (ms)')
  const cStart   = hasStart ? 5 : -1
  const cConfig  = hasStart ? 6 : 5
  const cPosture = hasStart ? 7 : 6
  const cZone    = hasStart ? 8 : 7
  const cTag     = hasStart ? 9 : 8

  const sessions: ParsedSession[] = []
  for (let i = 1; i < rows.length; i++) {
    const r    = rows[i]
    const date = r[0]?.trim()
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    const durMin    = parseFloat(r[3]?.replace(',', '.') || '') || 0
    const duration  = Math.round(durMin * 60)
    const rawStart  = cStart >= 0 ? parseInt(r[cStart] || '0', 10) : 0
    const startTime = rawStart || new Date(date + 'T08:00:00').getTime()
    const endTime   = startTime + duration * 1000

    const zoneRaw = r[cZone]?.trim() || ''
    const zone    = zoneRaw === zone1 ? 'zone1' : zoneRaw === zone2 ? 'zone2' : ''

    sessions.push({
      blocName: r[2]?.trim() || '',
      date, startTime, endTime, duration,
      tag:     r[cTag]?.trim()     || '',
      config:  r[cConfig]?.trim()  || '',
      posture: r[cPosture]?.trim() || '',
      zone,
    })
  }

  return { format: 'old', settingsPatch: {}, blocs: [], sessions, zoneName1: zone1, zoneName2: zone2 }
}

// ─── Build merged blocs & resolved sessions ────────────────────────────────────

function buildMergedBlocs(
  parsed:        ParseResult,
  mode:          'merge' | 'replace',
  existingBlocs: Bloc[],
): Bloc[] {
  if (mode === 'replace' && parsed.blocs.length > 0) {
    // Full replace: assign new IDs to every imported bloc
    return parsed.blocs.map(b => ({
      id:            generateId(),
      name:          b.name,
      icon:          b.icon,
      color:         b.color as Bloc['color'],
      objectifJours: b.objectifJours,
    }))
  }
  // Merge (or replace without blocs section → keep existing blocs for name resolution)
  const merged = [...existingBlocs]
  for (const b of parsed.blocs) {
    if (!merged.some(e => e.name === b.name)) {
      merged.push({
        id:            generateId(),
        name:          b.name,
        icon:          b.icon,
        color:         b.color as Bloc['color'],
        objectifJours: b.objectifJours,
      })
    }
  }
  return merged
}

function buildSessions(parsed: ParseResult, mergedBlocs: Bloc[]): Session[] {
  const nameToId = new Map(mergedBlocs.map(b => [b.name, b.id]))
  return parsed.sessions
    .map(s => {
      const blocId = nameToId.get(s.blocName) ?? ''
      return {
        id: generateId(),
        blocId,
        date:      s.date,
        startTime: s.startTime,
        endTime:   s.endTime,
        duration:  s.duration,
        tag:       s.tag,
        config:    s.config,
        posture:   s.posture,
        zone:      s.zone,
      } satisfies Session
    })
    .filter(s => s.blocId !== '')
}

function countDuplicates(newSessions: Session[], existing: Session[]): number {
  const exactKeys = new Set(existing.map(s => `${s.date}|${s.startTime}`))
  const fuzzyKeys = new Set(existing.map(s => `${s.date}|${s.blocId}|${s.duration}`))
  return newSessions.filter(s =>
    exactKeys.has(`${s.date}|${s.startTime}`) ||
    fuzzyKeys.has(`${s.date}|${s.blocId}|${s.duration}`),
  ).length
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportModal({ open, onClose, store }: Props) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [error,  setError]  = useState<string | null>(null)
  const [mode,   setMode]   = useState<'merge' | 'replace'>('merge')
  const [done,   setDone]   = useState(false)

  function reset() {
    setParsed(null)
    setError(null)
    setMode('merge')
    setDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text   = ev.target?.result as string
        const result = parseImportCSV(text, store.settings.zoneName1, store.settings.zoneName2)
        if (!result.sessions.length && !result.blocs.length) {
          throw new Error('Aucune donnée valide trouvée dans le fichier')
        }
        setParsed(result)
      } catch (err: unknown) {
        setError((err as Error)?.message ?? 'Erreur de lecture du fichier')
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  // Stable computed values (regenerate IDs only when parsed/mode/blocs change)
  const mergedBlocs = useMemo(
    () => (parsed ? buildMergedBlocs(parsed, mode, store.blocs) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsed, mode, store.blocs],
  )
  const newSessions = useMemo(
    () => (parsed ? buildSessions(parsed, mergedBlocs) : []),
    [parsed, mergedBlocs],
  )
  const dupCount  = mode === 'merge' ? countDuplicates(newSessions, store.sessions) : 0
  const addCount  = mode === 'merge' ? newSessions.length - dupCount : newSessions.length
  const hasImport = newSessions.length > 0 || (parsed?.blocs.length ?? 0) > 0

  function handleImport() {
    if (!parsed) return
    store.importData(mergedBlocs, newSessions, parsed.settingsPatch, mode)
    setDone(true)
  }

  const settingsCount = parsed ? Object.keys(parsed.settingsPatch).length : 0

  return (
    <Modal open={open} onClose={handleClose} title="Importer depuis CSV">
      <div className="space-y-4">

        {/* ── Success ── */}
        {done && (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-base font-semibold text-gray-900">Import réussi !</p>
            <p className="text-sm text-gray-500">
              {mode === 'replace'
                ? `${newSessions.length} session${newSessions.length !== 1 ? 's' : ''} importée${newSessions.length !== 1 ? 's' : ''}`
                : `${addCount} nouvelle${addCount !== 1 ? 's' : ''} session${addCount !== 1 ? 's' : ''} ajoutée${addCount !== 1 ? 's' : ''}`}
            </p>
            <button onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-blue-500 text-sm font-medium text-white">
              Fermer
            </button>
          </div>
        )}

        {/* ── File picker ── */}
        {!done && !parsed && (
          <>
            <p className="text-sm text-gray-500 leading-relaxed">
              Sélectionnez un fichier CSV exporté depuis Chrono Quest.
              Les anciens formats (sessions uniquement) sont aussi acceptés.
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl py-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors select-none">
              <div className="text-3xl mb-2">📂</div>
              <p className="text-sm font-medium text-gray-600">Cliquer pour choisir un fichier</p>
              <p className="text-xs text-gray-400 mt-1">Format .csv</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">⚠️ {error}</p>
            )}

            <button onClick={handleClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
              Annuler
            </button>
          </>
        )}

        {/* ── Preview + confirm ── */}
        {!done && parsed && (
          <>
            {/* What was found */}
            <div className="bg-gray-50 rounded-xl overflow-hidden divide-y divide-gray-100">
              {settingsCount > 0 && (
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paramètres</span>
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {settingsCount} champ{settingsCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {parsed.blocs.length > 0 && (
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blocs</span>
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {parsed.blocs.length} bloc{parsed.blocs.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions</span>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  {newSessions.length} session{newSessions.length !== 1 ? 's' : ''}
                </span>
              </div>
              {parsed.format === 'old' && (
                <div className="px-4 py-2 bg-amber-50">
                  <p className="text-xs text-amber-700">Ancien format détecté — blocs et paramètres non inclus</p>
                </div>
              )}
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode d'import</label>
              <div className="space-y-2">

                <label className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${mode === 'merge' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" value="merge" checked={mode === 'merge'}
                    onChange={() => setMode('merge')} className="mt-0.5 accent-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Fusionner</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {addCount > 0
                        ? `Ajoute ${addCount} nouvelle${addCount !== 1 ? 's' : ''} session${addCount !== 1 ? 's' : ''}${dupCount > 0 ? ` · ${dupCount} doublon${dupCount !== 1 ? 's' : ''} ignoré${dupCount !== 1 ? 's' : ''}` : ''}`
                        : dupCount > 0
                          ? `Toutes les sessions sont déjà présentes (${dupCount} doublon${dupCount !== 1 ? 's' : ''})`
                          : 'Ajoute les nouvelles sessions aux données existantes'}
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${mode === 'replace' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" value="replace" checked={mode === 'replace'}
                    onChange={() => setMode('replace')} className="mt-0.5 accent-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Remplacer</p>
                    <p className="text-xs text-gray-500 mt-0.5">Remplace toutes les données actuelles par celles du fichier</p>
                  </div>
                </label>

              </div>
              {mode === 'replace' && (
                <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mt-2">
                  ⚠️ Vos sessions et blocs actuels seront supprimés et remplacés par ceux du fichier.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={reset}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                ← Retour
              </button>
              <button
                onClick={handleImport}
                disabled={!hasImport}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-colors ${
                  mode === 'replace'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}>
                {mode === 'merge' ? '📥 Fusionner' : '🔄 Remplacer'}
              </button>
            </div>
          </>
        )}

      </div>
    </Modal>
  )
}
