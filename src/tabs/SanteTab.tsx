import { useState, useMemo } from 'react'
import type { Store } from '../store'
import type { Session } from '../types'
import { DAY_FEEL_OPTIONS } from '../constants'
import {
  calcVitals, calcDailyCharge, chargeZone, chargeZoneColor,
  getDateStr, getDatesInRange, getWeekRange, isWeekend,
  calcHeuresSup, formatBalance, feelChocCerveaux,
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

  // Heures supplémentaires (null si non configuré dans Réglages)
  const heuresSup = calcHeuresSup(store.sessions, reposId, store.settings, store.activeTimer, now)

  // ── Verre d'eau ───────────────────────────────────────────────────────────
  const waterLog    = store.settings.waterLog ?? []
  const todayStart  = new Date(getDateStr() + 'T00:00:00').getTime()
  const drinksToday = waterLog.filter(t => t >= todayStart).length
  const lastDrink   = waterLog.length > 0 ? Math.max(...waterLog) : 0
  const cooldownMs  = Math.max(0, lastDrink + 2 * 3_600_000 - now)
  const canDrink    = cooldownMs === 0

  function drinkWater() {
    if (!canDrink) return
    // Élague l'historique au-delà de 60 jours pour limiter la taille synchro
    const cutoff = Date.now() - 60 * 86_400_000
    store.updateSettings({ waterLog: [...waterLog.filter(t => t >= cutoff), Date.now()] })
  }

  function cooldownLabel(ms: number): string {
    const totalMin = Math.ceil(ms / 60_000)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
  }

  // ── Ressenti du jour ──────────────────────────────────────────────────────
  const todayKey  = getDateStr()
  const todayFeel = store.settings.dayFeel?.[todayKey] ?? 0

  function setFeel(value: number) {
    const dayFeel = { ...(store.settings.dayFeel ?? {}) }
    if (todayFeel === value) delete dayFeel[todayKey]
    else dayFeel[todayKey] = value
    store.updateSettings({ dayFeel })
  }

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
    weekCerveaux += calcDailyCharge(daySessions) + feelChocCerveaux(store.settings.dayFeel?.[d] ?? 0)
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

        {/* PV + Dette + Heures sup */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Points de vie</div>
            <div className="text-lg font-bold leading-none" style={{ color: pvColor }}>
              ❤️ {pvLabel}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">/ {store.settings.joursParMois}</div>
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
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Heures sup</div>
            {heuresSup !== null ? (
              <div className="text-lg font-bold leading-none"
                style={{ color: heuresSup >= 0 ? '#3B82F6' : '#EF4444' }}>
                {formatBalance(heuresSup)}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 leading-tight mt-1">
                À configurer dans Réglages
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hydratation ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 tracking-wider">HYDRATATION</p>
          <span className="text-xs text-gray-400">
            Aujourd'hui : <span className="font-bold text-blue-500">💧 × {drinksToday}</span>
          </span>
        </div>
        <button onClick={drinkWater} disabled={!canDrink}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={canDrink
            ? { backgroundColor: '#3B82F6', color: '#fff' }
            : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
          {canDrink
            ? '💧 J\'ai bu un verre d\'eau'
            : `⏳ Prochain verre dans ${cooldownLabel(cooldownMs)}`}
        </button>
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          +2 % d'énergie par verre, −1 % par créneau de 2h manqué (8h–20h, jours travaillés uniquement).
        </p>
      </div>

      {/* ── Ressenti du jour ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">RESSENTI DU JOUR</p>
        <div className="flex gap-1.5">
          {DAY_FEEL_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setFeel(opt.value)}
              className="flex-1 flex flex-col items-center py-2 rounded-xl border transition-all active:scale-95"
              style={todayFeel === opt.value
                ? { backgroundColor: opt.value < 0 ? '#FEF2F2' : '#F0FDF4',
                    borderColor: opt.value < 0 ? '#EF4444' : '#22C55E', borderWidth: 2 }
                : { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
              <span className="text-xl leading-none">{opt.emoji}</span>
              <span className="text-[8px] text-gray-400 mt-1 leading-none">{opt.effect}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          Choc 😕😖😵 : ajoute des cerveaux au score du jour (impacte énergie, PV, dette).
          Satisfaction 🙂😄🤩 : restaure de l'énergie en fin de journée. Re-cliquer pour annuler.
        </p>
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
            <span>Seuil semaine lourde (75🧠)</span>
            <span>{Math.min(Math.round(weekCerveaux), 75)} / 75</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(weekCerveaux / 75 * 100, 100)}%`, backgroundColor: zoneColor }} />
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
            ⚡ <strong>Énergie</strong> — Démarre à 100 %. Chaque jour de travail consomme selon
            la charge (−4 % à −25 %). Récupération : weekend libre +15 % (+8 % seulement si la semaine
            dépasse 75🧠), congé +20 %, journée courte +4 à +15 %, journée satisfaisante +3 à +10 %.
          </p>
          <p>
            ❤️ <strong>Points de vie</strong> — Perdus sur les journées brutales (≥ 28🧠 → −2 ;
            ≥ 22🧠 et énergie &lt; 25 % → −1) et lors d'un choc de rythme (semaine &gt; 75🧠 faisant
            plus d'1,5× la précédente → −1). Gagnés lors des semaines calmes, congés et weekends libres.
            Les gains sont divisés par 2 si la dette est active.
          </p>
          <p>
            ⛅ <strong>Dette</strong> — S'accumule après plusieurs semaines intenses (&gt; 75🧠/sem).
            Gelée entre 61–75🧠. Se résorbe sous 60🧠/sem. Pénalise les gains de PV tant qu'elle est active.
          </p>
          <p>
            😵 <strong>Ressenti</strong> — Un choc ajoute 2/4/8🧠 au score du jour ;
            une journée satisfaisante restaure 3/6/10 % d'énergie.
          </p>
          <div className="bg-gray-50 rounded-xl px-3 py-2 mt-1">
            <p className="font-semibold text-gray-700 mb-1">Zones journalières</p>
            <p>
              <span className="text-green-500 font-medium">Confort</span> ≤ 10 ·{' '}
              <span className="text-amber-500 font-medium">Nominal</span> ≤ 16 ·{' '}
              <span className="text-orange-500 font-medium">Tension</span> ≤ 24 ·{' '}
              <span className="text-red-500 font-medium">Surcharge</span> &gt; 24
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
