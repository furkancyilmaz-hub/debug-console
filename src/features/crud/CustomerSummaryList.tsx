import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { SortState } from '../../components/table'
import type { CustomerResponse, Page, PageParams, RequestResult } from '../../api/types'
import { useResource } from '../../hooks/useResource'
import { CUSTOMER_PAYMENT_COLUMNS } from './customerColumns'
import { useListParams } from './listParams'

/**
 * Ödeme bilgisiyle birlikte gelen müşteri listesi. Kaynağı çağıran belirler;
 * tablo iki görünümde de aynı.
 */

const DEFAULT_SORT: SortState = { key: 'fullName', direction: 'asc' }

interface CustomerSummaryListProps {
  /** Modül düzeyinde tanımlı bir uç olmalı: kimliği her render'da değişmemeli. */
  load: (params: PageParams, signal: AbortSignal) => Promise<RequestResult<Page<CustomerResponse>>>
  caption: string
}

export function CustomerSummaryList({ load, caption }: CustomerSummaryListProps) {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)

  const { state, reload } = useResource(
    async (signal) => (await load({ page, size, sort: sortParam }, signal)).data,
    [load, page, size, sortParam],
  )

  return (
    <DataTable
      columns={CUSTOMER_PAYMENT_COLUMNS}
      rows={state.data?.content ?? []}
      rowKey={(row) => row.id}
      caption={caption}
      loading={state.status === 'loading'}
      error={state.error}
      onRetry={reload}
      emptyTitle="Müşteri yok"
      emptyHint="Bu sayfada gösterilecek kayıt bulunmuyor."
      onRowClick={(row) => navigate(`/customers/${row.id}`)}
      sort={sort}
      onSortChange={setSort}
      page={state.data}
      onPageChange={setPage}
      onSizeChange={setSize}
    />
  )
}
