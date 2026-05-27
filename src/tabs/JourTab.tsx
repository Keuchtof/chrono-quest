import { useState } from 'react'
import type { Store } from '../store'
import { COLORS, ZONE1_COLOR, ZONE2_COLOR } from '../constants'
import {
  formatDateFull, formatDateShort, formatDuration, secondsToDisplay,
  getDaySessions, getDateStr, addDays, formatTime,
  getWeekRange, getDatesInRange, getDaysInMonth, getFirstDayOffset,
  getBalance, isWeekend, formatBalance, MINI_DAYS, MONTHS,
} from '../utils'
import DonutChart from '../components/DonutChart'
import Drawer from '../components/Drawer'
import EditSessionModal from '../components/EditSessionModal'
import AddSessionModal from '../components/AddSessionModal'
import type { Session } from '../types'

interface Props { store: Store; now: number }
type View = 'jour' | 'semaine' | 'calendrier'

export default function JourTab({ store, now }: Props) {
  const [view,        setView]        = useState<View>('jour')
  const [date,        setDate]        = useState(getDateStr())
  const [calYear,     setCalYear]     = useState(() => new Date().getFullYear())
  const [calMonth,    setCalMonth]    = useState(() => new Date().getMonth())
  const [activeBloc,  setActiveBloc]  = useState<string | null>(null)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)

  const todayStr  = getDateStr()
  const isToday   = date === todayStr

  function openDay(d: string) {
    setDate(d)
    setView('jour')
    setActiveBloc(null)
  }

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

  const dayTotal   = blocStats.reduce((a, b) => a + b.totalSecs, 0)
  const dailyObj   = store.settings.heuresParJour * 3600
  const dayProgress = dailyObj > 0 ? Math.min(dayTotal / dailyObj, 1) : 0

  const zone1Secs  = daySessions.filter(s => s.zone === 'zone1').reduce((a, s) => a + s.duration, 0)
    + (isToday && store.activeTimer?.zone === 'zone1' ? activeExtra : 0)
  const zone2Secs  = daySessions.filter(s => s.zone === 'zone2').reduce((a, s) => a + s.duration, 0)
    + (isToday && store.activeTimer?.zone === 'zone2' ? activeExtra : 0)

  const dailyBalance = getBalance(
    store.sessions, store.settings, date, date,
    isToday ? store.activeTimer : null, isToday ? now : undefined,
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
  const weekDates    = getDatesInRange(weekMonday, weekSunday)

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
  const weekBalance  = getBalance(store.sessions, store.settings, weekMonday, weekSunday, store.activeTimer, now)
  const weekIsCurrentWeek = weekDates.includes(todayStr)

  // ─── Calendar view data ───────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(calYear, calMonth)
  const firstOffset  = getFirstDayOffset(calYear, calMonth)
  const nowDate      = new Date()
  const calIsCurrentMonth = calYear === nowDate.getFullYear() && calMonth === nowDate.getMonth()

  // Blocs that have at least one session this calendar month (for legend)
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

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">

      {/* View switcher */}
      <div className="bg-white rounded-2xl flex p-1 gap-1 shadow-sm">
        {(['jour', 'semaine', 'calendrier'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={view === v ? { backgroundColor: '#3B82F6', color: '#fff' } : { color: '#6B7280' }}>
            {v === 'jour' ? 'Jour' : v === 'semaine' ? 'Semaine' : 'Calendrier'}
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
                  <span className="text-xs font-bold"
                    style={{ color: dailyBalance >= 0 ? '#22C55E' : '#EF4444' }}>
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
              {/* Zone split */}
              {(zone1Secs > 0 || zone2Secs > 0) && (
                <ZoneSplit z1={zone1Secs} z2={zone2Secs}
                  name1={store.settings.zoneName1} name2={store.settings.zoneName2} />
              )}
            </div>
          </div>
        </div>

        {/* Per bloc */}
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

        {/* Config stats */}
        {configStats.length > 0 && (
          <StatBreakdown title="CONFIGURATION" color="#3B82F6" stats={configStats} total={dayTotal} />
        )}

        {/* Posture stats */}
        {postureStats.length > 0 && (
          <StatBreakdown title="POSTURE" color="#8B5CF6" stats={postureStats} total={dayTotal} />
        )}

        {/* Drawer sessions du bloc */}
        <Drawer open={!!activeBloc} onClose={() => setActiveBloc(null)}
          title={drawerBloc ? `${drawerBloc.icon} ${drawerBloc.name}` : ''}>
          {drawerSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune session enregistrée</p>
          ) : (
            <div className="space-y-2">
              {drawerSessions.map(s => (
                <div key={s.id} className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
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
                    </div>
                    <button onClick={() => setEditSession(s)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg">✏️</button>
                    <button onClick={() => store.deleteSession(s.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 rounded-lg">🗑</button>
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
              <p className="text-xl font-bold text-gray-900">{secondsToDisplay(weekTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Balance</p>
              <p className="text-lg font-bold"
                style={{ color: weekBalance >= 0 ? '#22C55E' : '#EF4444' }}>
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
              const dow      = new Date(d + 'T12:00:00').getDay()
              const letter   = MINI_DAYS[dow === 0 ? 6 : dow - 1]
              return (
                <button key={d} onClick={() => openDay(d)}
                  className="flex-1 flex flex-col items-center gap-0.5 active:opacity-70">
                  <div className="w-full flex flex-col justify-end" style={{ height: `${BAR_H}px` }}>
                    {total > 0 ? (
                      <div className="w-full rounded-t overflow-hidden" style={{ height: `${barH}px` }}>
                        {hasZone ? (
                          <>
                            {untagH > 0 && <div style={{ height: `${untagH}px`, backgroundColor: '#E5E7EB' }} />}
                            {z2H > 0   && <div style={{ height: `${z2H}px`,   backgroundColor: ZONE2_COLOR }} />}
                            {z1H > 0   && <div style={{ height: `${z1H}px`,   backgroundColor: ZONE1_COLOR }} />}
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
            const sess    = getDaySessions(store.sessions, d)
            const dIsToday = d === todayStr
            const dailyBal = getBalance(store.sessions, store.settings, d, d,
              dIsToday ? store.activeTimer : null, dIsToday ? now : undefined)
            return (
              <button key={d} onClick={() => openDay(d)}
                className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 capitalize">{formatDateShort(d)}</p>
                  <p className="text-xs text-gray-400">{sess.length} session{sess.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{secondsToDisplay(total)}</p>
                  <p className="text-xs font-bold"
                    style={{ color: dailyBal >= 0 ? '#22C55E' : '#EF4444' }}>
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
      </>}

      {/* ═══════════════════════ CALENDAR VIEW ═══════════════════════════ */}
      {view === 'calendrier' && <>
        {/* Month nav */}
        <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-sm">
          <button onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg text-lg">‹</button>
          <span className="text-sm font-semibold text-gray-800">
            {MONTHS[calMonth]} {calYear}
          </span>
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
              const day     = i + 1
              const ds      = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const we      = isWeekend(ds)
              const isTod   = ds === todayStr
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
