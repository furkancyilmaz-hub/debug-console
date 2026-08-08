import { Link } from 'react-router-dom'
import styles from './Breadcrumb.module.css'

export interface Crumb {
  /** Liste anahtarı olarak da kullanılır; benzersiz olmalı. */
  label: string
  /** Verilmezse bağlantı değil düz metin olur. */
  to?: string
}

interface BreadcrumbProps {
  items: Crumb[]
}

/** Nerede olduğumuzu ve nereden geldiğimizi gösteren yol. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className={styles.crumb} aria-label="Konum">
      {items.map((item, index) => (
        <span key={item.label} className={styles.item}>
          {index > 0 && (
            <span className={styles.separator} aria-hidden="true">
              ›
            </span>
          )}
          {item.to === undefined ? (
            <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>
          ) : (
            <Link className={styles.link} to={item.to}>
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
