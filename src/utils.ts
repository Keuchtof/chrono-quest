import type { Session, Settings } from './types'

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) {
    const secs = seconds % 60
    return secs > 0 ? `${mins}m${secs.toString().padStart(2,'0')}` : `${mins}m`
  }
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hrs}h${remMins.toString().padStart(2,'0')}` : `${hrs}h`
}

export function formatTimer(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) return `${hrs}h${mins.toString().padStart(2,'0')}`
  return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
}

export function secondsToDisplay(s: number): string {
  if (s === 0) return '0min'
  if (s < 3600) return `${Math.round(s / 60)}min`
  const h = s / 3600
  return `${Math.round(h * 10) / 10}h`
}

export function formatBalance(s: number): string {
  const abs = Math.abs(s)
  const sign = s >= 0 ? '+' : '-'
  return sign + secondsToDisplay(abs)
}

export function getDateStr(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return getDateStr(d)
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00').getDay()
  return d === 0 || d === 6
}

const SHORT_DAYS   = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.']
const LONG_DAYS    = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const MONTHS       = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const SHORT_MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MINI_DAYS    = ['L','M','M','J','V','S','D']

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

export function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2,9) + Date.now().toString(36)
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

// ─── Semaine ────────────────────────────────────────────────────────────────
export function getWeekRange(dateStr: string): [string, string] {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [getDateStr(monday), getDateStr(sunday)]
}

export function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  let cur = start
  while (cur <= end) { dates.push(cur); cur = addDays(cur, 1) }
  return dates
}

// ─── Calendrier ─────────────────────────────────────────────────────────────
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Offset du premier jour (Lun=0 ... Dim=6)
export function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

// ─── Balance heures ──────────────────────────────────────────────────────────
export function getBalance(
  sessions: Session[],
  settings: Settings,
  fromDate: string,
  toDate: string,
  activeTimer?: { startTime: number; blocId: string } | null,
  now?: number
): number {
  const today = getDateStr()
  const end = toDate > today ? today : toDate
  let balance = 0
  let cur = fromDate
  while (cur <= end) {
    const dayTarget  = isWeekend(cur) ? 0 : settings.heuresParJour * 3600
    const daySess    = sessions.filter(s => s.date === cur)
    let   dayActual  = daySess.reduce((a, s) => a + s.duration, 0)
    if (cur === today && activeTimer && now) {
      dayActual += Math.round((now - activeTimer.startTime) / 1000)
    }
    balance += dayActual - dayTarget
    cur = addDays(cur, 1)
  }
  return balance
}

export function getMonthStart(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2,'0')}-01`
}

export function getMonthEnd(year: number, month: number): string {
  return getDateStr(new Date(year, month + 1, 0))
}

// Jours travaillés (weekdays avec au moins 1 session) ce mois
export function getWorkedDaysCount(sessions: Session[], year: number, month: number): number {
  const days = new Set(
    getMonthSessions(sessions, year, month)
      .filter(s => !isWeekend(s.date))
      .map(s => s.date)
  )
  return days.size
}

// Jours ouvrés dans un mois
export function getWorkingDaysInMonth(year: number, month: number): number {
  const days = getDaysInMonth(year, month)
  let count = 0
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month, d).getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

export { MINI_DAYS, MONTHS, SHORT_MONTHS }
