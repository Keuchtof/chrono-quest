import { CHARGE_OPTIONS } from '../constants'

interface Props {
  value:    number                // 0 = non noté, 1–4
  onChange: (v: number) => void
  /** Mode compact pour le timer en cours (fond semi-transparent) */
  compact?: boolean
}

export default function ChargeSelector({ value, onChange, compact }: Props) {
  return (
    <div className="flex gap-1.5">
      {CHARGE_OPTIONS.map(opt => {
        const active = value === opt.level
        return (
          <button
            key={opt.level}
            type="button"
            onClick={() => onChange(active ? 0 : opt.level)}
            title={`Niveau ${opt.level} — ${opt.name}`}
            className="flex-1 rounded-xl border font-medium transition-all text-xs py-1"
            style={active
              ? { backgroundColor: opt.color, color: '#fff', borderColor: opt.color }
              : compact
                ? { backgroundColor: '#ffffff88', color: '#374151', borderColor: '#D1D5DB' }
                : { backgroundColor: '#F9FAFB',   color: '#374151', borderColor: '#E5E7EB' }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Affiche un badge court du niveau (utilisé dans les listes de sessions) */
export function ChargeBadge({ niveau }: { niveau?: number }) {
  if (!niveau) return null
  const opt = CHARGE_OPTIONS.find(o => o.level === niveau)
  if (!opt) return null
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: opt.color + '22', color: opt.color }}>
      {opt.label}
    </span>
  )
}

/**
 * Affichage lecture seule du niveau de charge — style sélecteur (4 cases).
 * Le niveau actif est en couleur, les autres sont grisés.
 */
export function ChargeDisplay({ niveau }: { niveau?: number }) {
  const active = niveau ?? 0
  return (
    <div className="flex gap-1 mt-1.5">
      {CHARGE_OPTIONS.map(opt => (
        <span
          key={opt.level}
          className="flex-1 text-center text-xs py-0.5 rounded-lg font-medium"
          style={active === opt.level
            ? { backgroundColor: opt.color, color: '#fff' }
            : { backgroundColor: '#F3F4F6', color: '#D1D5DB' }}>
          {opt.label}
        </span>
      ))}
    </div>
  )
}
