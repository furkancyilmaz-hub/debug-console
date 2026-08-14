import { DEMO_BASE } from './config'
import { request } from './client'
import type {
  CustomerResponse,
  Page,
  PageParams,
  PaymentResponse,
  ProposalCreateRequest,
  ProposalDetailResponse,
  ProposalResponse,
  RequestResult,
} from './types'

/**
 * Hedef servisin (`demo-crud-api`) uçları. Yollar yalnızca burada yazılı.
 *
 * Liste uçlarının üçü de aynı veriyi farklı biçimde yükler; hangisinin nasıl
 * davrandığı burada da ekranda da yazmaz — bunu ortaya çıkarmak raporun işi.
 */

export interface CustomerListParams extends PageParams {
  proposalId?: number
}

function customers(path: string) {
  return `/api/customers${path}`
}

function proposals(path: string) {
  return `/api/proposals${path}`
}

export function listCustomers(
  params: CustomerListParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<CustomerResponse>>> {
  return request<Page<CustomerResponse>>(DEMO_BASE, customers(''), { query: { ...params }, signal })
}

export function listCustomerDetail(
  params: CustomerListParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<CustomerResponse>>> {
  return request<Page<CustomerResponse>>(DEMO_BASE, customers('/detail'), {
    query: { ...params },
    signal,
  })
}

export function listCustomerOverview(
  params: CustomerListParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<CustomerResponse>>> {
  return request<Page<CustomerResponse>>(DEMO_BASE, customers('/overview'), {
    query: { ...params },
    signal,
  })
}

/**
 * Arama ucunun birinci modu. `/api/customers/search` tam olarak iki mod kabul
 * eder: tek başına `city`, ya da birlikte verilen `proposalId` + `identityNo`.
 * Başka her kombinasyon `400` döner, parametreler sessizce yok sayılmaz —
 * bu yüzden iki mod iki ayrı fonksiyon; tek fonksiyonun isteğe bağlı
 * argümanları geçersiz bileşimi çağrı yerinde mümkün kılardı.
 */
export function searchCustomersByCity(
  city: string,
  params: PageParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<CustomerResponse>>> {
  return request<Page<CustomerResponse>>(DEMO_BASE, customers('/search'), {
    query: { city, ...params },
    signal,
  })
}

/** Arama ucunun ikinci modu; ikisi birlikte gider, biri tek başına `400`. */
export function searchCustomersByIdentity(
  proposalId: number,
  identityNo: string,
  params: PageParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<CustomerResponse>>> {
  return request<Page<CustomerResponse>>(DEMO_BASE, customers('/search'), {
    query: { proposalId, identityNo, ...params },
    signal,
  })
}

export function getCustomer(
  id: number,
  signal: AbortSignal,
): Promise<RequestResult<CustomerResponse>> {
  return request<CustomerResponse>(DEMO_BASE, customers(`/${id}`), { signal })
}

export function listCustomerPayments(
  id: number,
  params: PageParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<PaymentResponse>>> {
  return request<Page<PaymentResponse>>(DEMO_BASE, customers(`/${id}/payments`), {
    query: { ...params },
    signal,
  })
}

export function listProposals(
  params: PageParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<ProposalResponse>>> {
  return request<Page<ProposalResponse>>(DEMO_BASE, proposals(''), {
    query: { ...params },
    signal,
  })
}

/** Teklifleri müşterileriyle birlikte döner. Kimliğe göre süzme yok. */
export function listProposalDetail(
  params: PageParams,
  signal: AbortSignal,
): Promise<RequestResult<Page<ProposalDetailResponse>>> {
  return request<Page<ProposalDetailResponse>>(DEMO_BASE, proposals('/detail'), {
    query: { ...params },
    signal,
  })
}

/**
 * Teklif numarasına göre tek teklif. `proposal_no` tekil olduğu için cevap
 * sayfalanmaz; kayıt yoksa uç `404` döner — çağıran bunu `isNotFound` ile
 * boş sonuca çevirir.
 */
export function searchProposalByNo(
  proposalNo: string,
  signal: AbortSignal,
): Promise<RequestResult<ProposalResponse>> {
  return request<ProposalResponse>(DEMO_BASE, proposals('/search'), {
    query: { proposalNo },
    signal,
  })
}

export function getProposal(
  id: number,
  signal: AbortSignal,
): Promise<RequestResult<ProposalResponse>> {
  return request<ProposalResponse>(DEMO_BASE, proposals(`/${id}`), { signal })
}

export function createProposal(
  body: ProposalCreateRequest,
  signal: AbortSignal,
): Promise<RequestResult<ProposalResponse>> {
  return request<ProposalResponse>(DEMO_BASE, proposals(''), { method: 'POST', body, signal })
}

export function listPayments(
  params: PageParams & { customerId?: number },
  signal: AbortSignal,
): Promise<RequestResult<Page<PaymentResponse>>> {
  return request<Page<PaymentResponse>>(DEMO_BASE, '/api/payments', {
    query: { ...params },
    signal,
  })
}
