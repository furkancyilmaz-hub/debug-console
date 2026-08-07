import type { ReactNode } from 'react'
import styles from './PageHead.module.css'

interface PageHeadProps {
  title: string
  description?: string
  actions?: ReactNode
}

/** Ekran başlığı: solda ad ve açıklama, sağda ekranın eylemleri. */
export function PageHead({ title, description, actions }: PageHeadProps) {
  return (
    <div className={styles.head}>
      <div>
        <h1>{title}</h1>
        {description !== undefined && <p className={styles.description}>{description}</p>}
      </div>
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
