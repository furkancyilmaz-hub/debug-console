import { defaultRange, rangeFromParams, toInstant } from './timeRange'
import type { LocalRange } from './timeRange'

/**
 * Aralık formunun durumu. Dört bilgi birbirine bağlı — iki uç, seçili hazır
 * aralık ve doğrulama hatası — bu yüzden ayrı `useState`'ler değil tek reducer.
 *
 * Hesap yok, saat yok: `Date` okumak çağıranın işi (`preset`/`covered` eylemleri
 * hazır aralığı taşır), reducer saf kalır.
 */

/** Varsayılan: son 15 dakika. */
const DEFAULT_MINUTES = 15

export interface RangeFormState extends LocalRange {
  /** Seçili hazır aralık; uçlar elle değişince düşer. */
  preset: number | null
  error: string | null
}

export type RangeFormAction =
  | { type: 'preset'; minutes: number; range: LocalRange }
  | { type: 'covered'; range: LocalRange }
  | { type: 'edited'; field: 'from' | 'to'; value: string }
  | { type: 'rejected'; message: string }
  | { type: 'accepted' }

/**
 * Adresteki `?from=…&to=…` varsa form onunla açılır (denetçinin "bu istekleri
 * analiz et" düğmesi), yoksa son 15 dakika. Analiz kendiliğinden başlamaz.
 */
export function initialRangeForm(params: URLSearchParams): RangeFormState {
  const fromParams = rangeFromParams(params)
  if (fromParams !== null) {
    return { ...fromParams, preset: null, error: null }
  }
  return { ...defaultRange(DEFAULT_MINUTES), preset: DEFAULT_MINUTES, error: null }
}

/**
 * Formu varsayılana döndüren eylem: son 15 dakika, hata yok. Ayrı bir eylem türü
 * gerekmiyor — `preset` zaten iki ucu da tazeliyor ve `error`'ı düşürüyor.
 */
export function defaultRangeAction(): RangeFormAction {
  return { type: 'preset', minutes: DEFAULT_MINUTES, range: defaultRange(DEFAULT_MINUTES) }
}

export function rangeFormReducer(state: RangeFormState, action: RangeFormAction): RangeFormState {
  switch (action.type) {
    case 'preset':
      return { ...action.range, preset: action.minutes, error: null }

    case 'covered':
      return { ...action.range, preset: null, error: null }

    case 'edited':
      // Elle düzenlenen aralık artık hazır aralık değil; rozet yalan söylemesin.
      return { ...state, [action.field]: action.value, preset: null, error: null }

    case 'rejected':
      return { ...state, error: action.message }

    case 'accepted':
      return { ...state, error: null }
  }
}

export interface ValidRange {
  /** ISO-8601 UTC — sözleşme §4 biçimi. */
  from: string
  to: string
}

/**
 * Formu sözleşmenin beklediği biçime çevirir. Başarısızlıkta hata **metni**
 * döner; hangi ucun bozuk olduğu kullanıcıya söylenir.
 */
export function validateRange(state: RangeFormState): ValidRange | string {
  const from = toInstant(state.from)
  const to = toInstant(state.to)

  if (from === null || to === null) {
    return 'Başlangıç ve bitiş zamanı geçerli olmalı.'
  }
  if (from >= to) {
    return 'Başlangıç, bitişten önce olmalı.'
  }
  return { from, to }
}
