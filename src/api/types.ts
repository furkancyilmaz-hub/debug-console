/**
 * Backend sözleşmelerinin TS karşılığı (`.claude/contract.md`).
 *
 * TS `enum` kullanılmıyor: `tsconfig.app.json`'da `erasableSyntaxOnly` açık,
 * enum derlenmez. Java tarafındaki her enum burada string literal union.
 */

/* ------------------------------------------------------------------ ortak */

/** Java `Instant` → ISO-8601, ör. `2026-08-03T10:00:00Z`. */
export type Instant = string

/** Java `LocalDate` → ör. `2026-08-03`. */
export type LocalDate = string

/**
 * Spring `Page<T>`'in tel biçimi. `pageSerializationMode` varsayılanı `DIRECT`
 * olduğu için `PagedModel`'in `{ content, page: {...} }` sarmalı değil, eski
 * `PageImpl` düzlüğü geliyor.
 */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  /** Sıfır tabanlı sayfa indeksi. */
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PageParams {
  page?: number
  size?: number
  /** Spring biçimi: `fullName,asc`. */
  sort?: string
}

/* -------------------------------------------------------- demo-crud-api */

export type CustomerStatus = 'ACTIVE' | 'PASSIVE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE'
export type ProposalStatus = 'DRAFT' | 'APPROVED' | 'REJECTED'

/** Java `BigDecimal` Jackson'da JSON sayısı olarak yazılıyor. */
export interface PaymentResponse {
  id: number
  customerId: number
  amount: number
  dueDate: LocalDate
  status: PaymentStatus
}

/**
 * `payments` yalnızca `/detail` ve `/overview` uçlarında dolu gelir; düz liste
 * ve tekil kayıt boş dizi döner.
 */
export interface CustomerResponse {
  id: number
  proposalId: number
  identityNo: string
  fullName: string
  city: string
  status: CustomerStatus
  payments: PaymentResponse[]
}

export interface ProposalResponse {
  id: number
  proposalNo: string
  status: ProposalStatus
  issueDate: LocalDate
  totalPremium: number
}

export interface CustomerSummary {
  id: number
  identityNo: string
  fullName: string
  city: string
  status: CustomerStatus
}

export interface ProposalDetailResponse extends ProposalResponse {
  customers: CustomerSummary[]
}

/**
 * `POST /api/proposals` gövdesi. Alan adları Java DTO'sundakiyle birebir aynı:
 * 400 cevabındaki `violations[].field` çeviri gerektirmeden forma düşsün.
 */
export interface ProposalCreateRequest {
  proposalNo: string
  status: ProposalStatus
  issueDate: LocalDate
  totalPremium: number
}

/* ------------------------------------------------------ api-debug-agent */

export type Confidence = 'HIGH' | 'MEDIUM'
export type AnalysisStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'
export type StageKind = 'LOCAL' | 'MODEL'
export type AnalysisEventType = 'STAGE_STARTED' | 'STAGE_FINISHED' | 'REPORT' | 'ERROR'

/** Tel adları Java enum adları değil; `@JsonValue` ile sabitlenmiş Türkçe adlar. */
export type Stage = 'loglar' | 'ayrıştırma' | 'tespit' | 'zenginleştirme'

export const STAGES: readonly Stage[] = ['loglar', 'ayrıştırma', 'tespit', 'zenginleştirme']

/** Modelin yazdığı düzeltme önerisi. Zenginleştirme çalışmadıysa `null`. */
export interface FixProposal {
  action: string
  rationale: string
  expectedResult: string
  risk: string
  alternatives: string
}

/**
 * Deterministik N+1 bulgusu. `explanation` ve `suggestion` dışındaki her alan
 * Java'da ölçülerek üretilir; model bu ikisi dışına dokunamaz.
 */
export interface Finding {
  findingId: string
  correlationId: string
  endpoint: string
  parentTable: string
  childTable: string
  /** Ör. `payment.customer_id -> customer.id`. */
  foreignKey: string
  normalizedQuery: string
  repeatCount: number
  distinctBindCount: number
  confidence: Confidence
  sampleBinds: string[]
  parentSeq: number
  firstChildSeq: number
  explanation: string | null
  suggestion: FixProposal | null
}

export interface AnalysisCounts {
  logLines: number
  requests: number
  queries: number
  findings: number
}

export interface AnalysisReport {
  analysisId: string
  status: AnalysisStatus
  from: Instant
  to: Instant
  startedAt: Instant
  durationMs: number
  counts: AnalysisCounts
  findings: Finding[]
  /** Yalnızca `status === 'FAILED'` iken dolu. */
  error: string | null
}

/**
 * SSE akışındaki tek olay. `payload` bilinçli olarak `unknown`: aşama özet
 * sayıları, hata mesajı ya da tam rapor taşıyabiliyor. Kullanım yerinde daraltılır.
 */
export interface AnalysisEvent {
  type: AnalysisEventType
  stage: Stage | null
  kind: StageKind | null
  durationMs: number | null
  payload: unknown
}

export interface AnalyzeRequest {
  from: Instant
  to: Instant
}

export interface AnalyzeResponse {
  analysisId: string
}

/* ---------------------------------------------------------------- istek */

/** Doğrulama hatalarında demo-api'nin döndüğü alan kırılımı. */
export interface FieldViolation {
  field: string
  message: string
}

/**
 * Bir çağrının gövdesi ve yanında ölçülen bilgi. Süreyi console kendisi ölçer;
 * `correlationId` yanıt başlığından okunur.
 */
export interface RequestResult<T> {
  data: T
  status: number
  durationMs: number
  correlationId: string | null
}
