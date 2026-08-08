import { useEffect, useRef, useState } from 'react'
import styles from './CopyButton.module.css'

interface CopyButtonProps {
  value: string
  label?: string
}

/** Correlation id gibi kısa değerleri panoya alır. */
export function CopyButton({ value, label = 'Kopyala' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Bileşen "kopyalandı" yazarken sökülürse timer arkada kalmasın.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const copy = (): void => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
      timerRef.current = window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${copied ? styles.copied : ''}`}
      onClick={copy}
      // Kopyalama düğmesinin kâğıtta işi yok.
      data-print="hide"
    >
      {copied ? 'Kopyalandı' : label}
    </button>
  )
}
