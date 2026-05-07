export type Currency = 'USD' | 'EUR' | 'RSD'

const LEFT_SYMBOL: Record<Currency, string | null> = {
  USD: '$',
  EUR: null,
  RSD: null,
}

const RIGHT_SYMBOL: Record<Currency, string | null> = {
  USD: null,
  EUR: '€',
  RSD: 'RSD',
}

export function formatCurrency(amount: number | string, currency: Currency = 'USD'): string {
  const n = Number(amount).toFixed(2)
  const left = LEFT_SYMBOL[currency]
  const right = RIGHT_SYMBOL[currency]
  if (left) return `${left}${n}`
  return `${n} ${right}`
}
