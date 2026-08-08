import { Navigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { DataTable } from '../../components/DataTable'
import type { Column, SortState } from '../../components/table'
import { getCustomer, listCustomerPayments } from '../../api/demoApi'
import type { PaymentResponse } from '../../api/types'
import { useResource } from '../../hooks/useResource'
import { DetailLayout } from './DetailLayout'
import { formatMoney } from './format'
import { useListParams } from './listParams'
import { readId } from './routeParams'
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from './status'
import styles from './crud.module.css'

/** Müşteri detayı: üstte kimlik bilgileri, altta sunucu sayfalı ödemeleri. */

const DEFAULT_SORT: SortState = { key: 'dueDate', direction: 'asc' }

const COLUMNS: readonly Column<PaymentResponse>[] = [
  {
    key: 'dueDate',
    header: 'Vade',
    sortable: true,
    width: '12rem',
    render: (row) => <code>{row.dueDate}</code>,
  },
  {
    key: 'status',
    header: 'Durum',
    sortable: true,
    width: '10rem',
    render: (row) => (
      <Badge tone={PAYMENT_STATUS_TONE[row.status]}>{PAYMENT_STATUS_LABEL[row.status]}</Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Tutar',
    sortable: true,
    align: 'right',
    width: '12rem',
    render: (row) => formatMoney(row.amount),
  },
]

function CustomerDetail({ customerId }: { customerId: number }) {
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)

  const customer = useResource(
    async (signal) => (await getCustomer(customerId, signal)).data,
    [customerId],
  )

  const payments = useResource(
    async (signal) =>
      (await listCustomerPayments(customerId, { page, size, sort: sortParam }, signal)).data,
    [customerId, page, size, sortParam],
  )

  const record = customer.state.data
  const summary =
    record === null
      ? null
      : [
          { term: 'Ad soyad', value: record.fullName },
          { term: 'Kimlik no', value: <code>{record.identityNo}</code> },
          { term: 'Şehir', value: record.city },
          {
            term: 'Durum',
            value: (
              <Badge tone={CUSTOMER_STATUS_TONE[record.status]}>
                {CUSTOMER_STATUS_LABEL[record.status]}
              </Badge>
            ),
          },
        ]

  return (
    <DetailLayout
      crumbs={[
        { label: 'Müşteriler', to: '/customers' },
        { label: record?.fullName ?? `#${customerId}` },
        { label: 'Ödemeler' },
      ]}
      title={record?.fullName ?? 'Müşteri'}
      description="Müşteri bilgileri ve ödeme hareketleri"
      summaryTitle="Müşteri"
      summary={summary}
      loading={customer.state.status === 'loading'}
      error={customer.state.error}
      onRetry={customer.reload}
    >
      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Ödemeler</h2>
        <DataTable
          columns={COLUMNS}
          rows={payments.state.data?.content ?? []}
          rowKey={(row) => row.id}
          caption="Müşteri ödemeleri"
          loading={payments.state.status === 'loading'}
          error={payments.state.error}
          onRetry={payments.reload}
          emptyTitle="Ödeme yok"
          emptyHint="Bu müşteriye bağlı ödeme kaydı bulunmuyor."
          sort={sort}
          onSortChange={setSort}
          page={payments.state.data}
          onPageChange={setPage}
          onSizeChange={setSize}
        />
      </section>
    </DetailLayout>
  )
}

export function CustomerDetailPage() {
  const params = useParams()
  const customerId = readId(params.id)

  return customerId === null ? (
    <Navigate to="/customers" replace />
  ) : (
    <CustomerDetail customerId={customerId} />
  )
}
