import { CopyButton } from '../../components/CopyButton'
import type { FixProposal } from '../../api/types'
import styles from './report.module.css'

interface FixCardProps {
  suggestion: FixProposal
}

/**
 * Modelin önerdiği çözüm. `suggestion` null iken çağıran hiç render etmiyor —
 * boş kart çıkmasın, rapor yine eksiksiz görünsün.
 *
 * `rationale` bilerek gösterilmiyor: `explanation` zaten üstteki bölümde aynı
 * işi yapıyor, ikisi yan yana aynı şeyi iki kez söylüyor.
 */
export function FixCard({ suggestion }: FixCardProps) {
  const { action, expectedResult, risk, alternatives } = suggestion

  return (
    <div className={styles.fix}>
      <code className={styles.fixAction}>{action}</code>

      <dl className={styles.fixMeta}>
        <dt className={styles.fixTerm}>Beklenen</dt>
        <dd className={styles.fixExpected}>{expectedResult}</dd>
        <dt className={styles.fixTerm}>Risk</dt>
        <dd className={styles.fixValue}>{risk}</dd>
      </dl>

      {/* Alternatifler katlanabilir: bulgu sayısı artınca liste okunmaz hâle
          gelmesin. `<details>` native — açık/kapalı için state tutulmuyor. */}
      {alternatives.trim() !== '' && (
        <details className={styles.fixAlternatives}>
          <summary>Alternatif</summary>
          <p>{alternatives}</p>
        </details>
      )}

      <div className={styles.fixCopy}>
        <CopyButton value={action} label="Komutu kopyala" />
      </div>
    </div>
  )
}
