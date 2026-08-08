import { AGENT_BASE } from './config'

/**
 * İstek kaydının tek yayın noktası. `client.ts` her çağrı tamamlandığında buraya
 * haber verir, denetçi paneli dinler. Bileşenler ayrıca kayıt tutmaz; yoksa
 * bazı istekler panele hiç düşmez.
 *
 * Kaydın burada durmasının sebebi: `client.ts` base adreslerini bilmiyor, `base`
 * ona dışarıdan geliyor. Hangi backend'e gidildiğini ayırt etmek `config.ts`'i
 * okumayı gerektiriyor; o okuma bu dosyada kalıyor.
 */

export type RequestSource = 'demo' | 'agent'

export interface RequestLogEntry {
  id: number
  /** İsteğin **başladığı** an (`Date.now()`). Analiz aralığı buradan kuruluyor. */
  at: number
  source: RequestSource
  method: string
  /** Base atılmış hali: `/api/customers?page=0&size=20`. */
  path: string
  /** `0` → ağa hiç çıkılamadı (`NETWORK_ERROR_STATUS`). */
  status: number
  latencyMs: number
  correlationId: string | null
}

/** `client.ts`'in bildiği ham veri; `id`, `source` ve `path` burada türetiliyor. */
export interface RequestLogInput {
  base: string
  url: string
  method: string
  at: number
  status: number
  latencyMs: number
  correlationId: string | null
}

type Listener = (entry: RequestLogEntry) => void

const listeners = new Set<Listener>()
let nextId = 0

/** Dönen fonksiyon aboneliği kapatır; efekt temizliğinde çağrılır. */
export function subscribeRequestLog(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** İki backend var; ajan değilse hedef servistir. */
function sourceOf(base: string): RequestSource {
  return base === AGENT_BASE ? 'agent' : 'demo'
}

export function publishRequestLog(input: RequestLogInput): void {
  // Panel bağlı değilken kimlik harcamaya gerek yok.
  if (listeners.size === 0) {
    return
  }
  const entry: RequestLogEntry = {
    id: nextId++,
    at: input.at,
    source: sourceOf(input.base),
    path: input.url.startsWith(input.base) ? input.url.slice(input.base.length) : input.url,
    method: input.method,
    status: input.status,
    latencyMs: input.latencyMs,
    correlationId: input.correlationId,
  }
  for (const listener of listeners) {
    listener(entry)
  }
}
