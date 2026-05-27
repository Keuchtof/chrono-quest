import { useState, useEffect, useCallback } from 'react'
import type { Bloc, Session, ActiveTimer, Settings } from './types'
import { DEFAULT_BLOCS, DEFAULT_SETTINGS } from './constants'
import { generateId, getDateStr } from './utils'

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}

function save<T>(key: string, v: T) {
  localStorage.setItem(key, JSON.stringify(v))
}

function sessionFromTimer(t: ActiveTimer): Session {
  const endTime = Date.now()
  return {
    id: generateId(),
    blocId: t.blocId,
    date: getDateStr(new Date(t.startTime)),
    startTime: t.startTime,
    endTime,
    duration: Math.round((endTime - t.startTime) / 1000),
    tag: t.tag,
    config: t.config,
    posture: t.posture,
    zone: t.zone,
  }
}

function emptyTimer(blocId: string): ActiveTimer {
  return { blocId, startTime: Date.now(), tag: '', config: '', posture: '', zone: '' }
}

export function useStore() {
  const [blocs,       setBlocs]       = useState<Bloc[]>             (() => load('cq_blocs',    DEFAULT_BLOCS))
  const [sessions,    setSessions]    = useState<Session[]>          (() => load('cq_sessions', []))
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null> (() => load('cq_timer',    null))
  const [settings,    setSettings]    = useState<Settings>           (() => {
    const s = load<Partial<Settings>>('cq_settings', {})
    return {
      ...DEFAULT_SETTINGS, ...s,
      configurations: s.configurations?.length ? s.configurations : DEFAULT_SETTINGS.configurations,
      postures:       s.postures?.length       ? s.postures       : DEFAULT_SETTINGS.postures,
      zoneName1:      s.zoneName1 ?? DEFAULT_SETTINGS.zoneName1,
      zoneName2:      s.zoneName2 ?? DEFAULT_SETTINGS.zoneName2,
    }
  })

  useEffect(() => { save('cq_blocs',    blocs)       }, [blocs])
  useEffect(() => { save('cq_sessions', sessions)    }, [sessions])
  useEffect(() => { save('cq_timer',    activeTimer) }, [activeTimer])
  useEffect(() => { save('cq_settings', settings)    }, [settings])

  const startTimer = useCallback((blocId: string) => {
    setActiveTimer(prev => {
      if (prev) {
        const dur = Math.round((Date.now() - prev.startTime) / 1000)
        if (dur >= 1) setSessions(s => [...s, sessionFromTimer(prev)])
      }
      return emptyTimer(blocId)
    })
  }, [])

  const stopTimer = useCallback(() => {
    setActiveTimer(prev => {
      if (!prev) return null
      const dur = Math.round((Date.now() - prev.startTime) / 1000)
      if (dur >= 1) setSessions(s => [...s, sessionFromTimer(prev)])
      return null
    })
  }, [])

  const setTimerMeta = useCallback((meta: Partial<Pick<ActiveTimer, 'tag'|'config'|'posture'|'zone'>>) => {
    setActiveTimer(prev => prev ? { ...prev, ...meta } : null)
  }, [])

  const addSession    = useCallback((s: Omit<Session, 'id'>) => {
    setSessions(prev => [...prev, { ...s, id: generateId() }])
  }, [])
  const updateSession = useCallback((id: string, patch: Partial<Omit<Session,'id'>>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])
  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  const addBloc    = useCallback((b: Omit<Bloc,'id'>) => {
    setBlocs(prev => [...prev, { ...b, id: generateId() }])
  }, [])
  const updateBloc = useCallback((id: string, patch: Partial<Omit<Bloc,'id'>>) => {
    setBlocs(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }, [])
  const deleteBloc = useCallback((id: string) => {
    setBlocs(prev => prev.filter(b => b.id !== id))
    setActiveTimer(prev => prev?.blocId === id ? null : prev)
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  return {
    blocs, sessions, activeTimer, settings,
    startTimer, stopTimer, setTimerMeta,
    addSession, updateSession, deleteSession,
    addBloc, updateBloc, deleteBloc, updateSettings,
  }
}

export type Store = ReturnType<typeof useStore>
