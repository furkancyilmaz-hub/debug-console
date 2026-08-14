import type {
  AnalysisCounts,
  AnalysisReport,
  AnalysisStatus,
  AnalyzeResponse,
  Confidence,
  Finding,
  FixProposal,
} from './types'

/**
 * Agent cevaplarının çalışma zamanı doğrulaması.
 *
 * `types.ts` yalnızca derleme zamanı sözleşmesi; tel üzerinden gelen gövde
 * `unknown` ve onu tipe zorlamak (`body as T`) bir varsayım. Varsayım tutmazsa
 * hata `fetch`'te değil, iki kat aşağıda `report.counts.requests` okunurken
 * patlıyordu — render sırasında, yani tüm ağacı söken yerde.
 *
 * Burada doğrulanan gövde artık ekrana ulaşmadan `ApiError`'a çevriliyor;
 * kullanıcı beyaz sayfa değil, tanıdık hata kutusunu görüyor.
 *
 * Yalnızca **ekranın okuduğu** alanlar zorunlu tutuluyor: sözleşmeye alan
 * eklenmesi konsolu bozmasın.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** `NaN` ve `Infinity` sayı sayılmıyor: ikisi de ekranda `toLocaleString` ile basılıyor. */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isStatus(value: unknown): value is AnalysisStatus {
  return value === 'RUNNING' || value === 'COMPLETED' || value === 'FAILED'
}

function isConfidence(value: unknown): value is Confidence {
  return value === 'HIGH' || value === 'MEDIUM'
}

function isCounts(value: unknown): value is AnalysisCounts {
  return (
    isRecord(value) &&
    isNumber(value.logLines) &&
    isNumber(value.requests) &&
    isNumber(value.queries) &&
    isNumber(value.findings)
  )
}

/** Model kapalıyken `suggestion` `null` gelir; dolu geldiğinde beş alanı da yazılı olmalı. */
function isFixProposal(value: unknown): value is FixProposal {
  return (
    isRecord(value) &&
    isString(value.action) &&
    isString(value.rationale) &&
    isString(value.expectedResult) &&
    isString(value.risk) &&
    isString(value.alternatives)
  )
}

function isFinding(value: unknown): value is Finding {
  return (
    isRecord(value) &&
    isString(value.findingId) &&
    isString(value.correlationId) &&
    isString(value.endpoint) &&
    isString(value.parentTable) &&
    isString(value.childTable) &&
    isString(value.foreignKey) &&
    isString(value.normalizedQuery) &&
    isNumber(value.repeatCount) &&
    isNumber(value.distinctBindCount) &&
    isConfidence(value.confidence) &&
    isStringArray(value.sampleBinds) &&
    isNumber(value.parentSeq) &&
    isNumber(value.firstChildSeq) &&
    isNullableString(value.explanation) &&
    (value.suggestion === null || isFixProposal(value.suggestion))
  )
}

/**
 * Tam rapor mu? Değilse `null` — çağıran ya `ApiError` fırlatır ya da akışta
 * hatalı olayı görünür bir arızaya çevirir.
 *
 * Tek bir bulgu bozuksa rapor tümden reddediliyor: yarısı çizilmiş bir rapor,
 * "bu aralıkta şu kadar N+1 var" iddiasını sessizce yanlışlar.
 */
export function parseReport(value: unknown): AnalysisReport | null {
  if (
    isRecord(value) &&
    isString(value.analysisId) &&
    isStatus(value.status) &&
    isString(value.from) &&
    isString(value.to) &&
    isString(value.startedAt) &&
    isNumber(value.durationMs) &&
    isCounts(value.counts) &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding) &&
    isNullableString(value.error)
  ) {
    return value as unknown as AnalysisReport
  }
  return null
}

/** `POST /api/analyze` cevabı: id yoksa akış hiç açılamaz. */
export function parseAnalyzeResponse(value: unknown): AnalyzeResponse | null {
  if (isRecord(value) && isString(value.analysisId) && value.analysisId !== '') {
    return { analysisId: value.analysisId }
  }
  return null
}
