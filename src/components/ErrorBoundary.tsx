import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Notice } from './Notice'

/**
 * Render sırasında atılan istisnaları yakalayan sınır.
 *
 * Yakalanmayan bir render hatası React'te tüm ağacı söküyor: kullanıcı boş
 * beyaz sayfa görüyor ve gezinme çubuğu bile kalmıyor. Sınır olmadan tek bir
 * bozuk alan bütün konsolu düşürüyor.
 *
 * Projedeki tek class bileşen — `getDerivedStateFromError` yalnızca class ile
 * çalışıyor, hook karşılığı yok.
 *
 * Bu son savunma hattı; asıl doğrulama `api/agentSchema` ile giriş kapısında
 * yapılıyor. Buraya düşen şey beklenmeyen bir kusurdur, bu yüzden metni de
 * genel: teşhis konsola yazılıyor, ekranda kullanıcının yapabileceği şey duruyor.
 */

type BoundaryScope = 'screen' | 'section'

interface BoundaryText {
  label: string
  message: string
}

const SCOPE_TEXT: Record<BoundaryScope, BoundaryText> = {
  screen: {
    label: 'ekran hatası',
    message:
      'Bu ekran çizilirken beklenmeyen bir hata oluştu.' +
      ' Tekrar deneyebilir ya da başka bir sekmeye geçebilirsiniz.',
  },
  section: {
    label: 'bölüm çizilemedi',
    message:
      'Bu bölüm çizilirken beklenmeyen bir hata oluştu.' +
      ' Ekranın geri kalanı çalışmaya devam ediyor.',
  },
}

interface ErrorBoundaryProps {
  children: ReactNode
  /** Metin kapsamı: tüm ekran mı, ekranın bir bölümü mü. */
  scope?: BoundaryScope
  /** Değeri değiştiğinde sınır kendiliğinden sıfırlanır (ör. yeni analiz id'si). */
  resetKey?: string | number | null
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hata yutulmuyor: ekranda kısa metin, konsolda yığın izi.
    console.error('Render hatası yakalandı:', error, info.componentStack)
  }

  componentDidUpdate(prev: ErrorBoundaryProps): void {
    if (prev.resetKey !== this.props.resetKey && this.state.error !== null) {
      this.setState({ error: null })
    }
  }

  // Aynı veri hâlâ bozuksa render yeniden patlar ve sınır tekrar devreye girer;
  // döngü olmaz, çünkü her deneme kullanıcının tıklamasıyla başlıyor.
  retry = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error === null) {
      return this.props.children
    }

    const text = SCOPE_TEXT[this.props.scope ?? 'section']
    return (
      <Notice
        tone="danger"
        label={text.label}
        message={text.message}
        actionLabel="Tekrar dene"
        onAction={this.retry}
      />
    )
  }
}
