import type { AnalysisFailure, AnalysisWarning } from '../../hooks/useAnalysisStream'

/**
 * Hata metinleri tek yerde ve **ayrı ayrı**: "bir hata oluştu" yok. Her durum
 * kullanıcıya ne olduğunu ve ne yapabileceğini söylüyor.
 *
 * Adres/port yazılmıyor; backend adresleri yalnızca `api/` katmanının bilgisi.
 */

export interface NoticeText {
  label: string
  message: string
}

/**
 * Analizi bitirmeyen aksaklıklar. İkisinde de kurtarma yolu aynı: raporu elle
 * istemek — analiz sunucuda bitmiş olabilir.
 */
const WARNING_TEXT: Record<AnalysisWarning, NoticeText> = {
  'stream-lost': {
    label: 'akış koptu',
    message: 'Canlı bağlantı koptu. Analiz sunucuda sürüyor olabilir.',
  },
  stalled: {
    label: 'yanıt yok',
    message: 'Bir dakikadır yeni aşama gelmedi. Analiz takılmış olabilir.',
  },
}

export function warningText(warning: AnalysisWarning): NoticeText {
  return WARNING_TEXT[warning]
}

/**
 * Analizi bitiren hatalar. `start-failed` burada yok: onun mesajı agent'ın
 * kendi cevabından geliyor ve `ErrorBox` durum koduyla birlikte basıyor.
 */
export function failureText(failure: AnalysisFailure): NoticeText | null {
  switch (failure.kind) {
    case 'agent-down':
      return {
        label: 'bağlantı yok',
        message: 'Analiz agent\'ına ulaşılamadı. Servis ayakta mı?',
      }

    case 'agent-error':
      return { label: 'analiz başarısız', message: failure.message }

    case 'bad-report':
      return {
        label: 'okunamayan cevap',
        message:
          'Agent\'tan gelen rapor beklenen biçimde değil; ekrana yazılamadı.' +
          ' Analizi yeniden çalıştırmayı deneyin.',
      }

    case 'start-failed':
      return null
  }
}
