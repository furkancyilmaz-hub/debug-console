import { Link } from 'react-router-dom'
import { Empty } from '../../components/Empty'
import type { AnalysisReport } from '../../api/types'
import styles from './analysis.module.css'

interface AnalysisEmptyResultProps {
  report: AnalysisReport
}

/**
 * "Sonuç yok"un iki ayrı hâli — karıştırılmaları kullanıcıyı yanıltırdı:
 * ortada hiç trafik olmaması bir kurulum sorunu, bulgu çıkmaması ise geçerli
 * bir sonuç. Bulgu varken bileşen hiçbir şey basmaz.
 */
export function AnalysisEmptyResult({ report }: AnalysisEmptyResultProps) {
  const { queries, findings } = report.counts

  if (queries === 0) {
    return (
      <div className={styles.emptyResult}>
        <Empty
          title="Bu aralıkta analiz edilecek SELECT trafiği yok"
          hint="Aralığı genişletin ya da CRUD ekranında birkaç sayfa gezip yeniden deneyin."
        />
        <Link className={styles.emptyAction} to="/proposals">
          CRUD ekranına git
        </Link>
      </div>
    )
  }

  if (findings === 0) {
    return (
      <div className={styles.emptyResult}>
        <Empty
          title="Bu aralıkta N+1 deseni bulunmadı"
          hint={`${queries.toLocaleString('tr-TR')} sorgu incelendi.`}
        />
      </div>
    )
  }

  return null
}
