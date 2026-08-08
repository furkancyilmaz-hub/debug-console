import { CopyButton } from '../../components/CopyButton'
import type { Finding } from '../../api/types'
import { FixCard } from './FixCard'
import { hasText, repeatLabel, sqlLines } from './reportView'
import styles from './report.module.css'

interface FindingDetailProps {
  finding: Finding
  /** "AI yorumları" anahtarı. Kapalıyken ölçüm bloğu hiç değişmiyor. */
  showAi: boolean
}

/**
 * Bulgunun ayrıntısı. Sıra kesin: **önce ölçüm, sonra yorum.**
 *
 * Ters sırada rapor "AI ne dedi" gibi okunurdu; asıl güç sayılarda. Model
 * metni ayrıca kendi kapsayıcısında duruyor (`.ai`) — kullanıcı hangi bilginin
 * ölçüm hangisinin yorum olduğunu kapsayıcıya bakarak ayırt edebiliyor.
 */
export function FindingDetail({ finding, showAi }: FindingDetailProps) {
  const lines = sqlLines(finding.normalizedQuery)

  return (
    <>
      <div className={styles.measure}>
        <div className={styles.mgrid}>
          <div className={styles.mcell}>
            <div className={styles.mkey}>Correlation</div>
            <div className={styles.mvalue}>
              <span>{finding.correlationId}</span>
              <CopyButton value={finding.correlationId} label="kopyala" />
            </div>
          </div>
          <div className={styles.mcell}>
            <div className={styles.mkey}>İlişki</div>
            <div className={`${styles.mvalue} ${styles.mvalueTight}`}>{finding.foreignKey}</div>
          </div>
          <div className={styles.mcell}>
            <div className={styles.mkey}>Tekrar</div>
            <div className={`${styles.mvalue} ${styles.mvalueTight}`}>{repeatLabel(finding)}</div>
          </div>
          <div className={styles.mcell}>
            <div className={styles.mkey}>Güven</div>
            <div className={styles.mvalue}>{finding.confidence}</div>
          </div>
        </div>

        {/* Anahtar kelime `sqlLines`'tan veri olarak geliyor; HTML gömülmüyor. */}
        <pre className={styles.sql}>
          {lines.map((line, index) => (
            <span key={`${line.keyword ?? ''}-${index}`}>
              {index > 0 && '\n'}
              {line.keyword !== null && <b>{line.keyword}</b>}
              {line.keyword !== null && line.rest !== '' && ' '}
              {line.rest}
            </span>
          ))}
        </pre>

        {finding.sampleBinds.length > 0 && (
          <div className={styles.binds}>bağlanan değerler: {finding.sampleBinds.join(', ')}</div>
        )}
      </div>

      {/* Model katmanı kapalıyken ya da çağrı başarısızken bu bölüm hiç
          render edilmiyor — gizlenmiş boş kutu kalmıyor, rapor sade görünüyor. */}
      {showAi && hasText(finding.explanation) && (
        <div className={styles.ai}>
          <span className={styles.aiLabel}>AI yorumu</span>
          <p className={styles.aiText}>{finding.explanation}</p>
          {finding.suggestion !== null && <FixCard suggestion={finding.suggestion} />}
        </div>
      )}

      {/* Açıklama yok ama öneri varsa kart yine ayrışmış zeminde durmalı. */}
      {showAi && !hasText(finding.explanation) && finding.suggestion !== null && (
        <div className={styles.ai}>
          <span className={styles.aiLabel}>AI önerisi</span>
          <FixCard suggestion={finding.suggestion} />
        </div>
      )}
    </>
  )
}
