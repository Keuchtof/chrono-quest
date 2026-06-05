import { useState, useMemo } from 'react'
import type { Store } from '../store'
import type { Session } from '../types'
import {
  calcVitals, calcDailyCharge, chargeZone, chargeZoneColor,
  getDateStr, getDatesInRange, getWeekRange, isWeekend,
} from '../utils'

interface Props { store: Store; now: number }

const DEBT_LABELS = ['Aucune', 'Légère 🌥️', 'Modérée ⛅', 'Sévère ⛈️']
const DEBT_COLORS = ['#22C55E', '#F59E0B', '#F97316', '#EF4444']

export default function SanteTab({ store, now }: Props) {
  const reposId = store.blocs.find(b => b.isRest)?.id ?? 'b_repos'

  const vitals = useMemo(
    () => calcVitals(store.sessions, reposId, store.settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.sessions, store.settings, reposId]
  )

  const pvRatio     = store.settings.joursParMois > 0 ? vitals.pv / store.settings.joursParMois : 1
  const pvColor     = pvRatio >= 0.7 ? '#22C55E' : pvRatio >= 0.4 ? '#F59E0B' : '#EF4444'
  const pvLabel     = vitals.pv % 1 === 0 ? String(Math.round(vitals.pv)) : vitals.pv.toFixed(1)
  const energyColor = vitals.energy >= 60 ? '#22C55E' : vitals.energy >= 30 ? '#F59E0B' : '#EF4444'

  // ── Semaine courante ──────────────────────────────────────────────────────
  const today      = getDateStr()
  const [wMon]     = getWeekRange(today)
  const weekDates  = getDatesInRange(wMon, today)

  let weekCerveaux = 0
  for (const d of weekDates) {
    const stored = store.sessions
      .filter(s => s.date === d)
      .filter(s => {
        const b = store.blocs.find(b => b.id === s.blocId)
        return !b?.isRest
      })
    let daySessions: Session[] = stored
    if (d === today && store.activeTimer) {
      const timerBloc = store.blocs.find(b => b.id === store.activeTimer!.blocId)
      if (!timerBloc?.isRest) {
        const fake: Session = {
          id: '__active', blocId: store.activeTimer.blocId,
          date: d, startTime: store.activeTimer.startTime, endTime: now,
          duration: Math.round((now - store.activeTimer.startTime) / 1000),
          chargeNiveau: store.activeTimer.chargeNiveau,
          tag: '', config: '', posture: '', zone: '',
        }
        daySessions = [...stored, fake]
      }
    }
    weekCerveaux += calcDailyCharge(daySessions)
  }

  const zone      = chargeZone(weekCerveaux)
  const zoneColor = chargeZoneColor(weekCerveaux)

  // ── Historique – on affiche les 8 dernières semaines ──────────────────────
  const recentWeeks = [...vitals.weekHistory].reverse().slice(0, 8)

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">

      {/* ── État actuel ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-400 tracking-wider">ÉTAT ACTUEL</p>

        {/* Énergie */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-gray-700">⚡ Énergie</span>
            <span className="text-sm font-bold" style={{ color: energyColor }}>{vitals.energy}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${vitals.energy}%`, backgroundColor: energyColor }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {vitals.energy >= 70 ? 'Bonne forme — continuez !' :
             vitals.energy >= 40 ? 'Léger déficit — ménagez-vous.' :
             'Énergie faible — prévoyez du repos.'}
          </p>
        </div>

        {/* PV + Dette */}
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Points de vie</div>
            <div className="text-xl font-bold leading-none" style={{ color: pvColor }}>
              ❤️ {pvLabel}
            </div>
            <div className="text-xs text-gray-400 mt-1">/ {store.settings.joursParMois}</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Dette</div>
            <div className="text-sm font-bold leading-none" style={{ color: DEBT_COLORS[vitals.debtLevel] }}>
              {DEBT_LABELS[vitals.debtLevel]}
            </div>
            {vitals.debtLevel > 0 && (
              <div className="text-[10px] text-gray-400 mt-1">Gains PV ×0,5</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Semaine en cours ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 tracking-wider">SEMAINE EN COURS</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(weekCerveaux * 10) / 10}
            </span>
            <span className="text-sm text-gray-400 ml-1.5">cerveaux</span>
          </div>
          <span className="text-sm font-semibold px-3 py-1 rounded-full capitalize"
            style={{ backgroundColor: zoneColor + '22', color: zoneColor }}>
            {zone}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Seuil weekend libre (&lt; 50🧠)</span>
            <span>{Math.min(Math.round(weekCerveaux), 50)} / 50</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(weekCerveaux / 50 * 100, 100)}%`, backgroundColor: zoneColor }} />
          </div>
        </div>
      </div>

      {/* ── Historique des semaines ──────────────────────────────────────── */}
      {recentWeeks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 tracking-wider px-4 pt-3 pb-2">
            SEMAINES RÉCENTES
          </p>
          {recentWeeks.map((w, i) => {
            const wZone      = chargeZone(w.cerveaux)
            const wZoneColor = chargeZoneColor(w.cerveaux)
            const eColor     = w.energyEnd >= 60 ? '#22C55E' : w.energyEnd >= 30 ? '#F59E0B' : '#EF4444'
            const pvSign     = w.pvDelta >= 0
            return (
              <div key={w.weekStart}
                className={`flex items-center gap-2 px-4 py-2.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <span className="text-xs text-gray-400 w-12 flex-shrink-0">{weekLabel(w.weekStart)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0"
                  style={{ backgroundColor: wZoneColor + '22', color: wZoneColor }}>
                  {wZone}
                </span>
                <span className="text-xs text-gray-600 font-medium flex-shrink-0">{w.cerveaux}🧠</span>
                <span className="ml-auto text-xs font-medium flex-shrink-0" style={{ color: eColor }}>
                  ⚡{w.energyEnd}%
                </span>
                <span className={`text-xs font-medium flex-shrink-0 w-12 text-right ${pvSign ? 'text-green-500' : 'text-red-500'}`}>
                  {pvSign ? '+' : ''}{w.pvDelta}❤️
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Guide ───────────────────────────────────────────────────────── */}
      <GuideCard />

    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function weekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00')
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

function GuideCard() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 tracking-wider">COMMENT ÇA MARCHE ?</p>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
          <p className="pt-3">
            🧠 <strong>Cerveaux</strong> — Charge mentale par jour : niveau × heures × bonus longue tâche.
            La fragmentation (nombreuses sessions) majore le score.
          </p>
          <p>
            ⚡ <strong>Énergie</strong> — Démarre à 100 %. Chaque jour de travail consomme de l'énergie selon
            la charge (5 % à 35 %). Les weekends libres (+15 %) et jours de congé (+20 %) la restaurent.
          </p>
          <p>
            ❤️ <strong>Points de vie</strong> — Perdus sur les journées surchargées (≥ 16🧠 → −2 ;
            ≥ 13🧠 et énergie &lt; 20 % → −1). Gagnés lors des semaines calmes, congés et weekends libres.
            Les gains sont divisés par 2 si la dette est active.
          </p>
          <p>
            ⛅ <strong>Dette</strong> — S'accumule après plusieurs semaines intenses (&gt; 50🧠/sem).
            Gelée entre 41–50🧠. Se résorbe sous 40🧠/sem. Pénalise les gains de PV tant qu'elle est active.
          </p>
          <div className="bg-gray-50 rounded-xl px-3 py-2 mt-1">
            <p className="font-semibold text-gray-700 mb-1">Zones journalières</p>
            <p>
              <span className="text-green-500 font-medium">Confort</span> ≤ 6 ·{' '}
              <span className="text-amber-500 font-medium">Nominal</span> ≤ 10 ·{' '}
              <span className="text-orange-500 font-medium">Tension</span> ≤ 13 ·{' '}
              <span className="text-red-500 font-medium">Surcharge</span> &gt; 13
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
