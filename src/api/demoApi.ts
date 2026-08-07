import { DEMO_BASE } from './config'
import { request } from './client'
import type {
  CustomerResponse,
  Page,
  PageParams,
  PaymentResponse,
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
  return request<Page<ProposalResponse>>(DEMO_BASE, '/api/proposals', {
    query: { ...params },
    signal,
  })
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
