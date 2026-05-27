import type { Bloc, ColorName, Settings } from './types'

export const COLORS: Record<ColorName, { main: string; light: string }> = {
  blue:   { main: '#3B82F6', light: '#EFF6FF' },
  red:    { main: '#EF4444', light: '#FEF2F2' },
  green:  { main: '#22C55E', light: '#F0FDF4' },
  yellow: { main: '#EAB308', light: '#FEFCE8' },
  purple: { main: '#A855F7', light: '#FAF5FF' },
  orange: { main: '#F97316', light: '#FFF7ED' },
  teal:   { main: '#14B8A6', light: '#F0FDFA' },
  pink:   { main: '#EC4899', light: '#FDF2F8' },
}

export const COLOR_NAMES: ColorName[] = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'teal', 'pink']

export const DEFAULT_BLOCS: Bloc[] = [
  { id: 'b1', name: 'Gouvernance',    icon: '🏛️', color: 'blue',   objectifJours: 2 },
  { id: 'b2', name: 'Développement',  icon: '🚀', color: 'green',  objectifJours: 4 },
  { id: 'b3', name: 'Événements',     icon: '🎉', color: 'red',    objectifJours: 4 },
  { id: 'b4', name: 'Représentation', icon: '🤝', color: 'purple', objectifJours: 4 },
  { id: 'b5', name: 'Gestion',        icon: '⚙️', color: 'yellow', objectifJours: 6 },
]

export const DEFAULT_CONFIGURATIONS = ['Solo', 'Staff Alpes', 'Bénévoles', 'Partenaires']
export const DEFAULT_POSTURES       = ['Pilote', 'Anime', 'Produit', 'Contribue', 'Présence']

export const DEFAULT_SETTINGS: Settings = {
  joursParMois:   20,
  heuresParJour:  7.5,
  configurations: DEFAULT_CONFIGURATIONS,
  postures:       DEFAULT_POSTURES,
}

export const EMOJI_OPTIONS = ['🏛️','🚀','🎉','🤝','⚙️','📋','👥','💼','📊','💡','🔧','📞','✉️','🗂️','💰','🎯','📝','🔍','📅','🌱']
