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
