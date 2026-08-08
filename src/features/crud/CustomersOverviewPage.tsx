import { PageHead } from '../../components/PageHead'
import { Segmented } from '../../components/Segmented'
import { listCustomerOverview } from '../../api/demoApi'
import { CustomerSummaryList } from './CustomerSummaryList'
import { customerSegments } from './customerViews'
import styles from './crud.module.css'

/** Müşterilerin ödemeleriyle birlikte özeti. */
export function CustomersOverviewPage() {
  return (
    <div className={styles.screen}>
      <PageHead title="Müşteriler" description="Tekliflere bağlı sigortalılar" />
      <Segmented items={customerSegments('overview')} label="Müşteri görünümü" />
      <CustomerSummaryList load={listCustomerOverview} caption="Müşteri genel bakış" />
    </div>
  )
}
