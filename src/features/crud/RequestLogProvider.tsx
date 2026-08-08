import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { subscribeRequestLog } from '../../api/requestLog'
import type { RequestLogEntry } from '../../api/requestLog'
import { RequestLogContext } from './requestLogContext'
import type { RequestLogContextValue } from './requestLogContext'

/**
 * `client.ts`'in yayınladığı kayıtları toplar. Olay bazlı durum — `useReducer`.
 * Kalıcılık yok; sayfa yenilenince liste sıfırlanır (`localStorage` kullanılmıyor).
 */

/** Panelde tutulan kayıt sayısı. Eskiyen kayıt düşer. */
const CAPACITY = 50

interface RequestLogState {
  entries: readonly RequestLogEntry[]
}

type Action = { type: 'recorded'; entry: RequestLogEntry } | { type: 'cleared' }

const initialState: RequestLogState = { entries: [] }

function reducer(state: RequestLogState, action: Action): RequestLogState {
  switch (action.type) {
    case 'recorded': {
      const entries = [...state.entries, action.entry]
      return { entries: entries.length > CAPACITY ? entries.slice(-CAPACITY) : entries }
    }

    case 'cleared':
      return initialState
  }
}

interface RequestLogProviderProps {
  children: ReactNode
}

export function RequestLogProvider({ children }: RequestLogProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Abonelik sökülürken kapanıyor; `subscribeRequestLog` iptal fonksiyonu döner.
  useEffect(() => {
    return subscribeRequestLog((entry) => dispatch({ type: 'recorded', entry }))
  }, [])

  const clear = useCallback(() => dispatch({ type: 'cleared' }), [])

  const value = useMemo<RequestLogContextValue>(
    () => ({ entries: state.entries, clear }),
    [state.entries, clear],
  )

  return <RequestLogContext.Provider value={value}>{children}</RequestLogContext.Provider>
}
