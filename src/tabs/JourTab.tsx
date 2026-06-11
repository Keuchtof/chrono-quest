import { useState } from 'react'
import type { Store } from '../store'
import { COLORS, ZONE1_COLOR, ZONE2_COLOR } from '../constants'
import {
  formatDateFull, formatDateShort, formatDuration, secondsToDisplay,
  getDaySessions, getDateStr, addDays, formatTime,
  getWeekRange, getDatesInRange, getDaysInMonth, getFirstDayOffset,
  getBalance, isWeekend, formatBalance, MINI_DAYS, MONTHS, getMonthEnd,
  calcDailyCharge, getJoursParMois,
} from '../utils'
import DonutChart from '../components/DonutChart'
import Drawer from '../components/Drawer'
import EditSessionModal from '../components/EditSessionModal'
import AddSessionModal from '../components/AddSessionModal'
import { ChargeDisplay } from '../components/ChargeSelector'
import type { Session, Bloc, ActiveTimer } from '../types'

interface Props { store: Store; now: number }
type View = 'jour' | 'semaine' | 'mois' | 'calendrier'

// Positive balance = exceeded target → red (risk of burn-out)
// Negative balance = below target    → green (room left)
function balColor(secs: number) { return secs >= 0 ? '#EF4444' : '#22C55E' }

// Charge mentale
function chargeZone(s: number)      { return s >= 13 ? 'Surcharge' : s >= 10 ? 'Tension' : s >= 8 ? 'Nominal' : 'Confort' }
function chargeZoneColor(s: number) { return s >= 13 ? '#EF4444' : s >= 10 ? '#F97316' : s >= 8 ? '#EAB308' : '#22C55E' }

export default function JourTab({ store, now }: Props) {
  const [view,        setView]        = useState<View>('jour')
  const [date,        setDate]        = useState(getDateStr())
  const [calYear,     setCalYear]     = useState(() => new Date().getFullYear())
  const [calMonth,    setCalMonth]    = useState(() => new Date().getMonth())
  const [activeBloc,  setActiveBloc]  = useState<string | null>(null)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [agendaView,  setAgendaView]  = useState(false)

  const todayStr  = getDateStr()
  const isToday   = date === todayStr
  const reposId   = store.blocs.find(b => b.isRest)?.id ?? 'b_repos'

  function openDay(d: string) { setDate(d); setView('jour'); setActiveBloc(null) }
  function openWeek(wMon: string) { setDate(wMon); setView('semaine') }

  // ─── Day view data ────────────────────────────────────────────────────────
  const daySessions = getDaySessions(store.sessions, date)
  const activeExtra = isToday && store.activeTimer
    ? Math.round((now - store.activeTimer.startTime) / 1000) : 0

  const blocStats = store.blocs.map(b => {
    const bSess  = daySessions.filter(s => s.blocId === b.id)
    const extra  = isToday && store.activeTimer?.blocId === b.id ? activeExtra : 0
    const total  = bSess.reduce((a, s) => a + s.duration, 0) + extra
    return { bloc: b, totalSecs: total, sessions: bSess }
  }).filter(b => b.totalSecs > 0)

  const dayTotal    = blocStats.reduce((a, b) => a + b.totalSecs, 0)
  const dailyObj    = store.settings.heuresParJour * 3600
  const dayProgress = dailyObj > 0 ? Math.min(dayTotal / dailyObj, 1) : 0

  // Charge mentale du jour (sessions + timer actif si aujourd'hui)
  const activeAsSess: Session | null = isToday && store.activeTimer ? {
    id: '_active', blocId: store.activeTimer.blocId, date,
    startTime: store.activeTimer.startTime, endTime: now,
    duration: activeExtra, tag: '', config: '', posture: '', zone: '',
    chargeNiveau: store.activeTimer.chargeNiveau,
  } : null
  const chargeSessions = (activeAsSess ? [...daySessions, activeAsSess] : daySessions)
    .filter(s => s.blocId !== reposId)
  const dayCharge        = calcDailyCharge(chargeSessions)
  const dayChargeHasData = chargeSessions.some(s => (s.chargeNiveau ?? 0) > 0)

  const zone1Secs = daySessions.filter(s => s.zone === 'zone1').reduce((a, s) => a + s.duration, 0)
    + (isToday && store.activeTimer?.zone === 'zone1' ? activeExtra : 0)
  const zone2Secs = daySessions.filter(s => s.zone === 'zone2').reduce((a, s) => a + s.duration, 0)
    + (isToday && store.activeTimer?.zone === 'zone2' ? activeExtra : 0)

  const dailyBalance = getBalance(
    store.sessions, store.settings, date, date,
    isToday ? store.activeTimer : null, isToday ? now : undefined, reposId,
  )

  const configStats = store.settings.configurations
    .map(cfg => ({ name: cfg, secs: daySessions.filter(s => s.config === cfg).reduce((a, s) => a + s.duration, 0) }))
    .filter(c => c.secs > 0).sort((a, b) => b.secs - a.secs)

  const postureStats = store.settings.postures
    .map(p => ({ name: p, secs: daySessions.filter(s => s.posture === p).reduce((a, s) => a + s.duration, 0) }))
    .filter(p => p.secs > 0).sort((a, b) => b.secs - a.secs)

  const drawerBloc     = activeBloc ? store.blocs.find(b => b.id === activeBloc) : null
  const drawerSessions = activeBloc ? daySessions.filter(s => s.blocId === activeBloc) : []

  const donutSegments = blocStats.map(b => ({
    id: b.bloc.id, value: b.totalSecs, color: COLORS[b.bloc.color].main,
  }))

  // ─── Week view data ───────────────────────────────────────────────────────
  const [weekMonday, weekSunday] = getWeekRange(date)
  const allWeekDates = getDatesInRange(weekMonday, weekSunday)
  const showWeekend  = store.settings.showWeekend ?? false
  const weekDates    = showWeekend ? allWeekDates : allWeekDates.filter(d => !isWeekend(d))
  const weekTarget   = 5 * store.settings.heuresParJour * 3600

  const weekDayData = weekDates.map(d => {
    const sess     = getDaySessions(store.sessions, d)
    const dIsToday = d === todayStr
    const extra2   = dIsToday && store.activeTimer ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
    const total    = sess.reduce((a, s) => a + s.duration, 0) + extra2
    const z1 = sess.filter(s => s.zone === 'zone1').reduce((a, s) => a + s.duration, 0)
      + (dIsToday && store.activeTimer?.zone === 'zone1' ? extra2 : 0)
    const z2 = sess.filter(s => s.zone === 'zone2').reduce((a, s) => a + s.duration, 0)
      + (dIsToday && store.activeTimer?.zone === 'zone2' ? extra2 : 0)
    return { date: d, total, z1, z2, weekend: isWeekend(d), isToday: dIsToday }
  })

  const weekMaxTotal = Math.max(...weekDayData.map(d => d.total), 1)
  const weekTotal    = weekDayData.reduce((a, d) => a + d.total, 0)
  const weekBalance  = getBalance(store.sessions, store.settings, weekMonday, weekSunday, store.activeTimer, now, reposId)
  const weekIsCurrentWeek = allWeekDates.includes(todayStr)

  // ─── Month view data ──────────────────────────────────────────────────────
  const calIsCurrentMonth = calYear === new Date().getFullYear() && calMonth === new Date().getMonth()
  const monthEnd          = getMonthEnd(calYear, calMonth)
  const monthStart        = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`

  // Group all days in the month by their ISO week (keyed by week's Monday)
  const weekGroupMap = new Map<string, string[]>()
  const daysInCurMonth = getDaysInMonth(calYear, calMonth)
  for (let d = 1; d <= daysInCurMonth; d++) {
    const ds   = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const [wm] = getWeekRange(ds)
    if (!weekGroupMap.has(wm)) weekGroupMap.set(wm, [])
    weekGroupMap.get(wm)!.push(ds)
  }

  const monthWeekData = [...weekGroupMap.entries()].map(([wMon, days], idx) => {
    let total = 0, z1 = 0, z2 = 0
    for (const d of days) {
      const sess  = getDaySessions(store.sessions, d)
      const isTod = d === todayStr
      const ex    = isTod && store.activeTimer ? Math.round((now - store.activeTimer.startTime) / 1000) : 0
      total += sess.reduce((a, s) => a + s.duration, 0) + ex
      z1    += sess.filter(s => s.zone === 'zone1').reduce((a, s) => a + s.duration, 0)
              + (isTod && store.activeTimer?.zone === 'zone1' ? ex : 0)
      z2    += sess.filter(s => s.zone === 'zone2').reduce((a, s) => a + s.duration, 0)
              + (isTod && store.activeTimer?.zone === 'zone2' ? ex : 0)
    }
    const balance = getBalance(
      store.sessions, store.settings,
      days[0], days[days.length - 1],
      store.activeTimer, now, reposId,
    )
    return { wMon, days, total, z1, z2, balance, weekNum: idx + 1 }
  })

  const monthTotal2   = monthWeekData.reduce((a, w) => a + w.total, 0)
  const monthBalance2 = getBalance(store.sessions, store.settings, monthStart, monthEnd, store.activeTimer, now, reposId)
  const monthMaxTotal = Math.max(...monthWeekData.map(w => w.total), 1)
  const monthObjSecs  = getJoursParMois(store.settings, calYear, calMonth) * store.settings.heuresParJour * 3600

  // ─── Calendar view data ───────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(calYear, calMonth)
  const firstOffset  = getFirstDayOffset(calYear, calMonth)

  // Blocs with sessions this calendar month (for legend)
  const calMonthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-`
  const calActiveBlocs = store.blocs.filter(b =>
    store.sessions.some(s => s.blocId === b.id && s.date.startsWith(calMonthPrefix)),
  )

  function getDominantBloc(dateStr: string) {
    const sess = getDaySessions(store.sessions, dateStr)
    if (sess.length === 0) return null
    const totals: Record<string, number> = {}
    sess.forEach(s => { totals[s.blocId] = (totals[s.blocId] ?? 0) + s.duration })
    const topId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0]
    return store.blocs.find(b => b.id === topId) ?? null
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calIsCurrentMonth) return
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const VIEW_LABELS: Record<View, string> = {
    jour: 'Jour', semaine: 'Semaine', mois: 'Mois', calendrier: 'Calendrier',
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">

      {/* View switcher */}
      <div className="bg-white rounded-2xl flex p-1 gap-1 shadow-sm">
        {(['jour', 'semaine', 'mois', 'calendrier'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={view === v ? { backgroundColor: '#3B82F6', color: '#fff' } : { color: '#6B7280' }}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* ═══════════════════════ DAY VIEW ═════════════════════════════════ */}
      {view === 'jour' && <>
        {/* Nav */}
        <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-sm">
          <button onClick={() => setDate(d => addDays(d, -1))}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg">‹</button>
          <button onClick={() => setDate(todayStr)} className="text-sm font-semibold text-gray-800 capitalize text-center flex-1 mx-1">
            {formatDateFull(date)}
            {!isToday && <span className="ml-1.5 text-[10px] text-blue-400 font-medium">→ auj.</span>}
          </button>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg disabled:opacity-30">›</button>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-4 items-center">
            <DonutChart segments={donutSegments} size={120} thickness={22}
              centerLabel={secondsToDisplay(dayTotal)}
              onSegmentClick={id => setActiveBloc(id === activeBloc ? null : id)}
              activeId={activeBloc} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-semibold text-orange-500 tracking-wide">TEMPS DU JOUR</p>
                {dayTotal > 0 && (
                  <span className="text-xs font-bold" style={{ color: balColor(dailyBalance) }}>
                    {formatBalance(dailyBalance)}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900">
                {secondsToDisplay(dayTotal)}{' '}
                <span className="text-sm font-normal text-gray-400">/ {secondsToDisplay(dailyObj)}</span>
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5 mb-2">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${dayProgress * 100}%`, background: 'linear-gradient(to right,#3B82F6,#22C55E)' }} />
              </div>
              {(zone1Secs > 0 || zone2Secs > 0) && (
                <ZoneSplit z1={zone1Secs} z2={zone2Secs}
                  name1={store.settings.zoneName1} name2={store.settings.zoneName2} />
              )}
              {/* Score charge mentale */}
              {dayTotal > 0 && (
                <div className="flex items-center gap-1.5 text-xs mt-1.5">
                  <span>🧠</span>
                  {dayChargeHasData ? (
                    <>
                      <span className="font-semibold" style={{ color: chargeZoneColor(dayCharge) }}>
                        {Math.round(dayCharge * 10) / 10} cerveaux
                      </span>
                      <span className="text-gray-400">· {chargeZone(dayCharge)}</span>
                    </>
                  ) : (
                    <span className="text-gray-300">Charge non renseignée</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Per-bloc */}
        {blocStats.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Aucune session ce jour</div>
        )}
        {blocStats.map(({ bloc, totalSecs }) => {
          const color = COLORS[bloc.color]
          const pct   = dayTotal > 0 ? Math.round((totalSecs / dayTotal) * 100) : 0
          return (
            <button key={bloc.id} onClick={() => setActiveBloc(activeBloc === bloc.id ? null : bloc.id)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left transition-all active:scale-[0.99]"
              style={activeBloc === bloc.id ? { outline: `2px solid ${color.main}` } : {}}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: color.light }}>{bloc.icon}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900">{bloc.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{secondsToDisplay(totalSecs)}</span>
                  <p className="text-xs text-gray-400">{pct}%</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color.main }} />
              </div>
            </button>
          )
        })}

        {configStats.length > 0 && (
          <StatBreakdown title="CONFIGURATION" color="#3B82F6" stats={configStats} total={dayTotal} />
        )}
        {postureStats.length > 0 && (
          <StatBreakdown title="POSTURE" color="#8B5CF6" stats={postureStats} total={dayTotal} />
        )}

        {/* Bloc sessions drawer */}
        <Drawer open={!!activeBloc} onClose={() => setActiveBloc(null)}
          title={drawerBloc ? `${drawerBloc.icon} ${drawerBloc.name}` : ''}>
          {drawerSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune session enregistrée</p>
          ) : (
            <div className="space-y-2">
              {drawerSessions.map(s => (
                <div key={s.id} className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-xs text-gray-400">{formatTime(s.startTime)}</span>
                        {s.config  && <SChip label={s.config}  color="#3B82F6" />}
                        {s.posture && <SChip label={s.posture} color="#8B5CF6" />}
                        {s.zone === 'zone1' && <SChip label={store.settings.zoneName1} color={ZONE1_COLOR} />}
                        {s.zone === 'zone2' && <SChip label={store.settings.zoneName2} color={ZONE2_COLOR} />}
                        {s.tag     && <SChip label={s.tag}     color="#6B7280" />}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatDuration(s.duration)}</span>
                      <ChargeDisplay niveau={s.chargeNiveau} />
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                      <button onClick={() => setEditSession(s)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg">✏️</button>
                      <button onClick={() => store.deleteSession(s.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 rounded-lg">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Drawer>
      </>}

      {/* ═══════════════════════ WEEK VIEW ════════════════════════════════ */}
      {view === 'semaine' && <>
        {/* Week nav */}
        <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-sm">
          <button onClick={() => setDate(d => addDays(d, -7))}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg">‹</button>
          <button onClick={() => setDate(todayStr)} className="text-sm font-semibold text-gray-800 flex-1 mx-1 text-center">
            {formatDateShort(weekMonday)} – {formatDateShort(weekSunday)}
            {!weekIsCurrentWeek && <span className="ml-1.5 text-[10px] text-blue-400 font-medium">→ auj.</span>}
          </button>
          <button onClick={() => setDate(d => addDays(d, 7))} disabled={weekIsCurrentWeek}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg disabled:opacity-30">›</button>
        </div>

        {/* Week summary + bar chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wider">TOTAL SEMAINE</p>
              <p className="text-xl font-bold text-gray-900">
                {secondsToDisplay(weekTotal)}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {secondsToDisplay(weekTarget)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Balance</p>
              <p className="text-lg font-bold" style={{ color: balColor(weekBalance) }}>
                {formatBalance(weekBalance)}
              </p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex gap-1 items-end" style={{ height: '100px' }}>
            {weekDayData.map(({ date: d, total, z1, z2, weekend: we, isToday: it }) => {
              const BAR_H   = 80
              const barH    = weekMaxTotal > 0 ? (total / weekMaxTotal) * BAR_H : 0
              const z1H     = total > 0 && z1 > 0 ? (z1 / total) * barH : 0
              const z2H     = total > 0 && z2 > 0 ? (z2 / total) * barH : 0
              const untagH  = barH - z1H - z2H
              const hasZone = z1 > 0 || z2 > 0
              const dow     = new Date(d + 'T12:00:00').getDay()
              const letter  = MINI_DAYS[dow === 0 ? 6 : dow - 1]
              return (
                <button key={d} onClick={() => openDay(d)}
                  className="flex-1 flex flex-col items-center gap-0.5 active:opacity-70">
                  <div className="w-full flex flex-col justify-end" style={{ height: `${BAR_H}px` }}>
                    {total > 0 ? (
                      <div className="w-full rounded-t overflow-hidden" style={{ height: `${barH}px` }}>
                        {hasZone ? (
                          <>
                            {untagH > 0 && <div style={{ height: `${untagH}px`, backgroundColor: '#E5E7EB' }} />}
                            {z2H   > 0 && <div style={{ height: `${z2H}px`,   backgroundColor: ZONE2_COLOR }} />}
                            {z1H   > 0 && <div style={{ height: `${z1H}px`,   backgroundColor: ZONE1_COLOR }} />}
                          </>
                        ) : (
                          <div style={{
                            height: '100%',
                            backgroundColor: we ? '#D1D5DB' : '#60A5FA',
                            opacity: it ? 1 : 0.75,
                          }} />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-1 rounded"
                        style={{ backgroundColor: we ? '#E5E7EB' : '#EFF6FF' }} />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold"
                    style={{ color: it ? '#3B82F6' : we ? '#9CA3AF' : '#6B7280' }}>{letter}</span>
                  {total > 0 && (
                    <span className="text-[9px] text-gray-400 leading-none">{secondsToDisplay(total)}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Week zone split */}
          {(() => {
            const wz1 = weekDayData.reduce((a, d) => a + d.z1, 0)
            const wz2 = weekDayData.reduce((a, d) => a + d.z2, 0)
            if (wz1 + wz2 === 0) return null
            return (
              <div className="mt-3">
                <ZoneSplit z1={wz1} z2={wz2} name1={store.settings.zoneName1} name2={store.settings.zoneName2} />
              </div>
            )
          })()}
        </div>

        {/* Day list */}
        <div className="space-y-2">
          {weekDayData.filter(d => d.total > 0).map(({ date: d, total }) => {
            const sess     = getDaySessions(store.sessions, d)
            const dIsToday = d === todayStr
            const dailyBal = getBalance(store.sessions, store.settings, d, d,
              dIsToday ? store.activeTimer : null, dIsToday ? now : undefined, reposId)
            return (
              <button key={d} onClick={() => openDay(d)}
                className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 capitalize">{formatDateShort(d)}</p>
                  <p className="text-xs text-gray-400">{sess.length} session{sess.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{secondsToDisplay(total)}</p>
                  <p className="text-xs font-bold" style={{ color: balColor(dailyBal) }}>
                    {formatBalance(dailyBal)}
                  </p>
                </div>
              </button>
            )
          })}
          {weekDayData.every(d => d.total === 0) && (
            <div className="text-center py-8 text-gray-400 text-sm">Aucune session cette semaine</div>
          )}
        </div>

        {/* Toggle agenda */}
        <div className="flex justify-center">
          <button onClick={() => setAgendaView(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={agendaView
              ? { backgroundColor: '#3B82F6', color: '#fff' }
              : { backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            📅 Vue agenda
          </button>
        </div>

        {agendaView && (
          <AgendaGrid
            weekDates={weekDates}
            sessions={store.sessions}
            blocs={store.blocs}
            activeTimer={store.activeTimer}
            now={now}
            todayStr={todayStr}
            onEditSession={setEditSession}
          />
        )}
      </>}

      {/* ═══════════════════════ MONTH VIEW ═══════════════════════════════ */}
      {view === 'mois' && <>
        {/* Month nav */}
        <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-sm">
          <button onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg">‹</button>
          <span className="text-sm font-semibold text-gray-800">{MONTHS[calMonth]} {calYear}</span>
          <button onClick={nextMonth} disabled={calIsCurrentMonth}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg disabled:opacity-30">›</button>
        </div>

        {/* Month summary + bar chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wider">TOTAL MOIS</p>
              <p className="text-xl font-bold text-gray-900">
                {secondsToDisplay(monthTotal2)}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {secondsToDisplay(monthObjSecs)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Balance</p>
              <p className="text-lg font-bold" style={{ color: balColor(monthBalance2) }}>
                {formatBalance(monthBalance2)}
              </p>
            </div>
          </div>

          {/* Bar chart — one bar per week of the month */}
          <div className="flex gap-2 items-end" style={{ height: '100px' }}>
            {monthWeekData.map(({ wMon, total, z1, z2, weekNum }) => {
              const BAR_H   = 80
              const barH    = monthMaxTotal > 0 ? (total / monthMaxTotal) * BAR_H : 0
              const z1H     = total > 0 && z1 > 0 ? (z1 / total) * barH : 0
              const z2H     = total > 0 && z2 > 0 ? (z2 / total) * barH : 0
              const untagH  = barH - z1H - z2H
              const hasZone = z1 > 0 || z2 > 0
              return (
                <button key={wMon} onClick={() => openWeek(wMon)}
                  className="flex-1 flex flex-col items-center gap-0.5 active:opacity-70">
                  <div className="w-full flex flex-col justify-end" style={{ height: `${BAR_H}px` }}>
                    {total > 0 ? (
                      <div className="w-full rounded-t overflow-hidden" style={{ height: `${barH}px` }}>
                        {hasZone ? (
                          <>
                            {untagH > 0 && <div style={{ height: `${untagH}px`, backgroundColor: '#E5E7EB' }} />}
                            {z2H   > 0 && <div style={{ height: `${z2H}px`,   backgroundColor: ZONE2_COLOR }} />}
                            {z1H   > 0 && <div style={{ height: `${z1H}px`,   backgroundColor: ZONE1_COLOR }} />}
                          </>
                        ) : (
                          <div style={{ height: '100%', backgroundColor: '#60A5FA' }} />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-1 rounded" style={{ backgroundColor: '#EFF6FF' }} />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500">S{weekNum}</span>
                  {total > 0 && (
                    <span className="text-[9px] text-gray-400 leading-none">{secondsToDisplay(total)}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Month zone split */}
          {(() => {
            const mz1 = monthWeekData.reduce((a, w) => a + w.z1, 0)
            const mz2 = monthWeekData.reduce((a, w) => a + w.z2, 0)
            if (mz1 + mz2 === 0) return null
            return (
              <div className="mt-3">
                <ZoneSplit z1={mz1} z2={mz2} name1={store.settings.zoneName1} name2={store.settings.zoneName2} />
              </div>
            )
          })()}
        </div>

        {/* Week list */}
        <div className="space-y-2">
          {monthWeekData.filter(w => w.total > 0).map(({ wMon, days, total, balance, weekNum }) => (
            <button key={wMon} onClick={() => openWeek(wMon)}
              className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Sem.&nbsp;{weekNum} · {formatDateShort(days[0])} – {formatDateShort(days[days.length - 1])}
                </p>
                <p className="text-xs text-gray-400">
                  {days.filter(d => getDaySessions(store.sessions, d).length > 0).length} jour{days.filter(d => getDaySessions(store.sessions, d).length > 0).length > 1 ? 's' : ''} actifs
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{secondsToDisplay(total)}</p>
                <p className="text-xs font-bold" style={{ color: balColor(balance) }}>
                  {formatBalance(balance)}
                </p>
              </div>
            </button>
          ))}
          {monthWeekData.every(w => w.total === 0) && (
            <div className="text-center py-8 text-gray-400 text-sm">Aucune session ce mois</div>
          )}
        </div>
      </>}

      {/* ═══════════════════════ CALENDAR VIEW ═══════════════════════════ */}
      {view === 'calendrier' && <>
        {/* Month nav */}
        <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-sm">
          <button onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg">‹</button>
          <span className="text-sm font-semibold text-gray-800">{MONTHS[calMonth]} {calYear}</span>
          <button onClick={nextMonth} disabled={calIsCurrentMonth}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg disabled:opacity-30">›</button>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {MINI_DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstOffset }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day      = i + 1
              const ds       = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const we       = isWeekend(ds)
              const isTod    = ds === todayStr
              const isFuture = ds > todayStr
              const dominant = getDominantBloc(ds)
              return (
                <button key={day} onClick={() => openDay(ds)}
                  className="flex flex-col items-center py-1.5 rounded-xl transition-all active:scale-95"
                  style={isTod ? { backgroundColor: '#EFF6FF' } : {}}>
                  <span className="text-xs font-medium mb-1"
                    style={{ color: isTod ? '#3B82F6' : we ? '#9CA3AF' : isFuture ? '#D1D5DB' : '#374151' }}>
                    {day}
                  </span>
                  {dominant ? (
                    <div className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[dominant.color].main }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isFuture || we ? 'transparent' : '#F3F4F6' }} />
                  )}
                </button>
              )
            })}
          </div>
          {/* Legend */}
          {calActiveBlocs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-2">
              {calActiveBlocs.map(b => (
                <div key={b.id} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[b.color].main }} />
                  <span className="text-xs text-gray-500">{b.icon} {b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </>}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        style={{ position: 'fixed', bottom: '80px', right: 'max(16px, calc((100vw - 448px) / 2 + 16px))' }}>+</button>

      <EditSessionModal open={!!editSession} session={editSession} blocs={store.blocs}
        settings={store.settings}
        onSave={patch => editSession && store.updateSession(editSession.id, patch)}
        onClose={() => setEditSession(null)} />

      <AddSessionModal open={showAdd} blocs={store.blocs} settings={store.settings}
        defaultDate={date} onAdd={store.addSession} onClose={() => setShowAdd(false)} />
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ZoneSplit({ z1, z2, name1, name2 }: { z1: number; z2: number; name1: string; name2: string }) {
  const total = z1 + z2
  if (total === 0) return null
  return (
    <div>
      <div className="flex text-[10px] text-gray-500 justify-between mb-0.5">
        <span style={{ color: ZONE1_COLOR }}>{name1} · {Math.round((z1 / total) * 100)}%</span>
        <span style={{ color: ZONE2_COLOR }}>{Math.round((z2 / total) * 100)}% · {name2}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: '#F3F4F6' }}>
        <div style={{ width: `${(z1 / total) * 100}%`, backgroundColor: ZONE1_COLOR }} />
        <div style={{ width: `${(z2 / total) * 100}%`, backgroundColor: ZONE2_COLOR }} />
      </div>
    </div>
  )
}

function StatBreakdown({ title, color, stats, total }: {
  title: string; color: string
  stats: { name: string; secs: number }[]
  total: number
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">{title}</p>
      <div className="space-y-2">
        {stats.map(({ name, secs }) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-xs text-gray-700 w-24 truncate shrink-0">{name}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${total > 0 ? (secs / total) * 100 : 0}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs text-gray-500 w-12 text-right shrink-0">{secondsToDisplay(secs)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: color + '22', color }}>{label}</span>
  )
}

// ─── Agenda view ─────────────────────────────────────────────────────────────

const PX_PER_HOUR = 60

interface AgendaGridProps {
  weekDates:     string[]
  sessions:      Session[]
  blocs:         Bloc[]
  activeTimer:   ActiveTimer | null
  now:           number
  todayStr:      string
  onEditSession: (s: Session) => void
}

function AgendaGrid({ weekDates, sessions, blocs, activeTimer, now, todayStr, onEditSession }: AgendaGridProps) {
  // Detect visible hour range from sessions + active timer
  let minHour = 8
  let maxHour = 18

  for (const d of weekDates) {
    const midnight = new Date(d + 'T00:00:00').getTime()
    for (const s of sessions.filter(ss => ss.date === d)) {
      const sh = (s.startTime - midnight) / 3600000
      const eh = sh + s.duration / 3600
      if (sh < minHour) minHour = Math.floor(sh)
      if (eh > maxHour) maxHour = Math.ceil(eh)
    }
  }
  if (activeTimer) {
    const midnight = new Date(todayStr + 'T00:00:00').getTime()
    const sh = (activeTimer.startTime - midnight) / 3600000
    const eh = (now - midnight) / 3600000
    if (sh < minHour) minHour = Math.floor(sh)
    if (eh > maxHour) maxHour = Math.ceil(eh)
  }
  minHour = Math.max(0,  minHour - 1)
  maxHour = Math.min(24, maxHour + 1)

  const totalHours = maxHour - minHour
  const gridHeight = totalHours * PX_PER_HOUR
  const hours      = Array.from({ length: totalHours + 1 }, (_, i) => minHour + i)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-gray-100">
        <div className="w-8 flex-shrink-0" />
        {weekDates.map(d => {
          const dow  = new Date(d + 'T12:00:00').getDay()
          const ltr  = MINI_DAYS[dow === 0 ? 6 : dow - 1]
          const num  = new Date(d + 'T12:00:00').getDate()
          const isT  = d === todayStr
          const isWe = isWeekend(d)
          return (
            <div key={d} className="flex-1 text-center py-1.5">
              <div className="text-[9px] font-semibold leading-none mb-0.5"
                style={{ color: isT ? '#3B82F6' : isWe ? '#D1D5DB' : '#9CA3AF' }}>{ltr}</div>
              <div className="text-xs font-bold"
                style={{ color: isT ? '#3B82F6' : isWe ? '#9CA3AF' : '#374151' }}>{num}</div>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
        <div className="flex" style={{ height: `${gridHeight}px` }}>

          {/* Time labels */}
          <div className="w-8 flex-shrink-0 relative" style={{ height: `${gridHeight}px` }}>
            {hours.map(h => (
              <div key={h} className="absolute right-1.5 text-right"
                style={{ top: `${(h - minHour) * PX_PER_HOUR - 7}px` }}>
                <span className="text-[9px] text-gray-400 font-medium">{h}h</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map(d => {
            const midnight    = new Date(d + 'T00:00:00').getTime()
            const daySessions = sessions.filter(s => s.date === d)
            const isT         = d === todayStr
            const isWe        = isWeekend(d)

            return (
              <div key={d} className="flex-1 relative border-l border-gray-100"
                style={{ height: `${gridHeight}px`, backgroundColor: isWe ? '#FAFAFA' : '#fff' }}>

                {/* Hour grid lines */}
                {hours.map(h => (
                  <div key={h} className="absolute left-0 right-0"
                    style={{ top: `${(h - minHour) * PX_PER_HOUR}px`, borderTop: '1px solid #F3F4F6' }} />
                ))}

                {/* Half-hour lines */}
                {hours.slice(0, -1).map(h => (
                  <div key={`h${h}`} className="absolute left-0 right-0"
                    style={{ top: `${(h - minHour) * PX_PER_HOUR + PX_PER_HOUR / 2}px`, borderTop: '1px dashed #F9FAFB' }} />
                ))}

                {/* Sessions */}
                {daySessions.map(s => {
                  const bloc   = blocs.find(b => b.id === s.blocId)
                  const color  = bloc ? COLORS[bloc.color] : { main: '#9CA3AF', light: '#F3F4F6' }
                  const startH = (s.startTime - midnight) / 3600000
                  const top    = Math.max(0, (startH - minHour) * PX_PER_HOUR)
                  const height = Math.max((s.duration / 3600) * PX_PER_HOUR, 6)
                  return (
                    <button key={s.id} onClick={() => onEditSession(s)}
                      className="absolute left-px right-px rounded overflow-hidden text-left active:opacity-70 transition-opacity"
                      style={{ top: `${top}px`, height: `${height}px`, backgroundColor: color.main }}>
                      {height >= 18 && (
                        <div className="px-1 pt-0.5 overflow-hidden">
                          <p className="text-[8px] font-bold text-white leading-tight truncate">
                            {bloc?.icon}{height >= 28 ? ` ${bloc?.name ?? ''}` : ''}
                          </p>
                          {height >= 38 && (
                            <p className="text-[8px] text-white opacity-80 leading-none truncate">
                              {formatDuration(s.duration)}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* Active timer (today only) */}
                {isT && activeTimer && (() => {
                  const bloc    = blocs.find(b => b.id === activeTimer.blocId)
                  const color   = bloc ? COLORS[bloc.color] : { main: '#9CA3AF', light: '#F3F4F6' }
                  const dur     = Math.round((now - activeTimer.startTime) / 1000)
                  const startH  = (activeTimer.startTime - midnight) / 3600000
                  const top     = Math.max(0, (startH - minHour) * PX_PER_HOUR)
                  const height  = Math.max((dur / 3600) * PX_PER_HOUR, 6)
                  return (
                    <div className="absolute left-px right-px rounded overflow-hidden"
                      style={{ top: `${top}px`, height: `${height}px`, backgroundColor: color.main + 'bb', border: `1.5px solid ${color.main}` }}>
                      {height >= 18 && (
                        <div className="px-1 pt-0.5">
                          <p className="text-[8px] font-bold text-white leading-tight truncate">
                            {bloc?.icon} ●
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
