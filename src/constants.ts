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
  gray:   { main: '#6B7280', light: '#F3F4F6' },  // Repos uniquement
}

/** Couleurs disponibles pour les blocs utilisateur (sans gray réservé à Repos) */
export const USER_COLOR_NAMES: ColorName[] = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'teal', 'pink']
export const COLOR_NAMES:      ColorName[] = [...USER_COLOR_NAMES, 'gray']

/** Bloc Repos immuable */
export const REPOS_BLOC: Bloc = {
  id: 'b_repos', name: 'Repos', icon: '😴', color: 'gray', objectifJours: 0, isRest: true,
}

export const DEFAULT_BLOCS: Bloc[] = [
  { id: 'b1', name: 'Gouvernance',    icon: '🏛️', color: 'blue',   objectifJours: 2 },
  { id: 'b2', name: 'Développement',  icon: '🚀', color: 'green',  objectifJours: 4 },
  { id: 'b3', name: 'Événements',     icon: '🎉', color: 'red',    objectifJours: 4 },
  { id: 'b4', name: 'Représentation', icon: '🤝', color: 'purple', objectifJours: 4 },
  { id: 'b5', name: 'Gestion',        icon: '⚙️', color: 'yellow', objectifJours: 6 },
  REPOS_BLOC,
]

/** Niveaux de charge mentale */
export const CHARGE_OPTIONS = [
  { level: 1, label: '🧠',     name: 'Légère',  color: '#22C55E' },
  { level: 2, label: '🧠🧠',   name: 'Modérée', color: '#EAB308' },
  { level: 3, label: '🧠🧠🧠', name: 'Intense', color: '#F97316' },
  { level: 4, label: '☠️',     name: 'Urgence', color: '#EF4444' },
] as const

export const DEFAULT_CONFIGURATIONS = ['Solo', 'Staff Alpes', 'Bénévoles', 'Partenaires']
export const DEFAULT_POSTURES       = ['Pilote', 'Anime', 'Produit', 'Contribue', 'Présence']

export const DEFAULT_SETTINGS: Settings = {
  joursParMois:   20,
  heuresParJour:  7.5,
  configurations: DEFAULT_CONFIGURATIONS,
  postures:       DEFAULT_POSTURES,
  zoneName1:      'Alpes',
  zoneName2:      'Territoire',
  showWeekend:    false,
}

export const EMOJI_OPTIONS = ['🏛️','🚀','🎉','🤝','⚙️','📋','👥','💼','📊','💡','🔧','📞','✉️','🗂️','💰','🎯','📝','🔍','📅','🌱']

export const ZONE1_COLOR = '#3B82F6'
export const ZONE2_COLOR = '#F97316'

/** Tags spécifiques au bloc Repos */
export const REPOS_MOTIFS  = ['RTT', 'Congé', 'Férié', 'Récupération'] as const
export const REPOS_MOMENTS = ['Journée', 'Matin', 'Après-midi']        as const

/**
 * Ressenti journalier : chocs (négatif, ajoutent des cerveaux au score du jour)
 * et satisfactions (positif, restaurent de l'énergie en fin de journée).
 */
export const DAY_FEEL_OPTIONS = [
  { value: -3, emoji: '😵', label: 'Choc fort',   effect: '+8🧠' },
  { value: -2, emoji: '😖', label: 'Choc moyen',  effect: '+4🧠' },
  { value: -1, emoji: '😕', label: 'Choc léger',  effect: '+2🧠' },
  { value:  1, emoji: '🙂', label: 'Bien',        effect: '+3 ⚡' },
  { value:  2, emoji: '😄', label: 'Très bien',   effect: '+6 ⚡' },
  { value:  3, emoji: '🤩', label: 'Excellent',   effect: '+10 ⚡' },
] as const
