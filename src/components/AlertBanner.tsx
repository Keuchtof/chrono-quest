import type { RitalineAlert } from '../utils'

/** Couleurs par niveau d'alerte (modérée → forte → absolue) */
const LEVEL_BG = ['', '#DC2626', '#B91C1C', '#7F1D1D']

/**
 * Bandeau d'alerte ritaline façon « breaking news » : fond rouge, texte blanc
 * qui défile en boucle de gauche à droite. Affiché sous la barre de progression
 * du header, donc visible sur tous les écrans.
 */
export default function AlertBanner({ alert }: { alert: RitalineAlert }) {
  // On répète le texte pour un défilement continu sans trou (translateX -50%)
  const segment = `${'⚠️'} ${alert.text}`
  const speed   = alert.level === 3 ? '11s' : alert.level === 2 ? '15s' : '20s'

  return (
    <div className={`mt-2 -mx-4 overflow-hidden ${alert.level >= 2 ? 'marquee-pulse' : ''}`}
      style={{ backgroundColor: LEVEL_BG[alert.level] }}>
      <div className="marquee-track py-1" style={{ animationDuration: speed }}>
        {[0, 1].map(rep => (
          <span key={rep} className="text-[11px] font-bold tracking-wide text-white px-4">
            {segment}
            <span className="px-6 opacity-60">•</span>
            {segment}
            <span className="px-6 opacity-60">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
