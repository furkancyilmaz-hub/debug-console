import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { DataTable } from '../../components/DataTable'
import { PageHead } from '../../components/PageHead'
import type { Column, SortState } from '../../components/table'
import { listProposals } from '../../api/demoApi'
import type { ProposalResponse } from '../../api/types'
import { useResource } from '../../hooks/useResource'
import { useListParams } from './listParams'
import { formatMoney } from './format'
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from './status'
import styles from './crud.module.css'

/** Teklif listesi. Sayfalama, sıralama ve veri tamamen sunucudan gelir. */

const DEFAULT_SORT: SortState = { key: 'issueDate', direction: 'desc' }

// Kolonlar ekranın kendi bilgisi; `DataTable` bunları tanımıyor.
const COLUMNS: readonly Column<ProposalResponse>[] = [
  {
    key: 'proposalNo',
    header: 'Teklif no',
    sortable: true,
    render: (row) => <code>{row.proposalNo}</code>,
  },
  {
    key: 'status',
    header: 'Durum',
    sortable: true,
    width: '10rem',
    render: (row) => (
      <Badge tone={PROPOSAL_STATUS_TONE[row.status]}>{PROPOSAL_STATUS_LABEL[row.status]}</Badge>
    ),
  },
  {
    key: 'issueDate',
    header: 'Düzenleme',
    sortable: true,
    width: '10rem',
    render: (row) => <code>{row.issueDate}</code>,
  },
  {
    key: 'totalPremium',
    header: 'Prim',
    sortable: true,
    align: 'right',
    width: '11rem',
    render: (row) => formatMoney(row.totalPremium),
  },
]

export function ProposalsPage() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)

  const { state, reload } = useResource(
    async (signal) => (await listProposals({ page, size, sort: sortParam }, signal)).data,
    [page, size, sortParam],
  )

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

      <DataTable
        columns={COLUMNS}
        rows={state.data?.content ?? []}
        rowKey={(row) => row.id}
        caption="Teklifler"
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle="Teklif yok"
        emptyHint="Bu sayfada gösterilecek kayıt bulunmuyor."
        onRowClick={(row) => navigate(`/proposals/${row.id}`)}
        sort={sort}
        onSortChange={setSort}
        page={state.data}
        onPageChange={setPage}
        onSizeChange={setSize}
      />
    </div>
  )
}
