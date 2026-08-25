import type { CriteriaValues } from './criteriaDraft'
import { ISSUE_DATE_FIELDS } from './issueDateRange'
import type { IssueDateField } from './issueDateRange'
import styles from './crud.module.css'

/**
 * Teklif listelerinin ortak tarih kutuları. İki görünüm de aynı süzgeci alıyor
 * (`contract.md` §2b), kutular tek yerde duruyor.
 *
 * Kutular taslağı gösteriyor; değer isteğe "Sorgula" ile gidiyor. Barı kendi
 * çizmiyor: çağıranın barında başka kontroller de olabiliyor — düz listede
 * teklif no araması ve düğme aynı satırda duruyor.
 */

const [FROM, TO] = ISSUE_DATE_FIELDS

interface IssueDateFilterProps {
  values: CriteriaValues<IssueDateField>
  set: (name: IssueDateField, value: string) => void
  /**
   * Teklif no araması etkinken pasif. `/api/proposals/search` yalnızca
   * `proposalNo` kabul ediyor; kutuyu pasifleştirmek geçersiz bileşimi kullanıcı
   * yazmadan önce görünür kılıyor.
   */
  disabled?: boolean
}

export function IssueDateFilter({ values, set, disabled = false }: IssueDateFilterProps) {
  return (
    <>
      <label className={styles.search}>
        <span className={styles.label}>Düzenleme başlangıç</span>
        <input
          type="date"
          value={values[FROM]}
          disabled={disabled}
          onChange={(event) => set(FROM, event.target.value)}
        />
      </label>
      <label className={styles.search}>
        <span className={styles.label}>Bitiş</span>
        <input
          type="date"
          value={values[TO]}
          disabled={disabled}
          onChange={(event) => set(TO, event.target.value)}
        />
      </label>
    </>
  )
}
