import { useCallback, useEffect, useReducer, useRef } from 'react'
import { isAbortError, toApiError } from '../api/client'
import type { ApiError } from '../api/client'

/**
 * Kullanıcının tetiklediği yazma/çalıştırma çağrıları. `useResource`'un aksine
 * kendiliğinden çalışmaz.
 *
 * Aynı yarış koruması burada da geçerli: art arda iki tetikleme olursa öncekinin
 * cevabı yok sayılır. Bileşen sökülürken uçan istek iptal edilir.
 */

export type MutationState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'running'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError }

type MutationAction<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: ApiError }
  | { type: 'reset' }

const initialState = { status: 'idle', data: null, error: null } as const

function reducer<T>(_state: MutationState<T>, action: MutationAction<T>): MutationState<T> {
  switch (action.type) {
    case 'start':
      return { status: 'running', data: null, error: null }
    case 'success':
      return { status: 'success', data: action.data, error: null }
    case 'error':
      return { status: 'error', data: null, error: action.error }
    case 'reset':
      return initialState
  }
}

export interface Mutation<TInput, TOutput> {
  state: MutationState<TOutput>
  /** Başarısızlıkta `null` döner; hata `state`'e yazılır, throw edilmez. */
  run: (input: TInput) => Promise<TOutput | null>
  reset: () => void
}

export function useMutation<TInput, TOutput>(
  mutator: (input: TInput, signal: AbortSignal) => Promise<TOutput>,
): Mutation<TInput, TOutput> {
  const [state, dispatch] = useReducer(
    reducer as (state: MutationState<TOutput>, action: MutationAction<TOutput>) => MutationState<TOutput>,
    initialState as MutationState<TOutput>,
  )

  const mutatorRef = useRef(mutator)
  useEffect(() => {
    mutatorRef.current = mutator
  })

  const seqRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const run = useCallback(async (input: TInput): Promise<TOutput | null> => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const seq = seqRef.current + 1
    seqRef.current = seq

    dispatch({ type: 'start' })
    try {
      const data = await mutatorRef.current(input, controller.signal)
      if (seq !== seqRef.current || !mountedRef.current) {
        return null
      }
      dispatch({ type: 'success', data })
      return data
    } catch (error) {
      if (isAbortError(error) || seq !== seqRef.current || !mountedRef.current) {
        return null
      }
      dispatch({ type: 'error', error: toApiError(error) })
      return null
    }
  }, [])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { state, run, reset }
}
