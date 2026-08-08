import type { RequestLogEntry, RequestSource } from '../../api/requestLog'
import type { BadgeTone } from '../../components/Badge'

/** Denetçinin saf hesapları. Bileşen bunları yalnızca çağırır. */

/** Bu eşiğin üstü "yavaş": satır vurgulanır, filtre bunu süzer. */
export const SLOW_MS = 300

const MINUTE_MS = 60_000

export const SOURCE_LABEL: Record<RequestSource, string> = {
  demo: 'hedef',
  agent: 'ajan',
}

export function isSlow(entry: RequestLogEntry): boolean {
  return entry.latencyMs > SLOW_MS
}

export function isFailed(entry: RequestLogEntry): boolean {
  // `0` ağa çıkılamadığı anlamına geliyor; o da hata sayılır.
  return entry.status === 0 || entry.status >= 400
}

export interface RequestFilter {
  slowOnly: boolean
  errorsOnly: boolean
}

/** İki filtre bağımsız; ikisi birden açıkken kesişim gösterilir. */
export function filterEntries(
  entries: readonly RequestLogEntry[],
  filter: RequestFilter,
): readonly RequestLogEntry[] {
  if (!filter.slowOnly && !filter.errorsOnly) {
    return entries
  }
  return entries.filter(
    (entry) => (!filter.slowOnly || isSlow(entry)) && (!filter.errorsOnly || isFailed(entry)),
  )
}

/**
 * Çubukların referansı. Filtrelenmiş liste değil **tüm** kayıtlar üzerinden
 * hesaplanıyor; filtre açılınca çubuklar yeniden ölçeklenip yanıltmasın.
 */
export function slowestMs(entries: readonly RequestLogEntry[]): number {
  let slowest = 1
  for (const entry of entries) {
    if (entry.latencyMs > slowest) {
      slowest = entry.latencyMs
    }
  }
  return slowest
}

/** En hızlı çağrı bile görünsün diye %2 taban var. */
export function barPercent(latencyMs: number, slowest: number): number {
  return Math.max(2, Math.round((latencyMs / slowest) * 100))
}

export interface LogSummary {
  count: number
  totalMs: number
}

export function summarize(entries: readonly RequestLogEntry[]): LogSummary {
  let totalMs = 0
  for (const entry of entries) {
    totalMs += entry.latencyMs
  }
  return { count: entries.length, totalMs }
}

export function statusTone(status: number): BadgeTone {
  if (status === 0 || status >= 500) {
    return 'danger'
  }
  if (status >= 400) {
    return 'warn'
  }
  if (status >= 300) {
    return 'info'
  }
  return 'ok'
}

export function statusLabel(status: number): string {
  return status === 0 ? 'ağ' : String(status)
}

export function clockLabel(at: number): string {
  return new Date(at).toLocaleTimeString('tr-TR', { hour12: false })
}

export function secondsLabel(totalMs: number): string {
  return `${(totalMs / 1000).toFixed(1)} sn`
}

export interface AnalysisRange {
  /** ISO-8601 UTC — sözleşme §4 biçimi. */
  from: string
  to: string
}

/**
 * Kayıtlardan analiz aralığı.
 *
 * Yalnızca hedef servis çağrıları sayılıyor: ajana giden istekler kendi
 * analizlerinin aralığını uzatmasın. `to` son isteğin süresi kadar ileri
 * alınıyor, çünkü kayıttaki `at` isteğin başlangıcı.
 *
 * Uçlar tam dakikaya genişletiliyor: analiz ekranının `datetime-local`
 * girdileri dakika hassasiyetinde, yuvarlamasak baştaki ve sondaki istek
 * aralığın dışında kalırdı. Üstüne iki uçtan birer dakika pay bırakılıyor:
 * tarayıcının saati ile backend'in saati birkaç saniye kayabiliyor, sınırdaki
 * istek pay olmadan aralığın dışına düşerdi.
 */
export function analysisRange(entries: readonly RequestLogEntry[]): AnalysisRange | null {
  let earliest = Number.POSITIVE_INFINITY
  let latest = Number.NEGATIVE_INFINITY

  for (const entry of entries) {
    if (entry.source !== 'demo') {
      continue
    }
    earliest = Math.min(earliest, entry.at)
    latest = Math.max(latest, entry.at + entry.latencyMs)
  }

  if (earliest === Number.POSITIVE_INFINITY) {
    return null
  }

  const from = Math.floor(earliest / MINUTE_MS) * MINUTE_MS - MINUTE_MS
  const to = Math.ceil(latest / MINUTE_MS) * MINUTE_MS + MINUTE_MS

  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() }
}
