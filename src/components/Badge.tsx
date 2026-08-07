import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info'

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
}

/** Küçük durum etiketi: HTTP kodu, aşama, sayaç. */
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
