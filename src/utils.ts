import type { Session } from './types'

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) {
    const secs = seconds % 60
    return secs > 0 ? `${mins}m${secs.toString().padStart(2, '0')}` : `${mins}m`
  }
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hrs}h${remMins.toString().padStart(2, '0')}` : `${hrs}h`
}

export function formatTimer(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) return `${hrs}h${mins.toString().padStart(2, '0')}`
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function secondsToDisplay(s: number): string {
  if (s < 3600) return `${Math.round(s / 60)}min`
  const h = s / 3600
  return `${Math.round(h * 10) / 10}h`
}

export function getDateStr(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return getDateStr(d)
}

const SHORT_DAYS  = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.']
const LONG_DAYS   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const MONTHS      = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const SHORT_MONTHS= ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${LONG_DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export function getMonthSessions(sessions: Session[], year: number, month: number): Session[] {
  return sessions.filter(s => {
    const d = new Date(s.date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export function getDaySessions(sessions: Session[], dateStr: string): Session[] {
  return sessions.filter(s => s.date === dateStr)
}

export function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
