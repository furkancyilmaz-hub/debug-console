import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import { isAbortError, toApiError } from '../api/client'
import type { ApiError } from '../api/client'

/**
 * Veri çekmenin tek yolu. Bileşenlerde çıplak `fetch` yok.
 *
 * İki koruma birlikte çalışıyor:
 *  - her çalıştırmada yeni `AbortController`, temizlikte `abort()`
 *  - artan bir sıra numarası: geç dönen eski cevap state'e yazılmaz
 *
 * Sadece `abort()` yetmez — iptal edilmiş bir istek kimi zaman zaten çözülmüş
 * olur, o yüzden sıra numarası da gerekiyor.
 */

export type ResourceState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: T | null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError }

type ResourceAction<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: ApiError }

function reducer<T>(state: ResourceState<T>, action: ResourceAction<T>): ResourceState<T> {
  switch (action.type) {
    case 'start':
      // Yenilerken eldeki veri korunur; ekran boşalıp geri dolmaz. Zaten
      // yükleniyorken gelen ikinci istek de elde olanı düşürmez — hızlı filtre
      // değişiminde tablo yapısı yerinde kalsın.
      return { status: 'loading', data: state.data, error: null }
    case 'success':
      return { status: 'success', data: action.data, error: null }
    case 'error':
      return { status: 'error', data: null, error: action.error }
  }
}

const initialState = { status: 'idle', data: null, error: null } as const

export interface Resource<T> {
  state: ResourceState<T>
  reload: () => void
}

export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): Resource<T> {
  const [state, dispatch] = useReducer(
    reducer as (state: ResourceState<T>, action: ResourceAction<T>) => ResourceState<T>,
    initialState as ResourceState<T>,
  )

  // Efekt yalnızca `deps` değişince çalışsın diye fetcher ref'te tutuluyor;
  // satır içi tanımlanan bir fonksiyon her render'da yeni kimlik alır.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const seqRef = useRef(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const seq = seqRef.current + 1
    seqRef.current = seq

    dispatch({ type: 'start' })
    fetcherRef.current(controller.signal).then(
      (data) => {
        if (seq === seqRef.current) {
          dispatch({ type: 'success', data })
        }
      },
      (error: unknown) => {
        if (isAbortError(error) || seq !== seqRef.current) {
          return
        }
        dispatch({ type: 'error', error: toApiError(error) })
      },
    )

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])

  return { state, reload }
}
