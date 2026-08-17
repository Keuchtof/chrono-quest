export type ColorName = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange' | 'teal' | 'pink' | 'gray'

export interface Bloc {
  id: string
  name: string
  icon: string
  color: ColorName
  objectifJours: number
  isRest?: boolean   // true = bloc Repos (non supprimable, non chronométrable)
}

export interface Session {
  id: string
  blocId: string
  date: string
  startTime: number
  endTime: number
  duration: number   // seconds
  tag: string
  config: string
  posture: string
  zone: string         // 'zone1' | 'zone2' | ''
  chargeNiveau?: number // 0 | undefined = non noté, 1-4
}

export interface ActiveTimer {
  blocId: string
  startTime: number
  tag: string
  config: string
  posture: string
  zone: string
  chargeNiveau: number  // 0 = non noté, 1-4
}

export interface Settings {
  joursParMois: number
  heuresParJour: number
  configurations: string[]
  postures: string[]
  zoneName1: string   // ex: 'Alpes'
  zoneName2: string   // ex: 'Territoire'
  /** Surcharges mensuelles : clé = 'YYYY-MM', valeur = nb jours travaillés */
  joursParMoisOverrides?: Record<string, number>
  /** Afficher samedi & dimanche dans la vue semaine (défaut : false) */
  showWeekend?: boolean
  /** Stock d'heures supplémentaires initial (en heures, peut être négatif) */
  hsStockInitial?: number
  /** Date de prise en compte du stock d'heures sup (YYYY-MM-DD) */
  hsStockDate?: string
  /** Horodatages des verres d'eau (ms epoch) — synchronisé via settings */
  waterLog?: number[]
  /** Ressenti par jour : clé = 'YYYY-MM-DD', valeur = −3..−1 (choc) ou 1..3 (satisfaction) */
  dayFeel?: Record<string, number>
  /** Prise de ritaline par jour : clé = 'YYYY-MM-DD' → true */
  ritaline?: Record<string, boolean>
  /** Présence d'Ulki (chien) par jour : clé = 'YYYY-MM-DD' → true */
  ulki?: Record<string, boolean>
  /** Base de tags réutilisables (construite par l'usage, gérable dans Réglages) */
  tags?: string[]

  // ── Gestion ritaline ──────────────────────────────────────────────────────
  /** Date de l'ordonnance initiale annuelle (spécialiste), valable 1 an */
  ritalineOrdonnanceInitiale?: string
  /** Stock de cachets constaté à une date donnée (point de départ des calculs) */
  ritalineStockInitial?: number
  ritalineStockDate?: string
  /** Historique des cycles ordonnance → délivrance, du plus ancien au plus récent */
  ritalineCycles?: RitalineCycle[]
}

/** Un cycle de traitement : ordonnance, retrait en pharmacie, RDV suivant prévu */
export interface RitalineCycle {
  id:           string
  ordonnance:   string   // YYYY-MM-DD
  delivrance?:  string   // YYYY-MM-DD — retrait effectif en pharmacie
  prochainRdv?: string   // RDV pris pour le cycle suivant
}
