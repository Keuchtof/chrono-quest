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
  date: string
  startTime: number
  endTime: number
  duration: number   // seconds
  tag: string
  config: string
  posture: string
  zone: string       // 'zone1' | 'zone2' | ''
}

export interface ActiveTimer {
  blocId: string
  startTime: number
  tag: string
  config: string
  posture: string
  zone: string
}

export interface Settings {
  joursParMois: number
  heuresParJour: number
  configurations: string[]
  postures: string[]
  zoneName1: string   // ex: 'Alpes'
  zoneName2: string   // ex: 'Territoire'
}
