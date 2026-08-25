import { Link } from 'react-router-dom'
import { PageHead } from '../../components/PageHead'
import { Segmented } from '../../components/Segmented'
import { ProposalSearchList } from './ProposalSearchList'
import { ProposalSummaryList } from './ProposalSummaryList'
import { useQueryParam } from './listParams'
import { proposalSegments, readProposalView } from './proposalViews'
import styles from './crud.module.css'

/**
 * Teklif ekranının kabuğu. Görünüm değişince liste bileşeni de değişiyor; kriter
 * taslağı gibi yerel durumlar böylece kendiliğinden sıfırlanıyor
 * (`CustomersPage` ile aynı kalıp).
 *
 * Segment bağlantıları uygulanmış tarih aralığını taşıyor; kabuk bu yüzden
 * adresteki iki tarih parametresini okuyor.
 */

export function ProposalsPage() {
  const view = readProposalView(useQueryParam('view'))
  const issueDateFrom = useQueryParam('issueDateFrom')
  const issueDateTo = useQueryParam('issueDateTo')

  return (
    <div className={styles.screen}>
      <PageHead
        title="Teklifler"
        description="Poliçe teklifleri ve durumları"
        actions={
          <Link className={styles.primary} to="/proposals/new">
            Yeni teklif
          </Link>
        }
      />

      <Segmented
        items={proposalSegments(view, { issueDateFrom, issueDateTo })}
        label="Teklif görünümü"
      />

      {view === 'customers' ? <ProposalSummaryList /> : <ProposalSearchList />}
    </div>
  )
}
