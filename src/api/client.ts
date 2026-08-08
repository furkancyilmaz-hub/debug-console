import { publishRequestLog } from './requestLog'
import type { FieldViolation, RequestResult } from './types'

/**
 * Tek fetch sarmalayıcı. Her backend çağrısı buradan geçer; bileşenlerde çıplak
 * `fetch` yok. Denetçi panelinin kaydı da bu yüzden burada yayınlanıyor.
 *
 * İki backend iki ayrı hata biçimi konuşuyor:
 *  - `demo-crud-api` → `{ timestamp, status, error, message }`, doğrulamada
 *    `{ ..., violations: [{ field, message }] }`
 *  - `api-debug-agent` → RFC 7807 `ProblemDetail` → `{ type, title, status, detail }`
 *
 * İkisi de tek `ApiError`'a indirgenir; ekranlar farkı bilmez.
 */

const CORRELATION_HEADER = 'X-Correlation-Id'

export class ApiError extends Error {
  readonly status: number
  readonly violations: FieldViolation[]

  constructor(status: number, message: string, violations: FieldViolation[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.violations = violations
  }
}

/** Ağa hiç çıkamadığımız durum; HTTP durumu yok. */
export const NETWORK_ERROR_STATUS = 0

/**
 * İptal edilen istek hata değildir. `useResource` bunu görüp state'e yazmadan
 * sessizce çıkar.
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Beklenmeyen bir throw'u da `ApiError`'a çevirir; hook'lar tek tip hata görür.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  const message = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.'
  return new ApiError(NETWORK_ERROR_STATUS, message)
}

export type QueryValue = string | number | boolean | undefined | null

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** JSON'a çevrilip gövdeye yazılır. */
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

/** Tanımsız ve boş değerler sorgu dizesine hiç girmez. */
function buildUrl(base: string, path: string, query?: Record<string, QueryValue>): string {
  const url = `${base}${path}`
  if (!query) {
    return url
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readViolations(body: unknown): FieldViolation[] {
  if (!isRecord(body) || !Array.isArray(body.violations)) {
    return []
  }
  return body.violations.filter((item): item is FieldViolation =>
    isRecord(item) && typeof item.field === 'string' && typeof item.message === 'string',
  )
}

/** İki backend'in de hata gövdesinden okunabilir tek cümle çıkarır. */
function readMessage(body: unknown, status: number): string {
  if (isRecord(body)) {
    // demo-api `message`, agent ProblemDetail `detail`, ikisi de yoksa `error`/`title`.
    for (const key of ['message', 'detail', 'error', 'title'] as const) {
      const value = body[key]
      if (typeof value === 'string' && value.length > 0) {
        return value
      }
    }
  }
  return `İstek başarısız (HTTP ${status}).`
}

interface RawResponse {
  status: number
  durationMs: number
  correlationId: string | null
  /** Gövde boşsa `null` — 202 ve 204 bu yoldan geçer. */
  body: unknown
}

async function send(base: string, path: string, options: RequestOptions): Promise<RawResponse> {
  const { method = 'GET', body, query, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const url = buildUrl(base, path, query)
  const at = Date.now()
  const startedAt = performance.now()
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // İptal edilen istek kayda girmez: React StrictMode her isteği iki kez
    // tetikleyip birini iptal ediyor, panel her satırı çift gösterirdi.
    if (isAbortError(error)) {
      throw error
    }
    publishRequestLog({
      base,
      url,
      method,
      at,
      status: NETWORK_ERROR_STATUS,
      latencyMs: Math.round(performance.now() - startedAt),
      correlationId: null,
    })
    throw new ApiError(NETWORK_ERROR_STATUS, 'Sunucuya ulaşılamadı. Backend ayakta mı?')
  }
  const durationMs = Math.round(performance.now() - startedAt)
  const correlationId = response.headers.get(CORRELATION_HEADER)

  // Kayıt gövde okunmadan ve 4xx/5xx throw'undan önce yayınlanıyor; başarısız
  // çağrılar da panelde görünsün.
  publishRequestLog({
    base,
    url,
    method,
    at,
    status: response.status,
    latencyMs: durationMs,
    correlationId,
  })

  // Boş gövde beklenen bir durum: 204 ve "analiz sürüyor" anlamına gelen 202.
  // Boş metni JSON.parse'a vermek patlar.
  const text = await response.text()
  let parsed: unknown = null
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      if (response.ok) {
        throw new ApiError(response.status, 'Sunucudan geçersiz JSON geldi.')
      }
      parsed = null
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, readMessage(parsed, response.status), readViolations(parsed))
  }

  return {
    status: response.status,
    durationMs,
    correlationId,
    body: parsed,
  }
}

/**
 * Gövdesi olabilen ya da olmayabilen çağrı. `GET /api/analyze/{id}` analiz
 * sürerken `202` + boş gövde döndüğü için gerekli.
 */
export async function requestOptional<T>(
  base: string,
  path: string,
  options: RequestOptions = {},
): Promise<RequestResult<T | null>> {
  const raw = await send(base, path, options)
  return {
    data: raw.body === null ? null : (raw.body as T),
    status: raw.status,
    durationMs: raw.durationMs,
    correlationId: raw.correlationId,
  }
}

/** Gövdesi zorunlu çağrı. */
export async function request<T>(
  base: string,
  path: string,
  options: RequestOptions = {},
): Promise<RequestResult<T>> {
  const result = await requestOptional<T>(base, path, options)
  if (result.data === null) {
    throw new ApiError(result.status, 'Sunucu boş cevap döndü.')
  }
  return { ...result, data: result.data }
}

/** Gövde beklenmeyen çağrı (`DELETE` → 204). */
export async function requestEmpty(
  base: string,
  path: string,
  options: RequestOptions = {},
): Promise<RequestResult<null>> {
  const raw = await send(base, path, options)
  return {
    data: null,
    status: raw.status,
    durationMs: raw.durationMs,
    correlationId: raw.correlationId,
  }
}
