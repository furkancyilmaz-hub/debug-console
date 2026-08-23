import { Badge } from '../../components/Badge'
import type { Column } from '../../components/table'
import type { ProposalDetailResponse, ProposalResponse } from '../../api/types'
import { formatMoney } from './format'
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from './status'

/**
 * Teklif tablolarının kolonları. İki görünüm aynı listeyi farklı uçlardan
 * çekiyor; kolon tanımı tek yerde durur.
 *
 * Temel kolonlar `ProposalResponse` üzerinden yazılı — `ProposalDetailResponse`
 * bu alanların hepsini taşıdığı için müşterili tabloda da kullanılabiliyor
 * (`customerColumns.tsx` ile aynı ayrım).
 */

export const PROPOSAL_COLUMNS: readonly Column<ProposalResponse>[] = [
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

/**
 * Müşterili görünümün kolonları. `customers` **sıralanabilir değil**: sayı
 * istemcide dizi uzunluğundan hesaplanıyor, sunucu o alana göre sıralayamaz.
 */
export const PROPOSAL_CUSTOMER_COLUMNS: readonly Column<ProposalDetailResponse>[] = [
  ...PROPOSAL_COLUMNS,
  {
    key: 'customers',
    header: 'Müşteri',
    align: 'right',
    width: '8rem',
    render: (row) => row.customers.length,
  },
]
