/**
 * Rotadaki sayısal kimlik. Adres elle yazılabildiği için değer güvenilmez;
 * geçersizse `null` döner ve ekran listeye yönlendirir.
 */
export function readId(value: string | undefined): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
