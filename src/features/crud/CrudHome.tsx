import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Panel } from '../../components/Panel'
import { Loading } from '../../components/Loading'
import { ErrorBox } from '../../components/ErrorBox'
import { Empty } from '../../components/Empty'
import { Skeleton } from '../../components/Skeleton'
import { useResource } from '../../hooks/useResource'
import { ENDPOINTS, findEndpoint } from './endpoints'
import { RequestInspector } from './RequestInspector'
import styles from './crud.module.css'

/**
 * Hedef servisin arayüzü. Kullanıcı gezdikçe trafik oluşur; ekran fazladan
 * istek atmaz.
 *
 * Seçili uç ve sayfa adres çubuğunda durur — yenileme ve paylaşılan bağlantı
 * aynı ekranı açar.
 */

function readNumber(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function CrudHome() {
  const [searchParams, setSearchParams] = useSearchParams()

  const endpoint = findEndpoint(searchParams.get('uc'))
  const page = readNumber(searchParams.get('sayfa'), 0)
  const size = readNumber(searchParams.get('boyut'), 20)

  const update = useCallback(
    (changes: Record<string, string>) => {
      const next = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(changes)) {
        next.set(key, value)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const { state, reload } = useResource(
    (signal) => endpoint.load({ page, size }, signal),
    [endpoint.id, page, size],
  )

  const pageData = state.data?.result.data ?? null

  return (
    <div className={styles.screen}>
      <Panel
        title="Uçlar"
        description="Bir uç seç; istek doğrudan hedef servise gider."
        actions={
          <button type="button" onClick={reload} disabled={state.status === 'loading'}>
            Yenile
          </button>
        }
      >
        <div className={styles.controls}>
          <label className={styles.field}>
            <span>Uç</span>
            <select
              value={endpoint.id}
              onChange={(event) => update({ uc: event.target.value, sayfa: '0' })}
            >
              {ENDPOINTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Sayfa</span>
            <input
              className={styles.number}
              type="number"
              min={0}
              value={page}
              onChange={(event) => update({ sayfa: event.target.value })}
            />
          </label>

          <label className={styles.field}>
            <span>Boyut</span>
            <input
              className={styles.number}
              type="number"
              min={1}
              max={200}
              value={size}
              onChange={(event) => update({ boyut: event.target.value })}
            />
          </label>
        </div>

        <p className={styles.note}>
          <code>
            {endpoint.method} {endpoint.path}
          </code>
        </p>
      </Panel>

      <Panel title="Sonuç" description={`${endpoint.label} · sayfa ${page}`}>
        {state.status === 'loading' && state.data === null && <Skeleton lines={5} />}
        {state.status === 'loading' && state.data !== null && <Loading />}
        {state.status === 'error' && <ErrorBox error={state.error} onRetry={reload} />}

        {state.status === 'success' && (
          <>
            <RequestInspector result={state.data.result} />

            {state.data.rows.length === 0 ? (
              <Empty title="Bu sayfada kayıt yok" hint="Sayfa numarasını küçültmeyi dene." />
            ) : (
              <ul className={styles.rows}>
                {state.data.rows.map((row) => (
                  <li key={row.id} className={styles.row}>
                    <span className={styles.rowId}>#{row.id}</span>
                    <span>{row.primary}</span>
                    <span className={styles.rowSecondary}>{row.secondary}</span>
                  </li>
                ))}
              </ul>
            )}

            {pageData !== null && (
              <p className={styles.pageInfo}>
                {pageData.numberOfElements} / {pageData.totalElements} kayıt · sayfa{' '}
                {pageData.number + 1}/{pageData.totalPages}
              </p>
            )}

            <pre className={styles.raw}>{JSON.stringify(state.data.result.data, null, 2)}</pre>
          </>
        )}
      </Panel>
    </div>
  )
}
