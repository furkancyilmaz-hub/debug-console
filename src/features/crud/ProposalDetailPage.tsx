import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { DataTable } from '../../components/DataTable'
import { getProposal, listCustomers, listProposalDetail } from '../../api/demoApi'
import type { CustomerSummary } from '../../api/types'
import { useResource } from '../../hooks/useResource'
import { CUSTOMER_COLUMNS } from './customerColumns'
import { DetailLayout } from './DetailLayout'
import { formatMoney } from './format'
import { readId } from './routeParams'
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from './status'
import styles from './crud.module.css'

/** Teklif detayı: üstte teklif alanları, altta teklife bağlı müşteriler. */

const LOOKUP_SIZE = 20
const FALLBACK_SIZE = 200

/**
 * Müşteri listesi `/proposals/detail`'den geliyor; bu uç kimliğe göre
 * süzülemiyor, sayfa çekilip aranan satır burada bulunuyor.
 *
 * Kimlikler sırayla üretildiği için teklifin hangi sayfaya düştüğü tahmin
 * edilebiliyor. Tahmin tutmazsa — kayıt silinmiş, kimlikler seyrekse — ekran
 * boş kalmasın diye düz müşteri ucuna düşülür.
 */
async function loadCustomers(proposalId: number, signal: AbortSignal): Promise<CustomerSummary[]> {
  const page = Math.floor((proposalId - 1) / LOOKUP_SIZE)
  const detail = await listProposalDetail({ page, size: LOOKUP_SIZE, sort: 'id,asc' }, signal)
  const match = detail.data.content.find((row) => row.id === proposalId)
  if (match !== undefined) {
    return match.customers
  }

  const fallback = await listCustomers({ proposalId, size: FALLBACK_SIZE }, signal)
  return fallback.data.content
}

function ProposalDetail({ proposalId }: { proposalId: number }) {
  const navigate = useNavigate()

  const proposal = useResource(
    async (signal) => (await getProposal(proposalId, signal)).data,
    [proposalId],
  )

  const customers = useResource(
    (signal) => loadCustomers(proposalId, signal),
    [proposalId],
  )

  const record = proposal.state.data
  const summary =
    record === null
      ? null
      : [
          { term: 'Teklif no', value: <code>{record.proposalNo}</code> },
          {
            term: 'Durum',
            value: (
              <Badge tone={PROPOSAL_STATUS_TONE[record.status]}>
                {PROPOSAL_STATUS_LABEL[record.status]}
              </Badge>
            ),
          },
          { term: 'Düzenleme', value: <code>{record.issueDate}</code> },
          { term: 'Toplam prim', value: formatMoney(record.totalPremium) },
        ]

  return (
    <DetailLayout
      crumbs={[
        { label: 'Teklifler', to: '/proposals' },
        { label: record?.proposalNo ?? `#${proposalId}` },
        { label: 'Müşteriler' },
      ]}
      title={record?.proposalNo ?? 'Teklif'}
      description="Teklif bilgileri ve bağlı sigortalılar"
      summaryTitle="Teklif"
      summary={summary}
      loading={proposal.state.status === 'loading'}
      error={proposal.state.error}
      onRetry={proposal.reload}
    >
      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Müşteriler</h2>
        <DataTable
          columns={CUSTOMER_COLUMNS}
          rows={customers.state.data ?? []}
          rowKey={(row) => row.id}
          caption="Teklife bağlı müşteriler"
          loading={customers.state.status === 'loading'}
          error={customers.state.error}
          onRetry={customers.reload}
          emptyTitle="Müşteri yok"
          emptyHint="Bu teklife bağlı sigortalı bulunmuyor."
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
        />
      </section>
    </DetailLayout>
  )
}

export function ProposalDetailPage() {
  const params = useParams()
  const proposalId = readId(params.id)

  return proposalId === null ? (
    <Navigate to="/proposals" replace />
  ) : (
    <ProposalDetail proposalId={proposalId} />
  )
}
