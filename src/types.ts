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
}

export interface ActiveTimer {
  blocId: string
  startTime: number
  tag: string
}

export interface Settings {
  joursParMois: number
  heuresParJour: number
}
