import { useReducer, useRef } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '../../components/Breadcrumb'
import { ErrorBox } from '../../components/ErrorBox'
import { FormField } from '../../components/FormField'
import { fieldAria, focusField } from '../../components/field'
import { PageHead } from '../../components/PageHead'
import { Panel } from '../../components/Panel'
import { Spinner } from '../../components/Spinner'
import { createProposal } from '../../api/demoApi'
import { useMutation } from '../../hooks/useMutation'
import {
  INITIAL_PROPOSAL_FORM,
  errorFor,
  proposalFormReducer,
  serverFieldErrors,
  toCreateRequest,
  validateAll,
} from './proposalForm'
import type { ProposalField } from './proposalForm'
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABEL } from './status'
import styles from './crud.module.css'

/**
 * Yeni teklif formu.
 *
 * Alan bazlı doğrulama elle: `blur`'da tek alan, submit'te hepsi. Sunucudan
 * dönen 4xx aynı yere düşüyor — kullanıcı hatayı hep ilgili input'un altında
 * görüyor.
 */

export function ProposalFormPage() {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(proposalFormReducer, INITIAL_PROPOSAL_FORM)
  const { state: mutation, run, reset } = useMutation(createProposal)

  // Butonun `disabled`'ı ancak yeniden render'dan sonra etkili; aynı tık
  // turunda gelen ikinci gönderimi bu senkron kilit durduruyor.
  const submitting = useRef(false)

  const saving = mutation.status === 'running'
  // Sunucu hatası state'e kopyalanmıyor; her render'da cevaptan türetiliyor.
  const serverErrors = mutation.status === 'error' ? serverFieldErrors(mutation.error) : []
  const generalError =
    mutation.status === 'error' && serverErrors.length === 0 ? mutation.error : null

  function messageFor(field: ProposalField): string | null {
    return (
      errorFor(state, field) ??
      serverErrors.find((error) => error.field === field)?.message ??
      null
    )
  }

  function handleChange(field: ProposalField, value: string) {
    // Kullanıcı yazmaya başlayınca sunucu hatası artık geçerli değil.
    if (mutation.status === 'error') {
      reset()
    }
    dispatch({ type: 'change', field, value })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || submitting.current) {
      return
    }

    dispatch({ type: 'submit' })
    const errors = validateAll(state.values)
    if (errors.length > 0) {
      focusField(errors[0].field)
      return
    }

    submitting.current = true
    try {
      const created = await run(toCreateRequest(state.values))
      if (created !== null) {
        // Liste yeniden monte olduğu için kendiliğinden tazeleniyor.
        navigate('/proposals')
      }
    } finally {
      submitting.current = false
    }
  }

  return (
    <div className={styles.screen}>
      <Breadcrumb items={[{ label: 'Teklifler', to: '/proposals' }, { label: 'Yeni teklif' }]} />
      <PageHead title="Yeni teklif" description="Teklif kaydı oluştur" />

      <Panel title="Teklif bilgileri">
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {generalError !== null && <ErrorBox error={generalError} />}

          <FormField field="proposalNo" label="Teklif no" error={messageFor('proposalNo')}>
            <input
              {...fieldAria('proposalNo', messageFor('proposalNo'))}
              type="text"
              value={state.values.proposalNo}
              placeholder="TEK-2026-000013"
              disabled={saving}
              onChange={(event) => handleChange('proposalNo', event.target.value)}
              onBlur={() => dispatch({ type: 'blur', field: 'proposalNo' })}
            />
          </FormField>

          <FormField field="status" label="Durum" error={messageFor('status')}>
            <select
              {...fieldAria('status', messageFor('status'))}
              value={state.values.status}
              disabled={saving}
              onChange={(event) => handleChange('status', event.target.value)}
              onBlur={() => dispatch({ type: 'blur', field: 'status' })}
            >
              {PROPOSAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PROPOSAL_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField field="issueDate" label="Düzenleme tarihi" error={messageFor('issueDate')}>
            <input
              {...fieldAria('issueDate', messageFor('issueDate'))}
              type="date"
              value={state.values.issueDate}
              disabled={saving}
              onChange={(event) => handleChange('issueDate', event.target.value)}
              onBlur={() => dispatch({ type: 'blur', field: 'issueDate' })}
            />
          </FormField>

          <FormField field="totalPremium" label="Toplam prim" error={messageFor('totalPremium')}>
            <input
              {...fieldAria('totalPremium', messageFor('totalPremium'))}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={state.values.totalPremium}
              placeholder="12500"
              disabled={saving}
              onChange={(event) => handleChange('totalPremium', event.target.value)}
              onBlur={() => dispatch({ type: 'blur', field: 'totalPremium' })}
            />
          </FormField>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving && <Spinner />}
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <Link className={styles.secondary} to="/proposals">
              Vazgeç
            </Link>
          </div>
        </form>
      </Panel>
    </div>
  )
}
