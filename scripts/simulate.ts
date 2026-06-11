/**
 * Simulation calcVitals sur l'export CSV réel.
 * Usage : npx tsx scripts/simulate.ts <export.csv>
 * Reproduit la logique de calcVitals avec trace jour par jour.
 */
import { readFileSync } from 'fs'
import type { Session, Settings } from '../src/types'
import {
  calcDailyCharge, getDayTargetSecs, getWeekRange, getDatesInRange,
  isWeekend, getDateStr, addDays,
} from '../src/utils'

const REPOS_ID = 'b_repos'
const SETTINGS: Settings = {
  joursParMois: 20, heuresParJour: 7.6,
  configurations: [], postures: [], zoneName1: 'Alpes', zoneName2: 'Territoire',
}

// ─── Parse CSV export ────────────────────────────────────────────────────────
const csvPath = process.argv[2]
const raw = readFileSync(csvPath, 'utf-8')
const lines = raw.split(/\r?\n/)
const start = lines.findIndex(l => l.startsWith('"Date";"Jour"'))

const sessions: Session[] = []
for (let i = start + 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line || line.startsWith('"#')) break
  const cols = line.split(';').map(c => c.replace(/^"|"$/g, ''))
  const [date, , blocName, dureeMin, , demarrageMs, config, posture, , tag, charge] = cols
  const blocId = blocName === 'Repos' ? REPOS_ID : 'b_' + blocName.toLowerCase()
  const duration = blocId === REPOS_ID ? 0 : Math.round(parseFloat(dureeMin.replace(',', '.')) * 60)
  const startTime = demarrageMs === 'null'
    ? new Date(date + 'T12:00:00').getTime()
    : parseInt(demarrageMs)
  sessions.push({
    id: `s${i}`, blocId, date, startTime, endTime: startTime + duration * 1000,
    duration, tag, config, posture, zone: '',
    chargeNiveau: charge ? parseInt(charge) : 0,
  })
}

// ─── Réplique de calcVitals avec trace ──────────────────────────────────────
function energyCostForScore(score: number): number {
  if (score > 24) return 25
  if (score > 16) return 15
  if (score > 10) return 8
  if (score > 0)  return 4
  return 0
}
function shortDayBonus(workedSecs: number, targetSecs: number): number {
  if (targetSecs <= 0 || workedSecs <= 0) return 0
  if (workedSecs <= targetSecs * 0.5)  return 15
  if (workedSecs <= targetSecs * 0.75) return 8
  if (workedSecs <= targetSecs - 3600) return 4
  return 0
}

const byDate = new Map<string, Session[]>()
for (const s of sessions) {
  if (!byDate.has(s.date)) byDate.set(s.date, [])
  byDate.get(s.date)!.push(s)
}

const todayStr   = getDateStr()
const allDates   = [...byDate.keys()].sort()
const [firstMon] = getWeekRange(allDates[0])

let pv = SETTINGS.joursParMois
let energy = 100
let debtLevel = 0, streak50 = 0, streak60 = 0
let curMon = firstMon
let prevWeekCerveaux = 0

const fmt = (n: number) => (Math.round(n * 10) / 10).toString().padStart(5)

while (curMon <= todayStr) {
  const [wMon, wSun] = getWeekRange(curMon)
  const weekDates = getDatesInRange(wMon, wSun <= todayStr ? wSun : todayStr)
  console.log(`\n═══ Semaine du ${wMon} ═══`)

  let weekCerveaux = 0, lowChargeDay = false, reposDays = 0, freeWeekends = 0, weekHasSessions = false
  const pvStart = pv

  for (const d of weekDates) {
    const all = byDate.get(d) ?? []
    const nonRepos = all.filter(s => s.blocId !== REPOS_ID)
    if (all.length > 0) weekHasSessions = true
    const events: string[] = []

    if (isWeekend(d)) {
      if (nonRepos.length > 0) {
        const score = calcDailyCharge(nonRepos)
        weekCerveaux += score
        energy -= energyCostForScore(score)
        events.push(`WE travaillé ${fmt(score)}🧠 → énergie −${energyCostForScore(score)}`)
        if (score >= 28) { pv -= 2; events.push('PV −2 (≥28🧠)') }
        else if (score >= 22 && energy < 25) { pv -= 1; events.push('PV −1 (≥22🧠 & nrj<25)') }
        if (score > 0 && score < 10) lowChargeDay = true
      } else {
        freeWeekends++
        const weRecup = weekCerveaux > 75 ? 8 : 15
        energy = Math.min(100, energy + weRecup)
        events.push(`weekend libre → énergie +${weRecup}${weRecup === 8 ? ' (récup dégradée)' : ''}`)
      }
    } else {
      if (nonRepos.length > 0) {
        const score = calcDailyCharge(nonRepos)
        weekCerveaux += score
        const cost = energyCostForScore(score)
        energy -= cost
        const target = getDayTargetSecs(d, all, REPOS_ID, SETTINGS)
        const worked = nonRepos.reduce((a, s) => a + s.duration, 0)
        const bonus = shortDayBonus(worked, target)
        energy = Math.min(100, energy + bonus)
        const wh = Math.round(worked / 360) / 10
        events.push(`${wh}h travaillées, ${fmt(score)}🧠 (${nonRepos.length} sess.) → énergie −${cost}${bonus ? ` +${bonus} (jour court)` : ''}`)
        if (score >= 28) { pv -= 2; events.push('💔 PV −2 (≥28🧠)') }
        else if (score >= 22 && energy < 25) { pv -= 1; events.push('💔 PV −1 (≥22🧠 & nrj<25)') }
        if (score > 0 && score < 10) lowChargeDay = true
      } else if (all.length > 0) {
        reposDays++
        energy = Math.min(100, energy + 20)
        events.push(`congé (${all[0].tag || '?'}) → énergie +20`)
      } else {
        events.push('— aucune donnée —')
      }
    }
    energy = Math.max(0, Math.min(100, energy))
    console.log(`  ${d} ${isWeekend(d) ? 'WE' : '  '} ⚡${String(Math.round(energy)).padStart(3)}%  ${events.join(' · ')}`)
  }

  // Dette
  if (weekHasSessions) {
    if (weekCerveaux > 90)      { streak60++; streak50++ }
    else if (weekCerveaux > 75) { streak50++; streak60 = 0 }
    else if (weekCerveaux <= 60) { streak50 = 0; streak60 = 0; if (debtLevel > 0) debtLevel-- }
    const newDebt =
      streak50 >= 8 || streak60 >= 4 ? 3 :
      streak50 >= 4 || streak60 >= 2 ? 2 :
      streak50 >= 2 || streak60 >= 1 ? 1 : debtLevel
    if (newDebt > debtLevel) {
      if (newDebt === 2) pv -= 1
      if (newDebt === 3) pv -= 2
      debtLevel = newDebt
    }
  }

  // Gains PV hebdo
  const debtMult = debtLevel > 0 ? 0.5 : 1
  const gains: string[] = []
  if (lowChargeDay) { pv += 0.5 * debtMult; gains.push(`+${0.5 * debtMult} (jour léger)`) }
  if (reposDays > 0) { pv += Math.min(reposDays, 2) * debtMult; gains.push(`+${Math.min(reposDays, 2) * debtMult} (congés)`) }
  if (weekHasSessions && weekCerveaux <= 75 && freeWeekends > 0) {
    pv += Math.min(freeWeekends, 2) * debtMult
    gains.push(`+${Math.min(freeWeekends, 2) * debtMult} (WE libre)`)
  }
  if (prevWeekCerveaux > 0 && weekCerveaux > 75 && weekCerveaux > prevWeekCerveaux * 1.5) {
    pv -= 1
    gains.push('−1 (choc de rythme)')
  }
  prevWeekCerveaux = weekCerveaux
  const pvMax = SETTINGS.joursParMois + 10
  if (pv > pvMax) pv = pvMax
  if (pv < 0) pv = 0

  console.log(`  ── Total : ${fmt(weekCerveaux)}🧠 | dette niv.${debtLevel} (s50=${streak50} s60=${streak60}) | PV ${fmt(pvStart)} → ${fmt(pv)} ${gains.length ? `[${gains.join(', ')}]` : ''}`)
  curMon = addDays(wMon, 7)
}

console.log(`\n══════ ÉTAT FINAL : ⚡ ${Math.round(energy)}%  ·  ❤️ ${Math.round(pv * 10) / 10}/${SETTINGS.joursParMois}  ·  dette niv.${debtLevel} ══════`)
