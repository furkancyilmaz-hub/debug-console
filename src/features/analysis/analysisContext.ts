import { createContext, useContext } from 'react'
import type { ApiError } from '../../api/client'
import type { AnalysisEvent, AnalysisReport } from '../../api/types'

/**
 * Analiz durumu route'ların **üstünde** yaşar: sekme değişince `AnalysisHome`
 * sökülür ama analiz kaybolmaz.
 */

export type AnalysisPhase = 'idle' | 'starting' | 'running' | 'completed' | 'failed'

/**
 * Akıştaki olayların sunucudan gelen bir kimliği yok; render'da index'e
 * düşmemek için girdiğinde kimlik veriliyor.
 */
export interface TimelineEntry {
  id: string
  event: AnalysisEvent
}

export interface AnalysisState {
  phase: AnalysisPhase
  analysisId: string | null
  events: TimelineEntry[]
  /** Bir sonraki olaya verilecek kimlik. */
  nextEventId: number
  report: AnalysisReport | null
  /** Akış koptuğunda dolar; analiz sunucuda sürüyor olabilir. */
  streamError: string | null
  error: ApiError | null
}

export interface AnalysisContextValue {
  state: AnalysisState
  /** Yeni analiz başlatır; başarılıysa `analysisId` döner. */
  start: (from: string, to: string) => Promise<string | null>
  /** Adresteki id ile mevcut bir analizi devralır (yenileme, paylaşılan bağlantı). */
  adopt: (analysisId: string) => void
  /** Raporu uçtan yeniden ister. Akış kaçtıysa kurtarma yolu. */
  refreshReport: () => void
  reset: () => void
}

export const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function useAnalysis(): AnalysisContextValue {
  const value = useContext(AnalysisContext)
  if (value === null) {
    throw new Error('useAnalysis, AnalysisProvider içinde çağrılmalı.')
  }
  return value
}
