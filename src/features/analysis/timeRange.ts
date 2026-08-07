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

export interface LocalRange {
  from: string
  to: string
}

/** Varsayılan aralık: son 15 dakika. */
export function defaultRange(minutes = 15): LocalRange {
  const now = new Date()
  const past = new Date(now.getTime() - minutes * 60_000)
  return { from: toLocalInputValue(past), to: toLocalInputValue(now) }
}
