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

/**
 * Retourne le nombre de jours travaillés pour un mois donné.
 * Utilise la surcharge mensuelle si elle existe, sinon la valeur globale.
 */
export function getJoursParMois(settings: Settings, year: number, month: number): number {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`
  return settings.joursParMoisOverrides?.[key] ?? settings.joursParMois
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

// ─── Charge mentale & Points de vie ──────────────────────────────────────────

/** Majoration longue tâche (par session) */
function longTaskMaj(duration: number): number {
  if (duration >= 3 * 3600)   return 0.50
  if (duration >= 2 * 3600)   return 0.25
  if (duration >= 1.5 * 3600) return 0.10
  return 0
}

/** Majoration fragmentation (nb total de sessions dans la journée) */
function fragMaj(n: number): number {
  if (n <= 4) return 0
  let bonus = 0
  for (let i = 5; i <= n; i++) {
    if      (i <= 6) bonus += 0.05
    else if (i <= 9) bonus += 0.10
    else             bonus += 0.15
    if (bonus >= 0.60) return 0.60
  }
  return bonus
}

/**
 * Score de charge journalier en "cerveaux".
 * Toutes les sessions comptent pour la fragmentation ;
 * seules celles avec chargeNiveau > 0 contribuent au score brut.
 */
export function calcDailyCharge(sessions: Session[]): number {
  const base = sessions.reduce((sum, s) => {
    if (!s.chargeNiveau) return sum
    return sum + s.chargeNiveau * (s.duration / 3600) * (1 + longTaskMaj(s.duration))
  }, 0)
  return base * (1 + fragMaj(sessions.length))
}

/** Score d'une seule session (sans fragmentation) */
export function calcSessionScore(s: Session): number {
  if (!s.chargeNiveau) return 0
  return s.chargeNiveau * (s.duration / 3600) * (1 + longTaskMaj(s.duration))
}

/** Zone de charge selon le score journalier */
export function chargeZone(score: number): 'confort' | 'nominal' | 'tension' | 'surcharge' {
  if (score <= 6)  return 'confort'
  if (score <= 10) return 'nominal'
  if (score <= 13) return 'tension'
  return 'surcharge'
}

/** Couleur associée à la zone de charge */
export function chargeZoneColor(score: number): string {
  switch (chargeZone(score)) {
    case 'confort':   return '#22C55E'
    case 'nominal':   return '#F59E0B'
    case 'tension':   return '#F97316'
    case 'surcharge': return '#EF4444'
  }
}

/** Coût énergétique journalier selon le score de cerveaux */
function energyCostForScore(score: number): number {
  if (score > 13) return 35
  if (score > 10) return 20
  if (score > 8)  return 10
  if (score > 0)  return 5
  return 0
}

export interface VitalsResult {
  pv:          number
  energy:      number    // 0–100 %
  debtLevel:   number    // 0–3
  weekHistory: {
    weekStart:  string
    cerveaux:   number
    pvDelta:    number
    energyEnd:  number
    debtLevel:  number
  }[]
}

/**
 * Calcule les indicateurs de santé (énergie, PV, dette) depuis l'historique.
 *
 * Énergie : démarre à 100 %, coûte selon le score journalier, récupère
 *   les weekends libres (+15 %) et jours de congé (+20 %).
 *
 * PV : démarre à settings.joursParMois.
 *   Pertes : score ≥ 16 → −2 ; score ≥ 13 ET énergie < 20 % → −1.
 *   Gains  : <6🧠/j → +0,5 (max 1/sem) ; congé → +1 (max 2/sem) ;
 *            weekend libre + semaine ≤ 50🧠 → +1 (max 2/sem).
 *   Tous les gains × 0,5 si dette active.
 *
 * Dette : basée sur les streaks de semaines > 50 / > 60 cerveaux.
 *   Récupération si semaine ≤ 40 cerveaux. Gelée entre 41–50.
 *   Escalade : niv 2 → −1 PV (one-shot) ; niv 3 → −2 PV (one-shot).
 */
export function calcVitals(
  sessions: Session[],
  reposId:  string,
  settings: Settings,
): VitalsResult {
  const byDate = new Map<string, Session[]>()
  for (const s of sessions) {
    if (!byDate.has(s.date)) byDate.set(s.date, [])
    byDate.get(s.date)!.push(s)
  }

  const empty: VitalsResult = {
    pv: settings.joursParMois, energy: 100, debtLevel: 0, weekHistory: []
  }
  if (byDate.size === 0) return empty

  const todayStr   = getDateStr()
  const allDates   = [...byDate.keys()].sort()
  const [firstMon] = getWeekRange(allDates[0])

  let pv        = settings.joursParMois
  let energy    = 100
  let debtLevel = 0
  let streak50  = 0   // semaines consécutives > 50 cerveaux
  let streak60  = 0   // semaines consécutives > 60 cerveaux

  const weekHistory: VitalsResult['weekHistory'] = []
  let curMon = firstMon

  while (curMon <= todayStr) {
    const [wMon, wSun] = getWeekRange(curMon)
    const weekDates    = getDatesInRange(wMon, wSun <= todayStr ? wSun : todayStr)
    const pvStart      = pv

    let weekCerveaux    = 0
    let lowChargeDay    = false
    let reposDays       = 0
    let freeWeekends    = 0
    let weekHasSessions = false

    for (const d of weekDates) {
      const all      = byDate.get(d) ?? []
      const nonRepos = all.filter(s => s.blocId !== reposId)

      if (all.length > 0) weekHasSessions = true

      if (isWeekend(d)) {
        if (nonRepos.length > 0) {
          const score = calcDailyCharge(nonRepos)
          weekCerveaux += score
          energy -= energyCostForScore(score)
          if (score >= 16)                        pv -= 2
          else if (score >= 13 && energy < 20)    pv -= 1
          if (score > 0 && score < 6)             lowChargeDay = true
        } else {
          freeWeekends++
          energy = Math.min(100, energy + 15)
        }
      } else {
        if (nonRepos.length > 0) {
          const score = calcDailyCharge(nonRepos)
          weekCerveaux += score
          energy -= energyCostForScore(score)
          if (score >= 16)                        pv -= 2
          else if (score >= 13 && energy < 20)    pv -= 1
          if (score > 0 && score < 6)             lowChargeDay = true
        } else if (all.length > 0) {
          // Congé : uniquement sessions Repos
          reposDays++
          energy = Math.min(100, energy + 20)
        }
      }
      energy = Math.max(0, energy)
    }

    // ── Mise à jour de la dette ────────────────────────────────────────────
    if (weekHasSessions) {
      if (weekCerveaux > 60) {
        streak60++
        streak50++
      } else if (weekCerveaux > 50) {
        streak50++
        streak60 = 0
      } else if (weekCerveaux <= 40) {
        streak50 = 0
        streak60 = 0
        if (debtLevel > 0) debtLevel--
      }
      // 41–50 cerveaux : gelé (aucun changement)

      const newDebt =
        streak50 >= 8 || streak60 >= 4 ? 3 :
        streak50 >= 4 || streak60 >= 2 ? 2 :
        streak50 >= 2 || streak60 >= 1 ? 1 : debtLevel

      if (newDebt > debtLevel) {
        if (newDebt === 2) pv -= 1   // pénalité d'escalade niv 2
        if (newDebt === 3) pv -= 2   // pénalité d'escalade niv 3
        debtLevel = newDebt
      }
    }

    // ── Gains PV hebdomadaires ────────────────────────────────────────────
    const debtMult = debtLevel > 0 ? 0.5 : 1
    if (lowChargeDay)                           pv += 0.5 * debtMult
    pv += Math.min(reposDays, 2) * debtMult
    if (weekHasSessions && weekCerveaux <= 50)  pv += Math.min(freeWeekends, 2) * debtMult

    // Plafond : joursParMois + 10 (généreux)
    const pvMax = settings.joursParMois + 10
    if (pv > pvMax) pv = pvMax
    if (pv < 0)     pv = 0
    energy = Math.max(0, Math.min(100, energy))

    weekHistory.push({
      weekStart: wMon,
      cerveaux:  Math.round(weekCerveaux * 10) / 10,
      pvDelta:   Math.round((pv - pvStart) * 10) / 10,
      energyEnd: Math.round(energy),
      debtLevel,
    })

    curMon = addDays(wMon, 7)
  }

  return {
    pv:          Math.round(pv * 10) / 10,
    energy:      Math.round(energy),
    debtLevel,
    weekHistory,
  }
}
