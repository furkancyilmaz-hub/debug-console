import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { SortState } from '../../components/table'
import { listProposalDetail } from '../../api/demoApi'
import { useResource } from '../../hooks/useResource'
import { IssueDateFilter } from './IssueDateFilter'
import { emptyRangeHint, useIssueDateRange } from './issueDateRange'
import { useListParams } from './listParams'
import { PROPOSAL_CUSTOMER_COLUMNS } from './proposalColumns'
import styles from './crud.module.css'

/**
 * Teklifler, bağlı müşterileriyle birlikte.
 *
 * Düzenleme tarihine göre süzülebiliyor (`contract.md` §2b). Süzgeç burada
 * kimlik ya da numara değil tarih: `/api/proposals/detail` tek bir teklife
 * daraltılamıyor, ama tarih aralığı sonucu sayfa boyutunun altına indirebiliyor.
 * Ölçüm tarafındaki karşılığı bu — daraltılmış aralıkta N+1 tekrar sayısı sayfa
 * boyutuna değil, o aralıktaki teklif sayısına eşit oluyor.
 */

const DEFAULT_SORT: SortState = { key: 'issueDate', direction: 'desc' }

export function ProposalSummaryList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const range = useIssueDateRange()

  const { state, reload } = useResource(
    async (signal) =>
      (
        await listProposalDetail(
          { page, size, sort: sortParam, issueDateFrom: range.from, issueDateTo: range.to },
          signal,
        )
      ).data,
    [page, size, sortParam, range.from, range.to],
  )

  return (
    <>
      <div className={styles.bar}>
        <IssueDateFilter range={range} />
      </div>

      <DataTable
        columns={PROPOSAL_CUSTOMER_COLUMNS}
        rows={state.data?.content ?? []}
        rowKey={(row) => row.id}
        caption="Müşterileriyle teklifler"
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle="Teklif yok"
        emptyHint={emptyRangeHint(range, 'Gösterilecek kayıt bulunmuyor.')}
        onRowClick={(row) => navigate(`/proposals/${row.id}`)}
        sort={sort}
        onSortChange={setSort}
        page={state.data ?? null}
        onPageChange={setPage}
        onSizeChange={setSize}
      />
    </>
  )
}
