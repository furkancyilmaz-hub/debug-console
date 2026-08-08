import { Badge } from '../../components/Badge'
import type { Column } from '../../components/table'
import type { CustomerResponse, CustomerSummary, PaymentResponse } from '../../api/types'
import { formatMoney } from './format'
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE } from './status'

/**
 * Müşteri tablolarının kolonları. Dört ekran aynı listeyi farklı uçlardan
 * çekiyor; kolon tanımı tek yerde durur.
 *
 * Temel kolonlar `CustomerSummary` üzerinden yazılı — `CustomerResponse` bu
 * alanların hepsini taşıdığı için iki tabloda da kullanılabiliyor.
 */

export const CUSTOMER_COLUMNS: readonly Column<CustomerSummary>[] = [
  { key: 'fullName', header: 'Ad soyad', sortable: true, render: (row) => row.fullName },
  { key: 'city', header: 'Şehir', sortable: true, width: '14rem', render: (row) => row.city },
  {
    key: 'status',
    header: 'Durum',
    sortable: true,
    width: '10rem',
    render: (row) => (
      <Badge tone={CUSTOMER_STATUS_TONE[row.status]}>{CUSTOMER_STATUS_LABEL[row.status]}</Badge>
    ),
  },
]

function paymentTotal(payments: readonly PaymentResponse[]): number {
  return payments.reduce((sum, payment) => sum + payment.amount, 0)
}

/**
 * Ödeme sütunları eklenmiş hâli. Sunucu bu iki sütuna göre sıralayamadığı için
 * başlıkları sıralanabilir değil.
 */
export const CUSTOMER_PAYMENT_COLUMNS: readonly Column<CustomerResponse>[] = [
  ...CUSTOMER_COLUMNS,
  {
    key: 'paymentCount',
    header: 'Ödeme',
    align: 'right',
    width: '7rem',
    render: (row) => row.payments.length,
  },
  {
    key: 'paymentTotal',
    header: 'Toplam',
    align: 'right',
    width: '11rem',
    render: (row) => formatMoney(paymentTotal(row.payments)),
  },
]
