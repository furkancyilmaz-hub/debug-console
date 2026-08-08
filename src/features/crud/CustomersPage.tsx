import { PageHead } from '../../components/PageHead'
import { Segmented } from '../../components/Segmented'
import { listCustomerDetail } from '../../api/demoApi'
import { CustomerSearchList } from './CustomerSearchList'
import { CustomerSummaryList } from './CustomerSummaryList'
import { customerSegments, readCustomerView } from './customerViews'
import { useQueryParam } from './listParams'
import styles from './crud.module.css'

/**
 * Müşteri ekranı. Görünüm değişince liste bileşeni de değişiyor; arama kutusu
 * gibi yerel durumlar böylece kendiliğinden sıfırlanıyor.
 */

export function CustomersPage() {
  const view = readCustomerView(useQueryParam('view').value)

  return (
    <div className={styles.screen}>
      <PageHead title="Müşteriler" description="Tekliflere bağlı sigortalılar" />
      <Segmented items={customerSegments(view)} label="Müşteri görünümü" />

      {view === 'payments' ? (
        <CustomerSummaryList load={listCustomerDetail} caption="Müşteri ödeme özeti" />
      ) : (
        <CustomerSearchList />
      )}
    </div>
  )
}
