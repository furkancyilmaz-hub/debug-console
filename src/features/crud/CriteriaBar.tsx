import type { FormEvent, ReactNode } from 'react'
import styles from './crud.module.css'

/**
 * Kriter satırı: kutular, "Sorgula" düğmesi ve gönderilmemiş değişiklik ipucu.
 *
 * Kriterler yazılır yazılmaz istek atmıyor; sunucuya yalnızca bu düğmeyle —
 * ya da kutudayken Enter'la, `form` bunu bedava veriyor — gidiliyor. Sayfa,
 * boyut ve sıralama bu düğmenin dışında: onlar kriter değil, sonuç kümesinde
 * gezinme.
 *
 * Düğme her zaman etkin. Değişiklik yokken basmak yeni istek doğurmuyor:
 * kriterler aynı kaldığı için `useResource`'un bağımlılıkları da değişmiyor.
 */

interface CriteriaBarProps {
  /** Taslak uygulanandan farklı; kullanıcıya henüz sorgulamadığı söylenir. */
  pending: boolean
  onSubmit: () => void
  /** Kriter kutuları ve sonuç sayacı gibi bara ait ekler. */
  children: ReactNode
}

export function CriteriaBar({ pending, onSubmit, children }: CriteriaBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <>
      <form className={styles.bar} onSubmit={handleSubmit}>
        {children}
        <button type="submit" className={styles.primary}>
          Sorgula
        </button>
      </form>

      {pending && <p className={styles.hint}>Kriter değişti; Sorgula&apos;ya basın.</p>}
    </>
  )
}
