import { useState } from 'react'

interface Props {
  value:       string
  onChange:    (v: string) => void
  tags:        string[]
  onAddTag:    (t: string) => void
  placeholder?: string
  className?:  string
}

/**
 * Champ tag avec suggestions : liste des tags enregistrés (filtrée à la frappe)
 * + création dans la base via « Enregistrer ». La liste s'affiche sous le champ
 * quand il a le focus.
 */
export default function TagPicker({ value, onChange, tags, onAddTag, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)

  const trimmed  = value.trim()
  const filtered = tags.filter(t => t.toLowerCase().includes(trimmed.toLowerCase()))
  const isKnown  = tags.some(t => t.toLowerCase() === trimmed.toLowerCase())
  const showList = open && (filtered.length > 0 || (trimmed && !isKnown))

  return (
    <div>
      <input type="text" value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? 'Tag libre (optionnel)...'}
        className={className ?? 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400'} />

      {showList && (
        <div className="mt-1.5 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-h-44 overflow-y-auto">
          {filtered.map(t => (
            <button key={t} type="button"
              onMouseDown={e => { e.preventDefault(); onChange(t); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 border-b border-gray-50 last:border-b-0"
              style={value === t ? { backgroundColor: '#EFF6FF', color: '#3B82F6', fontWeight: 600 } : {}}>
              {t}
            </button>
          ))}
          {trimmed && !isKnown && (
            <button type="button"
              onMouseDown={e => { e.preventDefault(); onAddTag(trimmed); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50/50 hover:bg-blue-50">
              + Enregistrer « {trimmed} » dans les tags
            </button>
          )}
        </div>
      )}
    </div>
  )
}
