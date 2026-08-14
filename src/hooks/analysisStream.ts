import { parseReport } from '../api/agentSchema'
import { NETWORK_ERROR_STATUS } from '../api/client'
import type { ApiError } from '../api/client'
import { STAGES } from '../api/types'
import type { AnalysisEvent, AnalysisReport, Stage, StageKind } from '../api/types'

/**
 * Analiz akışının durum makinesi — saf. React'e hiç dokunmuyor; efektler ve
 * bağlantı yönetimi `useAnalysisStream`'in işi.
 *
 * Olaylar burada aşama listesine indirgeniyor: `payload` ham `unknown` olarak
 * saklanıyor, okunabilir metne çevirmek gösterim katmanının işi. Böylece bu
 * dosya hiçbir özellik klasörüne bağlı değil (`hooks → api`, tek yön).
 */

export type AnalysisPhase = 'idle' | 'starting' | 'running' | 'completed' | 'failed'

export type StageStatus = 'pending' | 'running' | 'done' | 'failed'

export interface StageRow {
  /** Sözleşmedeki dört ad; tanınmayan bir aşama gelirse geldiği gibi durur. */
  stage: string
  status: StageStatus
  kind: StageKind | null
  durationMs: number | null
  /** `STAGE_FINISHED`'in özet sayıları. Daraltmak gösterim katmanının işi. */
  payload: unknown
}

/** Analizi bitiren hatalar. Her biri ayrı metin alır; "bir hata oluştu" yok. */
export type AnalysisFailure =
  /** Ağa hiç çıkılamadı — agent muhtemelen kapalı. */
  | { kind: 'agent-down' }
  /** `POST /api/analyze` reddetti; mesaj agent'ın kendi cevabından. */
  | { kind: 'start-failed'; error: ApiError }
  /** Akıştan `ERROR` olayı geldi ya da rapor `FAILED` döndü. */
  | { kind: 'agent-error'; message: string }
  /** Cevap geldi ama sözleşmeye uymuyor; çizilecek rapor yok. */
  | { kind: 'bad-report' }

/**
 * Analizi bitirmeyen aksaklıklar: analiz sunucuda sürüyor olabilir, kurtarma
 * yolu raporu elle istemek.
 */
export type AnalysisWarning = 'stream-lost' | 'stalled'

export interface AnalysisState {
  phase: AnalysisPhase
  analysisId: string | null
  stages: readonly StageRow[]
  report: AnalysisReport | null
  failure: AnalysisFailure | null
  warning: AnalysisWarning | null
  /** Watchdog'u sıfırlamak için; akıştan kaç olay geçtiği. */
  eventCount: number
}

/**
 * Aşamaların bilinen türü. Olay kendi `kind`'ını getirdiğinde üzerine yazılır;
 * bu tablo yalnızca ilk saniyede `MODEL` rozetinin görünmesi için.
 */
const SEED_KIND: Record<Stage, StageKind> = {
  loglar: 'LOCAL',
  ayrıştırma: 'LOCAL',
  tespit: 'LOCAL',
  zenginleştirme: 'MODEL',
}

function pendingStage(stage: string, kind: StageKind | null): StageRow {
  return { stage, status: 'pending', kind, durationMs: null, payload: null }
}

/** Dört aşama en baştan dizilir; kullanıcı işin ne kadarının kaldığını görür. */
function initialStages(): readonly StageRow[] {
  return STAGES.map((stage) => pendingStage(stage, SEED_KIND[stage]))
}

export const initialAnalysisState: AnalysisState = {
  phase: 'idle',
  analysisId: null,
  stages: [],
  report: null,
  failure: null,
  warning: null,
  eventCount: 0,
}

function startedState(analysisId: string): AnalysisState {
  return { ...initialAnalysisState, phase: 'running', analysisId, stages: initialStages() }
}

export type AnalysisAction =
  | { type: 'start-requested' }
  | { type: 'started'; analysisId: string }
  | { type: 'adopted'; analysisId: string }
  | { type: 'start-failed'; error: ApiError }
  | { type: 'event'; event: AnalysisEvent }
  | { type: 'warn'; warning: AnalysisWarning }
  | { type: 'report'; report: AnalysisReport }
  | { type: 'reset' }

function readErrorMessage(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message: unknown }).message
    if (typeof message === 'string' && message !== '') {
      return message
    }
  }
  return 'Agent analizi tamamlayamadı.'
}

/**
 * Tek aşamayı günceller. Eşleşmeyen satırlar **aynı referansla** dönüyor —
 * her olayda tüm listeyi yeniden kurmuyoruz, `memo`'lu satırlar boşuna render
 * olmasın.
 */
function patchStage(
  stages: readonly StageRow[],
  stage: string,
  patch: (row: StageRow) => StageRow,
): readonly StageRow[] {
  let found = false
  const next = stages.map((row) => {
    if (row.stage !== stage) {
      return row
    }
    found = true
    return patch(row)
  })
  // Sözleşmede olmayan bir aşama gelirse listeyi büyütüyoruz, atmıyoruz.
  return found ? next : [...next, patch(pendingStage(stage, null))]
}

/** Analiz bittiğinde askıda kalan satır kalmasın. */
function settleStages(stages: readonly StageRow[], status: StageStatus): readonly StageRow[] {
  return stages.map((row) =>
    row.status === 'pending' || row.status === 'running' ? { ...row, status } : row,
  )
}

function applyEvent(state: AnalysisState, event: AnalysisEvent): AnalysisState {
  // Olay geldiyse akış yaşıyor: takıldı/koptu uyarısı düşer.
  const base = { ...state, warning: null, eventCount: state.eventCount + 1 }

  switch (event.type) {
    case 'STAGE_STARTED':
      if (event.stage === null) {
        return base
      }
      return {
        ...base,
        stages: patchStage(base.stages, event.stage, (row) => ({
          ...row,
          status: 'running',
          kind: event.kind ?? row.kind,
        })),
      }

    case 'STAGE_FINISHED':
      if (event.stage === null) {
        return base
      }
      return {
        ...base,
        stages: patchStage(base.stages, event.stage, (row) => ({
          ...row,
          status: 'done',
          kind: event.kind ?? row.kind,
          durationMs: event.durationMs,
          payload: event.payload,
        })),
      }

    case 'REPORT': {
      // Payload doğrulanıyor: eksik bir rapor state'e girerse hata `fetch`'te
      // değil rapor çizilirken patlar, orası da tüm ağacı söken yer.
      const report = parseReport(event.payload)
      if (report === null) {
        // `GET /api/analyze/{id}` daha önce geçerli bir rapor getirmiş olabilir;
        // akıştaki bozuk kopya onu düşürmemeli.
        if (base.report !== null) {
          return { ...base, phase: 'completed', stages: settleStages(base.stages, 'done') }
        }
        return {
          ...base,
          phase: 'failed',
          stages: settleStages(base.stages, 'failed'),
          failure: { kind: 'bad-report' },
        }
      }
      return {
        ...base,
        phase: 'completed',
        stages: settleStages(base.stages, 'done'),
        report,
      }
    }

    case 'ERROR':
      return {
        ...base,
        phase: 'failed',
        stages: settleStages(base.stages, 'failed'),
        failure: { kind: 'agent-error', message: readErrorMessage(event.payload) },
      }
  }
}

/**
 * Agent'a hiç ulaşılamadı mı?
 *
 * `status: 0` ağ katmanının hiç açılamadığı hâli. Ama uygulama dev proxy'sinin
 * arkasında çalışıyor: agent kapalıyken tarayıcı ağ hatası değil, proxy'nin
 * ürettiği **502** görüyor (ölçüldü). 5xx ağ geçidi kodlarını da aynı sepete
 * koymazsak "agent kapalı" — en sık karşılaşılacak durum — kullanıcıya kuru bir
 * "İstek başarısız (HTTP 502)" olarak çıkardı.
 */
function isUnreachable(error: ApiError): boolean {
  return (
    error.status === NETWORK_ERROR_STATUS ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504
  )
}

/**
 * Durum makinesi. Hook'un dışına açık, çünkü olay→aşama indirgemesi bu dosyanın
 * asıl işi ve React'e ihtiyaç duymadan doğrulanabiliyor.
 */
export function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'start-requested':
      return { ...initialAnalysisState, phase: 'starting', stages: initialStages() }

    case 'started':
      return startedState(action.analysisId)

    case 'adopted':
      // Aynı id ikinci kez devralınırsa akıştaki ilerleme silinmemeli.
      return state.analysisId === action.analysisId ? state : startedState(action.analysisId)

    case 'start-failed':
      return {
        ...state,
        phase: 'failed',
        failure: isUnreachable(action.error)
          ? { kind: 'agent-down' }
          : { kind: 'start-failed', error: action.error },
      }

    case 'event':
      return applyEvent(state, action.event)

    case 'warn':
      // Faz değişmiyor: analiz sunucuda sürüyor olabilir, sadece görüşümüz koptu.
      return state.warning === action.warning ? state : { ...state, warning: action.warning }

    case 'report': {
      const failed = action.report.status === 'FAILED'
      return {
        ...state,
        phase: failed ? 'failed' : 'completed',
        stages: settleStages(state.stages, failed ? 'failed' : 'done'),
        report: action.report,
        warning: null,
        failure: failed
          ? { kind: 'agent-error', message: action.report.error ?? 'Agent analizi tamamlayamadı.' }
          : null,
      }
    }

    case 'reset':
      return initialAnalysisState
  }
}
