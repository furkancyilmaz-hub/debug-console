import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { SortState } from '../../components/table'
import { listProposalDetail } from '../../api/demoApi'
import { useResource } from '../../hooks/useResource'
import { useListParams } from './listParams'
import { PROPOSAL_CUSTOMER_COLUMNS } from './proposalColumns'

/**
 * Teklifler, bağlı müşterileriyle birlikte.
 *
 * Süzgeç **yok** ve eklenemez: `/api/proposals/detail` yalnızca sayfa
 * parametreleri alıyor, kimliğe ya da numaraya göre süzülemiyor. Müşteri
 * listesindeki teklif süzgecinin buradaki karşılığı bu yüzden bulunmuyor.
 */

const DEFAULT_SORT: SortState = { key: 'issueDate', direction: 'desc' }

export function ProposalSummaryList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)

  const { state, reload } = useResource(
    async (signal) => (await listProposalDetail({ page, size, sort: sortParam }, signal)).data,
    [page, size, sortParam],
  )

  return (
    <DataTable
      columns={PROPOSAL_CUSTOMER_COLUMNS}
      rows={state.data?.content ?? []}
      rowKey={(row) => row.id}
      caption="Müşterileriyle teklifler"
      loading={state.status === 'loading'}
      error={state.error}
      onRetry={reload}
      emptyTitle="Teklif yok"
      emptyHint="Gösterilecek kayıt bulunmuyor."
      onRowClick={(row) => navigate(`/proposals/${row.id}`)}
      sort={sort}
      onSortChange={setSort}
      page={state.data ?? null}
      onPageChange={setPage}
      onSizeChange={setSize}
    />
  )
}
