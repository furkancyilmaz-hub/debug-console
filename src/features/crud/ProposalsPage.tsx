import { Link } from 'react-router-dom'
import { PageHead } from '../../components/PageHead'
import { ProposalSearchList } from './ProposalSearchList'
import styles from './crud.module.css'

/** Teklif ekranının kabuğu; liste ve arama `ProposalSearchList`'te. */

export function ProposalsPage() {
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

      <ProposalSearchList />
    </div>
  )
}
