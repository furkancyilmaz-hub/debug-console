import { useMemo } from 'react'
import type { Dispatch } from 'react'
import { useRequestLog } from '../crud/requestLogContext'
import { analysisRange } from '../crud/requestLogView'
import { RANGE_PRESETS, defaultRange, rangeFromInstants } from './timeRange'
import type { RangeFormAction, RangeFormState } from './analysisForm'
import styles from './analysis.module.css'

interface TimeRangePickerProps {
  state: RangeFormState
  dispatch: Dispatch<RangeFormAction>
  disabled: boolean
}

/**
 * Analiz aralığı. Girdiler yerel saat gösterir, sözleşmeye ISO gider
 * (`timeRange.ts`).
 *
 * "Son isteklerimi kapsa" aralığı denetçinin kayıtlarından kurar — kullanıcı
 * demo sırasında saat hesaplamakla uğraşmasın (SP003). Aralığı hesaplayan
 * `analysisRange` denetçideki düğmeyle ortak: yalnızca hedef servis çağrılarını
 * sayar, iki uçtan birer dakika pay bırakır.
 */
export function TimeRangePicker({ state, dispatch, disabled }: TimeRangePickerProps) {
  const { entries } = useRequestLog()

  const covered = useMemo(() => analysisRange(entries), [entries])
  const coveredCount = useMemo(
    () => entries.filter((entry) => entry.source === 'demo').length,
    [entries],
  )

  const cover = (): void => {
    if (covered === null) {
      return
    }
    const range = rangeFromInstants(covered.from, covered.to)
    if (range !== null) {
      dispatch({ type: 'covered', range })
    }
  }

  return (
    <div className={styles.picker}>
      <div className={styles.presets} role="group" aria-label="Hazır aralıklar">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.minutes}
            type="button"
            className={
              state.preset === preset.minutes
                ? `${styles.preset} ${styles.presetOn}`
                : styles.preset
            }
            aria-pressed={state.preset === preset.minutes}
            disabled={disabled}
            onClick={() =>
              dispatch({
                type: 'preset',
                minutes: preset.minutes,
                range: defaultRange(preset.minutes),
              })
            }
          >
            {preset.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.cover}
        disabled={disabled || covered === null}
        title={
          covered === null
            ? 'Henüz hedef servise istek atılmadı; CRUD ekranında birkaç sayfa gezin.'
            : undefined
        }
        onClick={cover}
      >
        Son isteklerimi kapsa
        {coveredCount > 0 && <span className={styles.coverCount}>{coveredCount} istek</span>}
      </button>

      <label className={styles.field}>
        <span>Başlangıç</span>
        <input
          type="datetime-local"
          value={state.from}
          disabled={disabled}
          onChange={(event) =>
            dispatch({ type: 'edited', field: 'from', value: event.target.value })
          }
          required
        />
      </label>

      <label className={styles.field}>
        <span>Bitiş</span>
        <input
          type="datetime-local"
          value={state.to}
          disabled={disabled}
          onChange={(event) => dispatch({ type: 'edited', field: 'to', value: event.target.value })}
          required
        />
      </label>
    </div>
  )
}
