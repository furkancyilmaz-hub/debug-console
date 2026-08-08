import { createContext, useContext } from 'react'
import type { RequestLogEntry } from '../../api/requestLog'

/**
 * Denetçinin gösterdiği kayıtlar. Context yalnızca **veriyi** taşıyor; filtre,
 * açık satır ve panel yüksekliği panelin kendi durumu, buraya sızmıyor.
 */

export interface RequestLogContextValue {
  /** Kronolojik: en yeni sonda. */
  entries: readonly RequestLogEntry[]
  clear: () => void
}

export const RequestLogContext = createContext<RequestLogContextValue | null>(null)

export function useRequestLog(): RequestLogContextValue {
  const value = useContext(RequestLogContext)
  if (value === null) {
    throw new Error('useRequestLog, RequestLogProvider içinde çağrılmalı.')
  }
  return value
}
