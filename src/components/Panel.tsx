import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

/** Başlıklı çerçeve. Ekranlar içeriği bunun içine koyar. */
export function Panel({ title, description, actions, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h2>{title}</h2>
          {description !== undefined && <span className={styles.description}>{description}</span>}
        </div>
        {actions !== undefined && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
