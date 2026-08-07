import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { getReport, openAnalysisStream, startAnalysis } from '../../api/agentApi'
import { isAbortError, toApiError } from '../../api/client'
import type { ApiError } from '../../api/client'
import type { AnalysisEvent, AnalysisReport } from '../../api/types'
import { AnalysisContext } from './analysisContext'
import type { AnalysisContextValue, AnalysisState } from './analysisContext'

/**
 * Analizin tüm durumu ve SSE bağlantısı burada. Route'ların üstünde durduğu için
 * sekme değişimi analizi kesmez; akış arka planda akmaya devam eder.
 *
 * Olay bazlı state — üç ayrı `useState` yerine tek `useReducer`.
 */

type Action =
  | { type: 'start-requested' }
  | { type: 'started'; analysisId: string }
  | { type: 'failed'; error: ApiError }
  | { type: 'adopted'; analysisId: string }
  | { type: 'event'; event: AnalysisEvent }
  | { type: 'stream-error'; message: string }
  | { type: 'report'; report: AnalysisReport }
  | { type: 'reset' }

const initialState: AnalysisState = {
  phase: 'idle',
  analysisId: null,
  events: [],
  nextEventId: 0,
  report: null,
  streamError: null,
  error: null,
}

function isReport(value: unknown): value is AnalysisReport {
  return typeof value === 'object' && value !== null && 'analysisId' in value && 'findings' in value
}

function readErrorMessage(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }
  return 'Analiz sırasında bir hata oluştu.'
}

function reducer(state: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case 'start-requested':
      return { ...initialState, phase: 'starting' }

    case 'started':
    case 'adopted':
      if (action.type === 'adopted' && state.analysisId === action.analysisId) {
        return state
      }
      return { ...initialState, phase: 'running', analysisId: action.analysisId }

    case 'failed':
      return { ...state, phase: 'failed', error: action.error }

    case 'event': {
      const events = [...state.events, { id: `event-${state.nextEventId}`, event: action.event }]
      const nextEventId = state.nextEventId + 1
      if (action.event.type === 'REPORT' && isReport(action.event.payload)) {
        return { ...state, phase: 'completed', events, nextEventId, report: action.event.payload }
      }
      if (action.event.type === 'ERROR') {
        return {
          ...state,
          phase: 'failed',
          events,
          nextEventId,
          streamError: readErrorMessage(action.event.payload),
        }
      }
      return { ...state, events, nextEventId }
    }

    case 'stream-error':
      // Akışın kopması analizi bitirmez; faz değişmiyor, uyarı gösteriliyor.
      return { ...state, streamError: action.message }

    case 'report':
      return {
        ...state,
        phase: action.report.status === 'FAILED' ? 'failed' : 'completed',
        report: action.report,
      }

    case 'reset':
      return initialState
  }
}

interface AnalysisProviderProps {
  children: ReactNode
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { analysisId } = state

  // Uçan istekler sökülürken iptal edilsin diye tek controller taşınıyor.
  const controllerRef = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  const nextSignal = useCallback((): AbortSignal => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    return controller.signal
  }, [])

  const start = useCallback(
    async (from: string, to: string): Promise<string | null> => {
      dispatch({ type: 'start-requested' })
      try {
        const result = await startAnalysis(from, to, nextSignal())
        dispatch({ type: 'started', analysisId: result.data.analysisId })
        return result.data.analysisId
      } catch (error) {
        if (isAbortError(error)) {
          return null
        }
        dispatch({ type: 'failed', error: toApiError(error) })
        return null
      }
    },
    [nextSignal],
  )

  const adopt = useCallback((id: string) => dispatch({ type: 'adopted', analysisId: id }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const fetchReport = useCallback(async (id: string, signal: AbortSignal): Promise<void> => {
    try {
      const result = await getReport(id, signal)
      // 202 + boş gövde: analiz sürüyor, hata değil.
      if (result.data !== null) {
        dispatch({ type: 'report', report: result.data })
      }
    } catch (error) {
      if (!isAbortError(error)) {
        dispatch({ type: 'failed', error: toApiError(error) })
      }
    }
  }, [])

  const refreshReport = useCallback(() => {
    if (analysisId !== null) {
      void fetchReport(analysisId, nextSignal())
    }
  }, [analysisId, fetchReport, nextSignal])

  // Bir analiz id'si belirdiğinde: akışa bağlan ve raporu bir kez sor.
  // İkisi birlikte, çünkü adresten gelinen (yenileme) durumda analiz çoktan
  // bitmiş olabilir; tek başına akış geç kalmış bir istemciyi kurtarmaz.
  useEffect(() => {
    if (analysisId === null) {
      return
    }
    const controller = new AbortController()
    void fetchReport(analysisId, controller.signal)

    const close = openAnalysisStream(analysisId, {
      onEvent: (event) => dispatch({ type: 'event', event }),
      onStreamError: (message) => dispatch({ type: 'stream-error', message }),
    })

    return () => {
      controller.abort()
      close()
    }
  }, [analysisId, fetchReport])

  const value = useMemo<AnalysisContextValue>(
    () => ({ state, start, adopt, refreshReport, reset }),
    [state, start, adopt, refreshReport, reset],
  )

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}
