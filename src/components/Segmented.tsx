import { Link } from 'react-router-dom'
import styles from './Segmented.module.css'

export interface SegmentItem {
  /** Liste anahtarı; benzersiz olmalı. */
  key: string
  label: string
  to: string
  active: boolean
}

interface SegmentedProps {
  items: readonly SegmentItem[]
  /** Ekran okuyucuya grubun ne olduğunu söyler. */
  label: string
}

/**
 * Aynı verinin farklı görünümleri arasında gezinen segment.
 *
 * Aktiflik dışarıdan geliyor: `NavLink` sorgu dizesine bakmadığı için
 * `/customers` ile `/customers?view=payments` birbirinden ayrılamıyor.
 */
export function Segmented({ items, label }: SegmentedProps) {
  return (
    <nav className={styles.seg} aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className={item.active ? `${styles.item} ${styles.itemActive}` : styles.item}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
