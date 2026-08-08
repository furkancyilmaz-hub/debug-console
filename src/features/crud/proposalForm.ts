import type { ApiError } from '../../api/client'
import type { ProposalCreateRequest, ProposalStatus } from '../../api/types'
import { PROPOSAL_STATUSES } from './status'

/**
 * Yeni teklif formunun saf mantığı: doğrulama kuralları ve durum geçişleri.
 * React'ten bağımsız — bileşen yalnızca bunları çağırıyor.
 */

export interface FieldError {
  field: string
  message: string
}

export type ProposalField = 'proposalNo' | 'status' | 'issueDate' | 'totalPremium'

export const PROPOSAL_FIELDS: readonly ProposalField[] = [
  'proposalNo',
  'status',
  'issueDate',
  'totalPremium',
]

/** Girdiler metin olarak tutuluyor; sayıya çevirmek gönderimin işi. */
export interface ProposalFormValues {
  proposalNo: string
  status: string
  issueDate: string
  totalPremium: string
}

export interface ProposalFormState {
  values: ProposalFormValues
  errors: FieldError[]
  /** Hatası gösterilecek alanlar: blur olmuş ya da submit denenmiş olanlar. */
  touched: ProposalField[]
}

export type ProposalFormAction =
  | { type: 'change'; field: ProposalField; value: string }
  | { type: 'blur'; field: ProposalField }
  | { type: 'submit' }

const PROPOSAL_NO_MAX = 30
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const INITIAL_PROPOSAL_FORM: ProposalFormState = {
  values: { proposalNo: '', status: 'DRAFT', issueDate: '', totalPremium: '' },
  errors: [],
  touched: [],
}

/* ------------------------------------------------------------ doğrulama */

function checkProposalNo(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === '') {
    return 'Teklif no zorunlu.'
  }
  return trimmed.length > PROPOSAL_NO_MAX ? `En fazla ${PROPOSAL_NO_MAX} karakter.` : null
}

function checkStatus(value: string): string | null {
  return PROPOSAL_STATUSES.some((status) => status === value) ? null : 'Durum seçin.'
}

/** Ay ve gün taşmasını yakalar: `2026-02-31` biçime uyuyor ama tarih değil. */
function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function checkIssueDate(value: string): string | null {
  if (value === '') {
    return 'Düzenleme tarihi zorunlu.'
  }
  if (!DATE_PATTERN.test(value)) {
    return 'Tarih YYYY-AA-GG biçiminde olmalı.'
  }
  return isRealDate(value) ? null : 'Geçerli bir tarih değil.'
}

function checkTotalPremium(value: string): string | null {
  if (value.trim() === '') {
    return 'Toplam prim zorunlu.'
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return 'Sayı girin.'
  }
  return parsed > 0 ? null : 'Prim sıfırdan büyük olmalı.'
}

function check(values: ProposalFormValues, field: ProposalField): string | null {
  switch (field) {
    case 'proposalNo':
      return checkProposalNo(values.proposalNo)
    case 'status':
      return checkStatus(values.status)
    case 'issueDate':
      return checkIssueDate(values.issueDate)
    case 'totalPremium':
      return checkTotalPremium(values.totalPremium)
  }
}

export function validateField(values: ProposalFormValues, field: ProposalField): FieldError | null {
  const message = check(values, field)
  return message === null ? null : { field, message }
}

/** Alan sırasını korur: submit'te ilk hataya odaklanmak için gerekli. */
export function validateAll(values: ProposalFormValues): FieldError[] {
  return PROPOSAL_FIELDS.map((field) => validateField(values, field)).filter(
    (error): error is FieldError => error !== null,
  )
}

/* ------------------------------------------------------------- reducer */

function replaceError(errors: FieldError[], field: ProposalField, next: FieldError | null) {
  const rest = errors.filter((error) => error.field !== field)
  return next === null ? rest : [...rest, next]
}

export function proposalFormReducer(
  state: ProposalFormState,
  action: ProposalFormAction,
): ProposalFormState {
  switch (action.type) {
    case 'change': {
      const values = { ...state.values, [action.field]: action.value }
      // Alan bir kez gösterildiyse yazarken canlı doğrulanır: kullanıcı hatayı
      // düzeltirken mesajın kaybolduğunu görsün.
      const shown = state.touched.includes(action.field)
      return {
        values,
        errors: shown
          ? replaceError(state.errors, action.field, validateField(values, action.field))
          : replaceError(state.errors, action.field, null),
        touched: state.touched,
      }
    }
    case 'blur': {
      const touched = state.touched.includes(action.field)
        ? state.touched
        : [...state.touched, action.field]
      return {
        values: state.values,
        errors: replaceError(state.errors, action.field, validateField(state.values, action.field)),
        touched,
      }
    }
    case 'submit':
      return {
        values: state.values,
        errors: validateAll(state.values),
        touched: [...PROPOSAL_FIELDS],
      }
  }
}

/** Alanın gösterilecek hatası; henüz dokunulmamışsa sessiz kalır. */
export function errorFor(state: ProposalFormState, field: ProposalField): string | null {
  if (!state.touched.includes(field)) {
    return null
  }
  return state.errors.find((error) => error.field === field)?.message ?? null
}

/* -------------------------------------------------------- sunucu hatası */

/**
 * Sunucu doğrulama mesajlarının çoğu Türkçe geliyor (`boş değer olamaz`,
 * `boyut '0' ile '30' arasında olmalı`) ve olduğu gibi gösterilebiliyor.
 * Çeviri sözlüğünde yalnızca İngilizce kalan birkaçı var; geri kalanı
 * olduğu gibi geçer.
 */
const SERVER_MESSAGES: Record<string, string> = {
  'must be greater than or equal to 0': 'Değer sıfırdan küçük olamaz.',
}

/**
 * 4xx cevabını alan bazlı hataya çevirir. Tanınmayan alanlar dışarıda kalır;
 * bileşen onları `ErrorBox` ile gösterir.
 *
 * `POST /api/proposals`'ın tek 409'u yinelenen teklif no.
 */
export function serverFieldErrors(error: ApiError): FieldError[] {
  if (error.status === 409) {
    return [{ field: 'proposalNo', message: 'Bu teklif no zaten kayıtlı.' }]
  }

  return error.violations
    .filter((violation) => PROPOSAL_FIELDS.some((field) => field === violation.field))
    .map((violation) => ({
      field: violation.field,
      message: SERVER_MESSAGES[violation.message] ?? violation.message,
    }))
}

/* -------------------------------------------------------------- gönderim */

/** Doğrulamadan geçmiş değerler. Daraltma `as` ile değil arayarak yapılıyor. */
function toStatus(value: string): ProposalStatus {
  return PROPOSAL_STATUSES.find((candidate) => candidate === value) ?? 'DRAFT'
}

export function toCreateRequest(values: ProposalFormValues): ProposalCreateRequest {
  return {
    proposalNo: values.proposalNo.trim(),
    status: toStatus(values.status),
    issueDate: values.issueDate,
    totalPremium: Number(values.totalPremium),
  }
}
