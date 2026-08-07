import styles from './StateBlock.module.css'

interface EmptyProps {
  title?: string
  hint?: string
}

/** Sonuç yok durumu. Hata değil; ekranlar ikisini karıştırmasın diye ayrı. */
export function Empty({ title = 'Kayıt yok', hint }: EmptyProps) {
  return (
    <div className={styles.block}>
      <span>{title}</span>
      {hint !== undefined && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
