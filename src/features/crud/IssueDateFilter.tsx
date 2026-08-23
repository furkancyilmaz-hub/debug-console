import type { IssueDateRange } from './issueDateRange'
import styles from './crud.module.css'

/**
 * Teklif listelerinin ortak tarih kutuları. İki görünüm de aynı süzgeci alıyor
 * (`contract.md` §2b), kutular tek yerde duruyor.
 *
 * Barı kendi çizmiyor: çağıranın barında başka kontroller de olabiliyor — düz
 * listede teklif no araması aynı satırda duruyor.
 */

interface IssueDateFilterProps {
  range: IssueDateRange
  /**
   * Teklif no araması etkinken pasif. `/api/proposals/search` yalnızca
   * `proposalNo` kabul ediyor; kutuyu pasifleştirmek geçersiz bileşimi kullanıcı
   * yazmadan önce görünür kılıyor.
   */
  disabled?: boolean
}

export function IssueDateFilter({ range, disabled = false }: IssueDateFilterProps) {
  return (
    <>
      <label className={styles.search}>
        <span className={styles.label}>Düzenleme başlangıç</span>
        <input
          type="date"
          value={range.from}
          disabled={disabled}
          onChange={(event) => range.setFrom(event.target.value)}
        />
      </label>
      <label className={styles.search}>
        <span className={styles.label}>Bitiş</span>
        <input
          type="date"
          value={range.to}
          disabled={disabled}
          onChange={(event) => range.setTo(event.target.value)}
        />
      </label>
    </>
  )
}
