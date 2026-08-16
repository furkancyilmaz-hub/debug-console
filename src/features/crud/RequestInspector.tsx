import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from '../../components/Empty'
import { RequestRow } from './RequestRow'
import { useRequestLog } from './requestLogContext'
import {
  SLOW_MS,
  analysisRange,
  filterEntries,
  secondsLabel,
  slowestMs,
  summarize,
} from './requestLogView'
import styles from './RequestInspector.module.css'

/**
 * Alt denetçi paneli. Yalnızca dinler — kendisi hiç istek atmaz.
 *
 * Filtre, açık satır ve yükseklik burada; kayıtlar `RequestLogContext`'te.
 * Olay bazlı durum tek `useReducer`'da, beş ayrı `useState` değil.
 */

/** Mockup'taki `--dock`. */
const DEFAULT_HEIGHT = 210
const MIN_HEIGHT = 120
const RESIZE_STEP = 24
/** Bu kadar dibe yakınsa "aşağıda" sayılır ve otomatik kaydırma sürer. */
const STICK_SLACK = 8

interface InspectorState {
  collapsed: boolean
  slowOnly: boolean
  errorsOnly: boolean
  openId: number | null
  height: number
}

type Action =
  | { type: 'toggle-collapse' }
  | { type: 'toggle-slow' }
  | { type: 'toggle-errors' }
  | { type: 'toggle-detail'; id: number }
  | { type: 'resize'; height: number }
  | { type: 'cleared' }

const initialState: InspectorState = {
  collapsed: false,
  slowOnly: false,
  errorsOnly: false,
  openId: null,
  height: DEFAULT_HEIGHT,
}

function clampHeight(height: number): number {
  return Math.min(Math.max(height, MIN_HEIGHT), Math.round(window.innerHeight * 0.6))
}

function reducer(state: InspectorState, action: Action): InspectorState {
  switch (action.type) {
    case 'toggle-collapse':
      return { ...state, collapsed: !state.collapsed }

    case 'toggle-slow':
      return { ...state, slowOnly: !state.slowOnly }

    case 'toggle-errors':
      return { ...state, errorsOnly: !state.errorsOnly }

    case 'toggle-detail':
      // Aynı anda tek satır açık.
      return { ...state, openId: state.openId === action.id ? null : action.id }

    case 'resize':
      return { ...state, height: clampHeight(action.height) }

    case 'cleared':
      // Yükseklik ve açık/kapalı korunuyor: onlar yerleşim tercihi, veri değil.
      // Değişecek bir şey yoksa aynı referans dönüyor ki tetik bedava olsun.
      return state.slowOnly || state.errorsOnly || state.openId !== null
        ? { ...state, slowOnly: false, errorsOnly: false, openId: null }
        : state
  }
}

export function RequestInspector() {
  const { entries, clear } = useRequestLog()
  const [state, dispatch] = useReducer(reducer, initialState)
  const navigate = useNavigate()

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const stuckToBottom = useRef(true)
  const dragging = useRef(false)

  const visible = useMemo(
    () => filterEntries(entries, { slowOnly: state.slowOnly, errorsOnly: state.errorsOnly }),
    [entries, state.slowOnly, state.errorsOnly],
  )
  const slowest = useMemo(() => slowestMs(entries), [entries])
  const summary = useMemo(() => summarize(entries), [entries])
  const range = useMemo(() => analysisRange(entries), [entries])

  // Kaydırma tetiği son kaydın kimliği; uzunluk değil. Liste 50'ye dayandığında
  // uzunluk sabit kalıyor ama yeni kayıtlar gelmeye devam ediyor.
  const lastId = visible.length === 0 ? null : visible[visible.length - 1].id

  // Yeni kayıt geldiğinde sona kayar; kullanıcı yukarı kaydırdıysa zorlamaz.
  useEffect(() => {
    const body = bodyRef.current
    if (body === null || !stuckToBottom.current) {
      return
    }
    body.scrollTop = body.scrollHeight
  }, [lastId, state.collapsed])

  // Kayıt kalmayınca filtre ve açık satır anlamını yitiriyor. Liste yalnızca
  // temizlemeyle boşalıyor (kapasite budaması 50'de tutuyor), bu yüzden tetik
  // güvenli; mount'ta çalıştığında reducer aynı state'i döndürüp geri çekiliyor.
  // Böylece hem buradaki düğme hem analiz ekranındaki "Temizle" aynı sonucu verir.
  useEffect(() => {
    if (entries.length === 0) {
      dispatch({ type: 'cleared' })
    }
  }, [entries.length])

  const onBodyScroll = (): void => {
    const body = bodyRef.current
    if (body !== null) {
      stuckToBottom.current = body.scrollHeight - body.scrollTop - body.clientHeight < STICK_SLACK
    }
  }

  // Satırlar `memo`'lu; geri çağrının kimliği sabit kalmalı.
  const toggleDetail = useCallback((id: number) => dispatch({ type: 'toggle-detail', id }), [])

  // Sürükleme pointer capture ile: pencereye elle listener bağlanmıyor, bu yüzden
  // sökülürken temizlenecek bir şey de kalmıyor.
  const startDrag = (event: PointerEvent<HTMLDivElement>): void => {
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const drag = (event: PointerEvent<HTMLDivElement>): void => {
    if (dragging.current) {
      dispatch({ type: 'resize', height: window.innerHeight - event.clientY })
    }
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) {
      return
    }
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const resizeByKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return
    }
    event.preventDefault()
    const step = event.key === 'ArrowUp' ? RESIZE_STEP : -RESIZE_STEP
    dispatch({ type: 'resize', height: state.height + step })
  }

  const analyze = (): void => {
    if (range === null) {
      return
    }
    const search = new URLSearchParams({ from: range.from, to: range.to })
    navigate({ pathname: '/analysis', search: `?${search.toString()}` })
  }

  const filterClass = (active: boolean): string =>
    active ? `${styles.action} ${styles.actionOn}` : styles.action

  return (
    <section
      className={state.collapsed ? `${styles.dock} ${styles.dockCollapsed}` : styles.dock}
      style={state.collapsed ? undefined : { height: state.height }}
      aria-label="İstek denetçisi"
      data-print="hide"
    >
      {!state.collapsed && (
        <div
          className={styles.handle}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Panel yüksekliği"
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={resizeByKey}
        />
      )}

      <div className={styles.bar}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => dispatch({ type: 'toggle-collapse' })}
          aria-expanded={!state.collapsed}
        >
          <span className={styles.caret} aria-hidden="true">
            {state.collapsed ? '▶' : '▼'}
          </span>
          İstekler
        </button>

        <span className={styles.summary}>
          {summary.count === 0
            ? 'henüz istek yok'
            : `${summary.count} çağrı · ${secondsLabel(summary.totalMs)}`}
        </span>

        <div className={styles.actions}>
          <button
            type="button"
            className={filterClass(state.slowOnly)}
            onClick={() => dispatch({ type: 'toggle-slow' })}
            aria-pressed={state.slowOnly}
          >
            yalnızca yavaşlar
          </button>
          <button
            type="button"
            className={filterClass(state.errorsOnly)}
            onClick={() => dispatch({ type: 'toggle-errors' })}
            aria-pressed={state.errorsOnly}
          >
            yalnızca hatalar
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={clear}
            disabled={entries.length === 0}
          >
            temizle
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.primary}`}
            onClick={analyze}
            disabled={range === null}
          >
            bu istekleri analiz et
          </button>
        </div>
      </div>

      {!state.collapsed && (
        <div className={styles.body} ref={bodyRef} onScroll={onBodyScroll}>
          {visible.length === 0 ? (
            <Empty
              title={entries.length === 0 ? 'İstek yok' : 'Filtreye uyan istek yok'}
              hint={
                entries.length === 0
                  ? 'Ekranlarda gezinmeye başlayın.'
                  : `Kayıtların hiçbiri ${SLOW_MS} ms üstü ya da hatalı değil.`
              }
            />
          ) : (
            visible.map((entry) => (
              <RequestRow
                key={entry.id}
                entry={entry}
                slowest={slowest}
                open={state.openId === entry.id}
                onToggle={toggleDetail}
              />
            ))
          )}
        </div>
      )}
    </section>
  )
}
