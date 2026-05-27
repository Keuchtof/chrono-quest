import { useState, useEffect, useCallback } from 'react'
import type { Bloc, Session, ActiveTimer, Settings } from './types'
import { DEFAULT_BLOCS, DEFAULT_SETTINGS } from './constants'
import { generateId, getDateStr } from './utils'

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, v: T) {
  localStorage.setItem(key, JSON.stringify(v))
}

export function useStore() {
  const [blocs,       setBlocs]       = useState<Bloc[]>         (() => load('cq_blocs',    DEFAULT_BLOCS))
  const [sessions,    setSessions]    = useState<Session[]>      (() => load('cq_sessions', []))
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => load('cq_timer', null))
  const [settings,    setSettings]    = useState<Settings>       (() => load('cq_settings', DEFAULT_SETTINGS))

  useEffect(() => { save('cq_blocs',    blocs)       }, [blocs])
  useEffect(() => { save('cq_sessions', sessions)    }, [sessions])
  useEffect(() => { save('cq_timer',    activeTimer) }, [activeTimer])
  useEffect(() => { save('cq_settings', settings)    }, [settings])

  const startTimer = useCallback((blocId: string) => {
    setActiveTimer({ blocId, startTime: Date.now(), tag: '' })
  }, [])

  const stopTimer = useCallback(() => {
    setActiveTimer(prev => {
      if (!prev) return null
      const endTime = Date.now()
      const duration = Math.round((endTime - prev.startTime) / 1000)
      if (duration >= 1) {
        setSessions(s => [...s, {
          id: generateId(),
          blocId: prev.blocId,
          date: getDateStr(new Date(prev.startTime)),
          startTime: prev.startTime,
          endTime,
          duration,
          tag: prev.tag,
        }])
      }
      return null
    })
  }, [])

  const setTimerTag = useCallback((tag: string) => {
    setActiveTimer(prev => prev ? { ...prev, tag } : null)
  }, [])

  const addSession = useCallback((s: Omit<Session, 'id'>) => {
    setSessions(prev => [...prev, { ...s, id: generateId() }])
  }, [])

  const updateSession = useCallback((id: string, patch: Partial<Omit<Session, 'id'>>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  const addBloc = useCallback((b: Omit<Bloc, 'id'>) => {
    setBlocs(prev => [...prev, { ...b, id: generateId() }])
  }, [])

  const updateBloc = useCallback((id: string, patch: Partial<Omit<Bloc, 'id'>>) => {
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
    startTimer, stopTimer, setTimerTag,
    addSession, updateSession, deleteSession,
    addBloc, updateBloc, deleteBloc,
    updateSettings,
  }
}

export type Store = ReturnType<typeof useStore>
