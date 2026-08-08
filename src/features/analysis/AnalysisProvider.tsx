import type { ReactNode } from 'react'
import { useAnalysisStream } from '../../hooks/useAnalysisStream'
import { AnalysisContext } from './analysisContext'

/**
 * Akışı `<Routes>`'un üstünde çalıştırır ve context'e koyar. Mantığın tamamı
 * `useAnalysisStream`'de; burada yalnızca yerleşim var.
 */

interface AnalysisProviderProps {
  children: ReactNode
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const value = useAnalysisStream()

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}
