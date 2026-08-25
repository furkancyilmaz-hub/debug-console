import { useCallback, useReducer } from 'react'

/**
 * Sorgu kriterlerinin taslak/uygulanmış ayrımı. Kutulara **taslak** bağlanır,
 * isteğe yalnızca **uygulanmış** değer girer; ikisi "Sorgula" ile eşitlenir.
 *
 * Bu dosya nerede durduğunu bilmiyor: uygulanmış değeri çağıran veriyor
 * (`listParams.ts` adres çubuğundan, teklif detayı yerel state'ten) ve
 * `commit` ile geri alıyor.
 *
 * `useResource`'un deps dizisine taslak değil uygulanmış değer konur; fetcher
 * ref'te tutulduğu için gövde taslağı okusa bile istek tetiklenmez.
 */

/** Kriter alanlarının değerleri; hepsi string — kutulardan geldiği gibi. */
export type CriteriaValues<K extends string> = Readonly<Record<K, string>>

interface CriteriaState<K extends string> {
  draft: CriteriaValues<K>
  /** Taslağın tohumlandığı uygulanmış değerler. */
  base: CriteriaValues<K>
}

type CriteriaAction<K extends string> =
  | { type: 'edited'; name: K; value: string }
  | { type: 'synced'; applied: CriteriaValues<K> }

function keysOf<K extends string>(values: CriteriaValues<K>): K[] {
  return Object.keys(values) as K[]
}

function same<K extends string>(a: CriteriaValues<K>, b: CriteriaValues<K>): boolean {
  return keysOf(a).every((key) => a[key] === b[key])
}

/** Kırpılmış taslak: adrese ve isteğe boşluklu değer gitmesin. */
function trimmed<K extends string>(values: CriteriaValues<K>): CriteriaValues<K> {
  const next = {} as Record<K, string>
  for (const key of keysOf(values)) {
    next[key] = values[key].trim()
  }
  return next
}

function reducer<K extends string>(
  state: CriteriaState<K>,
  action: CriteriaAction<K>,
): CriteriaState<K> {
  switch (action.type) {
    case 'edited': {
      const draft = { ...state.draft } as Record<K, string>
      draft[action.name] = action.value
      return { ...state, draft }
    }
    case 'synced':
      return { draft: action.applied, base: action.applied }
  }
}

export interface CriteriaDraft<K extends string> {
  /** Kutulardaki ham değerler. */
  draft: CriteriaValues<K>
  set: (name: K, value: string) => void
  /** Taslağı kırpıp uygular. */
  submit: () => void
  /** Taslak uygulanandan farklı: yazıldı ama henüz sorgulanmadı. */
  pending: boolean
}

export function useCriteriaDraft<K extends string>(
  applied: CriteriaValues<K>,
  commit: (values: CriteriaValues<K>) => void,
): CriteriaDraft<K> {
  const [state, dispatch] = useReducer(
    reducer as (state: CriteriaState<K>, action: CriteriaAction<K>) => CriteriaState<K>,
    applied,
    (initial: CriteriaValues<K>): CriteriaState<K> => ({ draft: initial, base: initial }),
  )

  // Uygulanmış değer dışarıdan değişebiliyor: tarayıcının geri tuşu, ya da
  // submit'in kırptığı değerin kutuya dönmesi. Taslak onu izler.
  //
  // Eşitleme render sırasında yapılıyor; efekte bırakılsa bir kare boyunca eski
  // taslak görünürdü. Bu render'ın kendisi de `applied`'ı kullanıyor — dispatch
  // sonrası gelen render'ı beklemeye gerek yok.
  const stale = !same(state.base, applied)
  if (stale) {
    dispatch({ type: 'synced', applied })
  }
  const draft = stale ? applied : state.draft

  const set = useCallback((name: K, value: string) => {
    dispatch({ type: 'edited', name, value })
  }, [])

  return {
    draft,
    set,
    // Taslağa bağlı; her render'da yeniden kurulması gerekiyor, `useCallback`
    // burada bir şey kazandırmaz.
    submit: () => commit(trimmed(draft)),
    pending: keysOf(draft).some((key) => draft[key].trim() !== applied[key]),
  }
}
