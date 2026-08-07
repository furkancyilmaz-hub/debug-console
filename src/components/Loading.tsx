import { Spinner } from './Spinner'
import styles from './StateBlock.module.css'

interface LoadingProps {
  label?: string
}

/** Tek yükleniyor göstergesi. Ekranlar kendi metnini uydurmaz. */
export function Loading({ label = 'Yükleniyor…' }: LoadingProps) {
  return (
    <div className={`${styles.block} ${styles.loading}`} role="status">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
