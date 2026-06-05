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
}
