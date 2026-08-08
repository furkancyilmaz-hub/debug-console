import { useEffect, useState } from 'react'

/**
 * Sayfayı yazdırma iletişimine gönderir; kullanıcı oradan "PDF olarak kaydet"
 * seçer.
 *
 * PDF üretimi bilerek tarayıcıya bırakıldı. Elle PDF yazmak Türkçe metinde
 * kırılıyor: standart PDF fontlarının WinAnsi kodlamasında `ş`, `ğ`, `ı`, `İ`
 * yok, font gömmeden rapor bozuk çıkardı. Tarayıcı bunu, satır sarmayı ve
 * sayfa bölmeyi zaten yapıyor — kütüphane de gerekmiyor.
 *
 * `printing` yazdırma boyunca `true`: çağıran bu sırada ekranı kâğıda
 * hazırlar, ör. katlanmış bölümleri açar. `window.print()` efektin içinde
 * çağrılıyor ki hazırlanan DOM ekrana yazıldıktan sonra yazdırılsın.
 */
export interface PrintJob {
  printing: boolean
  print: () => void
}

export function usePrintReport(documentTitle: string): PrintJob {
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (!printing) {
      return
    }

    // İnen dosyanın adı `document.title`'dan geliyor; yazdırma bitince
    // sekmenin başlığı geri alınıyor.
    const previousTitle = document.title
    const done = (): void => setPrinting(false)

    window.addEventListener('afterprint', done)
    document.title = documentTitle
    window.print()

    return () => {
      window.removeEventListener('afterprint', done)
      document.title = previousTitle
    }
  }, [printing, documentTitle])

  return { printing, print: () => setPrinting(true) }
}
