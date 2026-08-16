import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { DataTable } from '../../components/DataTable'
import {
  getProposal,
  listCustomers,
  listProposalDetail,
  searchCustomersByIdentity,
} from '../../api/demoApi'
import type { CustomerSummary } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useResource } from '../../hooks/useResource'
import { CUSTOMER_COLUMNS } from './customerColumns'
import { DetailLayout } from './DetailLayout'
import { formatMoney } from './format'
import { readId } from './routeParams'
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from './status'
import styles from './crud.module.css'

/**
 * Teklif detayı: üstte teklif alanları, altta teklife bağlı müşteriler.
 *
 * Kimlik numarasına göre arama da burada. Sözleşmedeki ikinci arama modu
 * `proposalId` + `identityNo` istiyor; teklif kimliği rotadan geldiği için
 * kullanıcı yalnızca kimlik numarasını yazıyor, teklif seçmiyor. Arama zaten
 * ekranda listelenen kümeyi — bu teklifin müşterilerini — daraltıyor.
 */

const LOOKUP_SIZE = 250
/** Bu tablo sayfalanmıyor: teklifin müşterileri tek seferde gelir. */
const FULL_SIZE = 1000
const SEARCH_DELAY_MS = 300

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

  const fallback = await listCustomers({ proposalId, size: FULL_SIZE }, signal)
  return fallback.data.content
}

/**
 * Teklife bağlı müşteriler içinde kimlik numarasıyla arama. `proposalId`
 * çağıranın elinde olduğu için uca ikisi birlikte gidiyor; sözleşmenin
 * "yarım bileşim `400` döner" kuralı böylece çağrı yerinde sağlanıyor.
 */
async function searchCustomers(
  proposalId: number,
  identityNo: string,
  signal: AbortSignal,
): Promise<CustomerSummary[]> {
  const found = await searchCustomersByIdentity(
    proposalId,
    identityNo,
    { size: FULL_SIZE },
    signal,
  )
  return found.data.content
}

function ProposalDetail({ proposalId }: { proposalId: number }) {
  const navigate = useNavigate()

  // Kimlik numarası adres çubuğuna yazılmıyor: sözleşme (§2b) o değerin
  // bind log'una düştüğünü söylüyor, URL'e koymak onu tarayıcı geçmişine ve
  // paylaşılan bağlantılara da taşırdı.
  const [identityInput, setIdentityInput] = useState('')
  const identityNo = useDebouncedValue(identityInput, SEARCH_DELAY_MS).trim()

  const proposal = useResource(
    async (signal) => (await getProposal(proposalId, signal)).data,
    [proposalId],
  )

  const customers = useResource(
    (signal) =>
      identityNo === ''
        ? loadCustomers(proposalId, signal)
        : searchCustomers(proposalId, identityNo, signal),
    [proposalId, identityNo],
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

        <div className={styles.bar}>
          <label className={styles.search}>
            <span className={styles.label}>Kimlik no</span>
            <input
              type="search"
              autoComplete="off"
              value={identityInput}
              placeholder="Bu teklif içinde ara"
              onChange={(event) => setIdentityInput(event.target.value)}
            />
          </label>
        </div>
        <span className={styles.hint}>
          Kimlik numarası sorgunun bind parametresi olarak app_log&apos;a yazılır. Bu aramayı
          üretim verisiyle kullanmayın.
        </span>

        <DataTable
          columns={CUSTOMER_COLUMNS}
          rows={customers.state.data ?? []}
          rowKey={(row) => row.id}
          caption="Teklife bağlı müşteriler"
          loading={customers.state.status === 'loading'}
          error={customers.state.error}
          onRetry={customers.reload}
          emptyTitle="Müşteri yok"
          emptyHint={
            identityNo === ''
              ? 'Bu teklife bağlı sigortalı bulunmuyor.'
              : 'Bu kimlik numarasında bir sigortalı yok.'
          }
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
