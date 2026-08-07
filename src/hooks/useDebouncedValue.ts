import { useEffect, useState } from 'react'

/**
 * Hızla değişen bir değeri (arama kutusu gibi) yatıştırır. Timer her değişimde
 * temizlenir; bileşen sökülürken de öyle.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
