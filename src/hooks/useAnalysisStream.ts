import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { getReport, openAnalysisStream, startAnalysis } from '../api/agentApi'
import { isAbortError, toApiError } from '../api/client'
import { analysisReducer, initialAnalysisState } from './analysisStream'
import type { AnalysisState } from './analysisStream'

export type {
  AnalysisAction,
  AnalysisFailure,
  AnalysisPhase,
  AnalysisState,
  AnalysisWarning,
  StageRow,
  StageStatus,
} from './analysisStream'
export { analysisReducer, initialAnalysisState } from './analysisStream'

/**
 * Analizin bağlantı yönetimi: `POST` ile başlat, dönen id ile `EventSource` aç,
 * olayları durum makinesine ver. İndirgemenin kendisi `analysisStream.ts`'te.
 *
 * `AnalysisProvider` bunu route'ların üstünde çağırır; sekme değişimi analizi
 * kesmez.
 */

export interface AnalysisStream {
  state: AnalysisState
  /** Yeni analiz başlatır; başarılıysa `analysisId` döner. */
  start: (from: string, to: string) => Promise<string | null>
  /** Adresteki id ile mevcut bir analizi devralır (yenileme, paylaşılan bağlantı). */
  adopt: (analysisId: string) => void
  /** Raporu uçtan yeniden ister. Akış kaçtıysa kurtarma yolu. */
  refreshReport: () => void
  reset: () => void
}

/** Bu kadar süre hiç olay gelmezse akış takılmış sayılır. */
const STALL_MS = 60_000

export function useAnalysisStream(): AnalysisStream {
  const [state, dispatch] = useReducer(analysisReducer, initialAnalysisState)
  const { analysisId, phase, eventCount } = state

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
        dispatch({ type: 'start-failed', error: toApiError(error) })
        return null
      }
    },
    [nextSignal],
  )

  const adopt = useCallback((id: string) => dispatch({ type: 'adopted', analysisId: id }), [])
  const reset = useCallback(() => {
    // Uçan `POST /api/analyze` iptal edilmezse cevabı `started` dispatch edip
    // analizi geri getirir. `start` iptali `isAbortError` ile sessizce yutuyor.
    controllerRef.current?.abort()
    dispatch({ type: 'reset' })
  }, [])

  const fetchReport = useCallback(async (id: string, signal: AbortSignal): Promise<void> => {
    try {
      const result = await getReport(id, signal)
      // 202 + boş gövde: analiz sürüyor, hata değil.
      if (result.data !== null) {
        dispatch({ type: 'report', report: result.data })
      }
    } catch (error) {
      if (!isAbortError(error)) {
        dispatch({ type: 'start-failed', error: toApiError(error) })
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
      onStreamError: () => dispatch({ type: 'warn', warning: 'stream-lost' }),
    })

    return () => {
      controller.abort()
      close()
    }
  }, [analysisId, fetchReport])

  // Takılma gözcüsü: her olayda sıfırlanır, analiz bitince kurulmaz.
  useEffect(() => {
    if (phase !== 'running') {
      return
    }
    const timer = window.setTimeout(
      () => dispatch({ type: 'warn', warning: 'stalled' }),
      STALL_MS,
    )
    return () => window.clearTimeout(timer)
  }, [phase, eventCount])

  return useMemo<AnalysisStream>(
    () => ({ state, start, adopt, refreshReport, reset }),
    [state, start, adopt, refreshReport, reset],
  )
}
