import { AGENT_BASE } from './config'
import { ApiError, request, requestOptional } from './client'
import { parseAnalyzeResponse, parseReport } from './agentSchema'
import type {
  AnalysisEvent,
  AnalysisEventType,
  AnalysisReport,
  AnalyzeRequest,
  AnalyzeResponse,
  Instant,
  RequestResult,
} from './types'

/**
 * Analiz ajanının (`api-debug-agent`) uçları. Yollar yalnızca burada yazılı.
 *
 * Gövdeler `unknown` olarak isteniyor ve `agentSchema` ile doğrulanıyor: biçimi
 * tutmayan bir cevap ekrana çıkmadan `ApiError`'a çevriliyor, çağıran ekran
 * bunu diğer hatalardan ayırt etmek zorunda kalmıyor.
 */

export async function startAnalysis(
  from: Instant,
  to: Instant,
  signal: AbortSignal,
): Promise<RequestResult<AnalyzeResponse>> {
  const body: AnalyzeRequest = { from, to }
  const result = await request<unknown>(AGENT_BASE, '/api/analyze', {
    method: 'POST',
    body,
    signal,
  })

  const started = parseAnalyzeResponse(result.data)
  if (started === null) {
    throw new ApiError(result.status, 'Agent analiz kimliği döndürmedi; cevabı okunamadı.')
  }
  return { ...result, data: started }
}

/**
 * Tamamlanmış rapor. Analiz sürerken uç `202` + boş gövde döndüğü için `data`
 * `null` gelebilir; bu bir hata değil, "henüz bitmedi" demek.
 *
 * Gövde dolu ama eksik geldiğinde `null` dönmüyoruz — o "bitmedi" ile
 * karışırdı; hata olarak fırlatılıyor.
 */
export async function getReport(
  analysisId: string,
  signal: AbortSignal,
): Promise<RequestResult<AnalysisReport | null>> {
  const result = await requestOptional<unknown>(AGENT_BASE, `/api/analyze/${analysisId}`, {
    signal,
  })
  if (result.data === null) {
    return { ...result, data: null }
  }

  const report = parseReport(result.data)
  if (report === null) {
    throw new ApiError(result.status, 'Agent raporu beklenmeyen biçimde döndü; okunamadı.')
  }
  return { ...result, data: report }
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
