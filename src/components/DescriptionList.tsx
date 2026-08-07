import type { ReactNode } from 'react'
import styles from './DescriptionList.module.css'

export interface DescriptionItem {
  /** Liste anahtarı olarak da kullanılır; benzersiz olmalı. */
  term: string
  value: ReactNode
}

interface DescriptionListProps {
  items: DescriptionItem[]
}

/** Etiket–değer çiftleri. Detay ekranlarının ortak gövdesi. */
export function DescriptionList({ items }: DescriptionListProps) {
  return (
    <dl className={styles.list}>
      {items.map((item) => (
        <div key={item.term} style={{ display: 'contents' }}>
          <dt className={styles.term}>{item.term}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
