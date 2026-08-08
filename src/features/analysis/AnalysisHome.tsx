import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Panel } from '../../components/Panel'
import { Loading } from '../../components/Loading'
import { ErrorBox } from '../../components/ErrorBox'
import { Empty } from '../../components/Empty'
import { useAnalysis } from './analysisContext'
import { StageTimeline } from './StageTimeline'
import { ReportSummary } from './ReportSummary'
import { defaultRange, rangeFromParams, toInstant } from './timeRange'
import styles from './analysis.module.css'

/**
 * Analiz ekranı. Aralık seçilir, agent çalıştırılır, aşamalar SSE ile akar.
 *
 * Durum `AnalysisProvider`'da tutuluyor: CRUD sekmesine geçip dönmek analizi
 * kaybettirmez. `analysisId` adreste de durduğu için yenileme ve paylaşılan
 * bağlantı çalışır.
 *
 * Aralık adresten de gelebilir: denetçinin "bu istekleri analiz et" düğmesi
 * `?from=…&to=…` yazıyor. Analiz kendiliğinden başlamaz, yalnızca form dolar.
 */
export function AnalysisHome() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { state, start, adopt, refreshReport, reset } = useAnalysis()
  const [range, setRange] = useState(() => rangeFromParams(searchParams) ?? defaultRange())
  const [formError, setFormError] = useState<string | null>(null)

  // Adres ve durum tek yöne değil, iki yöne de eşitleniyor: adresteki id
  // devralınır; durumdaki id adreste yoksa adres yazılır.
  useEffect(() => {
    if (analysisId !== undefined) {
      if (analysisId !== state.analysisId) {
        adopt(analysisId)
      }
      return
    }
    if (state.analysisId !== null) {
      // `search` korunuyor; yoksa adrese id yazılırken denetçiden gelen aralık
      // düşer ve sayfa yenilenince form varsayılana dönerdi.
      navigate(
        { pathname: `/analysis/${state.analysisId}`, search: location.search },
        { replace: true },
      )
    }
  }, [analysisId, state.analysisId, adopt, navigate, location.search])

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const from = toInstant(range.from)
    const to = toInstant(range.to)

    if (from === null || to === null) {
      setFormError('Başlangıç ve bitiş zamanı geçerli olmalı.')
      return
    }
    if (from >= to) {
      setFormError('Başlangıç, bitişten önce olmalı.')
      return
    }

    setFormError(null)
    const started = await start(from, to)
    if (started !== null) {
      navigate(`/analysis/${started}`)
    }
  }

  const running = state.phase === 'starting' || state.phase === 'running'

  return (
    <div className={styles.screen}>
      <Panel
        title="Analiz aralığı"
        description="Seçilen aralıktaki trafik agent tarafından incelenir."
        actions={
          state.analysisId !== null ? (
            <button
              type="button"
              onClick={() => {
                reset()
                navigate('/analysis', { replace: true })
              }}
            >
              Temizle
            </button>
          ) : undefined
        }
      >
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <label className={styles.field}>
            <span>Başlangıç</span>
            <input
              type="datetime-local"
              value={range.from}
              onChange={(event) => setRange({ ...range, from: event.target.value })}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Bitiş</span>
            <input
              type="datetime-local"
              value={range.to}
              onChange={(event) => setRange({ ...range, to: event.target.value })}
              required
            />
          </label>
          <button type="submit" disabled={running}>
            {running ? 'Çalışıyor…' : 'Analizi başlat'}
          </button>
        </form>

        {formError !== null && <p className={styles.warning}>{formError}</p>}
        {state.error !== null && <ErrorBox error={state.error} />}
      </Panel>

      <Panel
        title="Aşamalar"
        description={state.analysisId !== null ? `analiz ${state.analysisId}` : undefined}
      >
        {state.streamError !== null && <p className={styles.warning}>{state.streamError}</p>}
        <StageTimeline events={state.events} />
      </Panel>

      <Panel
        title="Rapor"
        actions={
          state.analysisId !== null ? (
            <button type="button" onClick={refreshReport}>
              Raporu getir
            </button>
          ) : undefined
        }
      >
        {state.report !== null ? (
          <ReportSummary report={state.report} />
        ) : running ? (
          <Loading label="Analiz sürüyor…" />
        ) : (
          <Empty title="Rapor yok" hint="Bir aralık seçip analizi başlat." />
        )}
      </Panel>
    </div>
  )
}
