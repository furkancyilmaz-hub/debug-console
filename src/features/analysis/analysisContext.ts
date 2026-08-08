import { createContext, useContext } from 'react'
import type { AnalysisStream } from '../../hooks/useAnalysisStream'

/**
 * Analiz durumu route'ların **üstünde** yaşar: sekme değişince `AnalysisHome`
 * sökülür ama analiz kaybolmaz.
 *
 * Durumun kendisi ve tipleri `useAnalysisStream`'in; burada yalnızca onu
 * ekranlara taşıyan context var.
 */

export type AnalysisContextValue = AnalysisStream

export const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function useAnalysis(): AnalysisContextValue {
  const value = useContext(AnalysisContext)
  if (value === null) {
    throw new Error('useAnalysis, AnalysisProvider içinde çağrılmalı.')
  }
  return value
}
