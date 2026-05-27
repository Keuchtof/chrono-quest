export type ColorName = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange' | 'teal' | 'pink'

export interface Bloc {
  id: string
  name: string
  icon: string
  color: ColorName
  objectifJours: number
}

export interface Session {
  id: string
  blocId: string
  date: string       // YYYY-MM-DD
  startTime: number  // Unix ms
  endTime: number    // Unix ms
  duration: number   // seconds
  tag: string
  config: string     // Dimension 1 : Configuration
  posture: string    // Dimension 2 : Posture
}

export interface ActiveTimer {
  blocId: string
  startTime: number
  tag: string
  config: string
  posture: string
}

export interface Settings {
  joursParMois: number
  heuresParJour: number
  configurations: string[]
  postures: string[]
}
