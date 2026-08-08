/**
 * `datetime-local` girdisi yerel saat verir, sözleşme ISO-8601 UTC bekler
 * (`contract.md` §4). Dönüşüm tek yerde.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `Date` → `datetime-local` girdisinin beklediği yerel biçim. */
export function toLocalInputValue(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** `datetime-local` değeri → ISO-8601 UTC. Değer geçersizse `null`. */
export function toInstant(localValue: string): string | null {
  const date = new Date(localValue)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** ISO-8601 → `datetime-local` değeri. Yokluk ve bozuk değer aynı: `null`. */
export function fromInstant(instant: string | null): string | null {
  if (instant === null) {
    return null
  }
  const date = new Date(instant)
  return Number.isNaN(date.getTime()) ? null : toLocalInputValue(date)
}

export interface LocalRange {
  from: string
  to: string
}

/**
 * Adresteki `?from=…&to=…` → form aralığı. Denetçinin "bu istekleri analiz et"
 * düğmesi bu iki parametreyi yazıyor. Biri bile okunamazsa aralık kurulmaz.
 */
export function rangeFromParams(params: URLSearchParams): LocalRange | null {
  const from = fromInstant(params.get('from'))
  const to = fromInstant(params.get('to'))
  return from === null || to === null ? null : { from, to }
}

/** Varsayılan aralık: son 15 dakika. */
export function defaultRange(minutes = 15): LocalRange {
  const now = new Date()
  const past = new Date(now.getTime() - minutes * 60_000)
  return { from: toLocalInputValue(past), to: toLocalInputValue(now) }
}
