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
  { id: 'b1', name: 'Adhésions',   icon: '📋', color: 'blue',   objectifJours: 2 },
  { id: 'b2', name: 'Événements',  icon: '🎉', color: 'red',    objectifJours: 2 },
  { id: 'b3', name: 'RH',          icon: '👥', color: 'green',  objectifJours: 2 },
  { id: 'b4', name: 'Opérationnel',icon: '⚙️', color: 'yellow', objectifJours: 8 },
  { id: 'b5', name: 'Association', icon: '💼', color: 'purple', objectifJours: 2 },
]

export const DEFAULT_SETTINGS: Settings = {
  joursParMois: 20,
  heuresParJour: 7.5,
}

export const SUGGESTED_TAGS = ['Réunion', 'Formation', 'Admin', 'Projet', 'Client', 'Séminaire', 'Trajet', 'RDV']

export const EMOJI_OPTIONS = ['📋','🎉','👥','⚙️','💼','🏠','📊','💡','🔧','📞','✉️','🗂️','💰','🎯','📝','🚀','🔍','📅']
