import { useState, useMemo } from 'react'
import type { Store } from '../store'
import Modal from './Modal'
import { calcVitals, feelToMoodScore, getDaysInMonth, getWeekRange, MONTHS } from '../utils'

interface Props {
  open:    boolean
  store:   Store
  onClose: () => void
}

type Gran = 'jour' | 'semaine' | 'mois'

const MOOD_EMOJI = ['😵', '😖', '😕', '🙂', '😄', '🤩']  // score 0–5

export default function StatsModal({ open, store, onClose }: Props) {
  const reposId = store.blocs.find(b => b.isRest)?.id ?? 'b_repos'
  const today   = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [gran,  setGran]  = useState<Gran>('jour')

  const vitals = useMemo(
    () => calcVitals(store.sessions, reposId, store.settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.sessions, store.settings, reposId, open]
  )

  if (!open) return null

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (isCurrentMonth) return; if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // ── Jours notés du mois (humeur renseignée) ────────────────────────────────
  const dayFeel  = store.settings.dayFeel  ?? {}
  const ritaline = store.settings.ritaline ?? {}
  const ulki     = store.settings.ulki     ?? {}
  const workedSet = new Set(
    store.sessions.filter(s => s.blocId !== reposId && s.date.startsWith(prefix)).map(s => s.date)
  )

  const days = getDaysInMonth(year, month)
  const notedDays: { date: string; mood: number; rit: boolean; dog: boolean; worked: boolean }[] = []
  for (let d = 1; d <= days; d++) {
    const date = `${prefix}-${String(d).padStart(2, '0')}`
    const mood = feelToMoodScore(dayFeel[date] ?? 0)
    if (mood === null) continue
    notedDays.push({ date, mood, rit: !!ritaline[date], dog: !!ulki[date], worked: workedSet.has(date) })
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const moodAvg = avg(notedDays.map(n => n.mood))

  const split = (pred: (n: typeof notedDays[number]) => boolean) => {
    const yes = notedDays.filter(pred)
    const no  = notedDays.filter(n => !pred(n))
    return { yesN: yes.length, noN: no.length, yesMood: avg(yes.map(n => n.mood)), noMood: avg(no.map(n => n.mood)) }
  }
  const ritStat  = split(n => n.rit)
  const dogStat  = split(n => n.dog)
  const workStat = split(n => n.worked)

  // Verres d'eau du mois
  const waterCount = (store.settings.waterLog ?? []).filter(t => {
    const dt = new Date(t)
    return dt.getFullYear() === year && dt.getMonth() === month
  }).length

  // ── Évolution énergie / cœur ───────────────────────────────────────────────
  const series = buildSeries(vitals.dayHistory, gran, prefix)

  return (
    <Modal open={open} onClose={onClose} title="📊 Statistiques">
      <div className="space-y-4">

        {/* Navigateur de mois */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-2 py-1.5">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg">‹</button>
          <span className="text-sm font-semibold text-gray-800 capitalize">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg disabled:opacity-30">›</button>
        </div>

        {notedDays.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            Aucune humeur notée ce mois-ci.<br />Les jours sans humeur ne sont pas comptés.
          </p>
        ) : (
          <>
            {/* Humeur moyenne */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Humeur moyenne · {notedDays.length} jour{notedDays.length > 1 ? 's' : ''} noté{notedDays.length > 1 ? 's' : ''}</p>
              <p className="text-3xl leading-none">{moodAvg !== null ? MOOD_EMOJI[Math.round(moodAvg)] : '—'}</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{moodAvg?.toFixed(1)} <span className="text-xs font-normal text-gray-400">/ 5</span></p>
            </div>

            {/* Comparaisons */}
            <CompareRow label="Ritaline" emoji="💊" onLabel="avec" offLabel="sans" stat={ritStat} />
            <CompareRow label="Ulki"     emoji="🐕" onLabel="avec" offLabel="sans" stat={dogStat} />
            <CompareRow label="Activité" emoji="💼" onLabel="travaillé" offLabel="repos" stat={workStat} />

            {/* Hydratation */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-600">💧 Verres d'eau du mois</span>
              <span className="text-sm font-bold text-blue-500">{waterCount}</span>
            </div>
          </>
        )}

        {/* Évolution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 tracking-wider">ÉVOLUTION</p>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['jour', 'semaine', 'mois'] as Gran[]).map(g => (
                <button key={g} onClick={() => setGran(g)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize transition-all"
                  style={gran === g ? { backgroundColor: '#fff', color: '#3B82F6' } : { color: '#9CA3AF' }}>{g}</button>
              ))}
            </div>
          </div>
          {series.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Pas encore de données.</p>
          ) : (
            <>
              <MiniChart title="⚡ Énergie" values={series.map(s => s.energy)} labels={series.map(s => s.label)} color="#22C55E" max={100} />
              <MiniChart title="❤️ Points de vie" values={series.map(s => s.pv)} labels={series.map(s => s.label)} color="#EF4444" max={30} />
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Séries d'évolution ───────────────────────────────────────────────────────

function buildSeries(
  dayHistory: { date: string; energy: number; pv: number }[],
  gran: Gran,
  monthPrefix: string,
): { label: string; energy: number; pv: number }[] {
  if (gran === 'jour') {
    return dayHistory
      .filter(d => d.date.startsWith(monthPrefix))
      .map(d => ({ label: d.date.slice(8), energy: d.energy, pv: d.pv }))
  }
  // Regroupe par semaine (lundi) ou par mois, sur tout l'historique
  const buckets = new Map<string, { energy: number[]; pv: number[]; label: string }>()
  for (const d of dayHistory) {
    let key: string, label: string
    if (gran === 'semaine') {
      const [wMon] = getWeekRange(d.date)
      key = wMon; label = wMon.slice(8) + '/' + wMon.slice(5, 7)
    } else {
      key = d.date.slice(0, 7)
      label = MONTHS[parseInt(key.slice(5, 7)) - 1].slice(0, 3)
    }
    if (!buckets.has(key)) buckets.set(key, { energy: [], pv: [], label })
    buckets.get(key)!.energy.push(d.energy)
    buckets.get(key)!.pv.push(d.pv)
  }
  return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([, v]) => ({
    label: v.label,
    energy: Math.round(v.energy.reduce((a, b) => a + b, 0) / v.energy.length),
    pv:     Math.round(v.pv.reduce((a, b) => a + b, 0) / v.pv.length),
  }))
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function CompareRow({ label, emoji, onLabel, offLabel, stat }: {
  label: string; emoji: string; onLabel: string; offLabel: string
  stat: { yesN: number; noN: number; yesMood: number | null; noMood: number | null }
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs font-semibold text-gray-500 mb-2">{emoji} {label} — humeur moyenne</p>
      <div className="flex gap-2">
        <div className="flex-1 bg-white rounded-lg py-2 text-center">
          <p className="text-[10px] text-gray-400 capitalize">{onLabel} · {stat.yesN}j</p>
          <p className="text-sm font-bold text-gray-800">{stat.yesMood !== null ? `${MOOD_EMOJI[Math.round(stat.yesMood)]} ${stat.yesMood.toFixed(1)}` : '—'}</p>
        </div>
        <div className="flex-1 bg-white rounded-lg py-2 text-center">
          <p className="text-[10px] text-gray-400 capitalize">{offLabel} · {stat.noN}j</p>
          <p className="text-sm font-bold text-gray-800">{stat.noMood !== null ? `${MOOD_EMOJI[Math.round(stat.noMood)]} ${stat.noMood.toFixed(1)}` : '—'}</p>
        </div>
      </div>
    </div>
  )
}

function MiniChart({ title, values, labels, color, max }: {
  title: string; values: number[]; labels: string[]; color: string; max: number
}) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-medium text-gray-500 mb-1">{title}</p>
      <div className="flex items-end gap-0.5 bg-gray-50 rounded-xl p-2" style={{ height: '72px' }}>
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center h-full" title={`${labels[i]} : ${v}`}>
            <div className="w-full rounded-t transition-all"
              style={{ height: `${Math.max((v / max) * 100, 2)}%`, backgroundColor: color, minWidth: '3px' }} />
          </div>
        ))}
      </div>
      {labels.length <= 16 && (
        <div className="flex gap-0.5 mt-0.5">
          {labels.map((l, i) => (
            <span key={i} className="flex-1 text-center text-[7px] text-gray-300 truncate">{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}
