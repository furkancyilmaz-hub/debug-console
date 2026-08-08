import { useEffect, useReducer } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Empty } from '../../components/Empty'
import { ErrorBox } from '../../components/ErrorBox'
import { Loading } from '../../components/Loading'
import { Notice } from '../../components/Notice'
import { Panel } from '../../components/Panel'
import { usePrintReport } from '../../hooks/usePrintReport'
import { useAnalysis } from './analysisContext'
import { ReportPanel } from './ReportPanel'
import { StageList } from './StageList'
import { TimeRangePicker } from './TimeRangePicker'
import { initialRangeForm, rangeFormReducer, validateRange } from './analysisForm'
import { failureText, warningText } from './failures'
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
  // Adres bir kez okunuyor; sonrası formun kendi durumu.
  const [form, dispatchForm] = useReducer(rangeFormReducer, searchParams, initialRangeForm)

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

    const range = validateRange(form)
    if (typeof range === 'string') {
      dispatchForm({ type: 'rejected', message: range })
      return
    }

    dispatchForm({ type: 'accepted' })
    const started = await start(range.from, range.to)
    if (started !== null) {
      navigate({ pathname: `/analysis/${started}`, search: location.search }, { replace: true })
    }
  }

  const running = state.phase === 'starting' || state.phase === 'running'
  const { failure, warning, report } = state
  const notice = failure === null ? null : failureText(failure)

  // İnen dosyanın adı buradan geliyor; analiz id'si raporu tanınır kılıyor.
  const printJob = usePrintReport(
    report === null ? 'n1-analizi' : `n1-analizi-${report.analysisId}`,
  )

  return (
    <div className={styles.screen}>
      {/* Aralık formu kâğıda gitmiyor: PDF raporun kendisi, kontrolleri değil.
          Aşamalar kalıyor — analizin gerçekten çalıştığının kanıtı. */}
      <div data-print="hide">
        <Panel
          title="N+1 analizi"
          description="Seçilen aralıktaki SELECT loglarından potansiyel N+1 desenleri."
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
            <TimeRangePicker state={form} dispatch={dispatchForm} disabled={running} />
            <button type="submit" className={styles.run} disabled={running}>
              {running ? 'Analiz sürüyor…' : 'Analiz et'}
            </button>
          </form>

          {form.error !== null && (
            <Notice tone="warn" label="geçersiz aralık" message={form.error} />
          )}

          {/* Agent'ın kendi cevabı varsa durum koduyla birlikte `ErrorBox`;
              durum kodu olmayan hatalar `Notice` ile. */}
          {failure !== null && failure.kind === 'start-failed' && (
            <ErrorBox error={failure.error} />
          )}
          {notice !== null && (
            <Notice tone="danger" label={notice.label} message={notice.message} />
          )}
        </Panel>
      </div>

      <Panel
        title="Aşamalar"
        description={state.analysisId !== null ? `analiz ${state.analysisId}` : undefined}
      >
        {warning !== null && (
          <Notice
            tone="warn"
            label={warningText(warning).label}
            message={warningText(warning).message}
            actionLabel="Raporu getir"
            onAction={refreshReport}
          />
        )}

        <StageList stages={state.stages} />
      </Panel>

      <Panel
        title="Rapor"
        actions={
          report !== null ? (
            <button type="button" onClick={printJob.print} data-print="hide">
              PDF indir
            </button>
          ) : undefined
        }
      >
        {report !== null ? (
          <ReportPanel report={report} printing={printJob.printing} />
        ) : running ? (
          <Loading label="Analiz sürüyor…" />
        ) : (
          <Empty title="Rapor yok" hint="Bir aralık seçip analizi başlatın." />
        )}
      </Panel>
    </div>
  )
}
