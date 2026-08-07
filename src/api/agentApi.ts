import { AGENT_BASE } from './config'
import { request, requestOptional } from './client'
import type {
  AnalysisEvent,
  AnalysisEventType,
  AnalysisReport,
  AnalyzeResponse,
  Instant,
  RequestResult,
} from './types'

/** Analiz ajanının (`api-debug-agent`) uçları. Yollar yalnızca burada yazılı. */

export function startAnalysis(
  from: Instant,
  to: Instant,
  signal: AbortSignal,
): Promise<RequestResult<AnalyzeResponse>> {
  return request<AnalyzeResponse>(AGENT_BASE, '/api/analyze', {
    method: 'POST',
    body: { from, to },
    signal,
  })
}

/**
 * Tamamlanmış rapor. Analiz sürerken uç `202` + boş gövde döndüğü için `data`
 * `null` gelebilir; bu bir hata değil, "henüz bitmedi" demek.
 */
export function getReport(
  analysisId: string,
  signal: AbortSignal,
): Promise<RequestResult<AnalysisReport | null>> {
  return requestOptional<AnalysisReport>(AGENT_BASE, `/api/analyze/${analysisId}`, { signal })
}

const EVENT_TYPES: readonly AnalysisEventType[] = [
  'STAGE_STARTED',
  'STAGE_FINISHED',
  'REPORT',
  'ERROR',
]

function isTerminal(type: AnalysisEventType): boolean {
  return type === 'REPORT' || type === 'ERROR'
}

export interface AnalysisStreamHandlers {
  onEvent: (event: AnalysisEvent) => void
  /** Akış koptuğunda; analiz sunucuda devam ediyor olabilir. */
  onStreamError: (message: string) => void
}

/**
 * Analizin olay akışı.
 *
 * Agent olayları `SseEmitter.event().name(type)` ile yolluyor — yani `onmessage`
 * hiç tetiklenmez, her tip için ayrı dinleyici gerekiyor.
 *
 * Terminal olaydan (`REPORT` / `ERROR`) sonra akışı kendimiz kapatıyoruz;
 * yoksa `EventSource` sunucu kapattığı anda yeniden bağlanmaya çalışır.
 *
 * @returns akışı kapatan fonksiyon; efekt temizliğinde çağrılmalı
 */
export function openAnalysisStream(
  analysisId: string,
  handlers: AnalysisStreamHandlers,
): () => void {
  const source = new EventSource(`${AGENT_BASE}/api/analyze/${analysisId}/stream`)
  let closed = false

  const close = (): void => {
    if (!closed) {
      closed = true
      source.close()
    }
  }

  for (const type of EVENT_TYPES) {
    source.addEventListener(type, (message: MessageEvent<string>) => {
      let event: AnalysisEvent
      try {
        event = JSON.parse(message.data) as AnalysisEvent
      } catch {
        handlers.onStreamError('Akıştan okunamayan bir olay geldi.')
        close()
        return
      }
      handlers.onEvent(event)
      if (isTerminal(event.type)) {
        close()
      }
    })
  }

  source.onerror = () => {
    if (closed) {
      return
    }
    close()
    handlers.onStreamError('Analiz akışı koptu. Rapor yine de hazır olabilir.')
  }

  return close
}
