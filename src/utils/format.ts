import { CURRENCIES, BASE_CURRENCY, DEFAULT_CURRENCY } from '@/types'
import { toBaseAmount, normalizeExchangeRate } from './currency'

export function formatCurrency(amount: number, currencyCode = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode)
  const symbol = currency?.symbol ?? '$'

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  const prefix = amount < 0 ? '-' : ''
  return `${prefix}${symbol}${formatted}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'long' })
}

export function getPercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/** Format amount in base currency (AFN) */
export function formatBase(amount: number): string {
  return formatCurrency(amount, BASE_CURRENCY)
}

/** Show original amount + AFN equivalent when currency differs */
export function formatMoneyWithBase(
  amount: number,
  currency: string,
  exchangeRate: number
): { primary: string; secondary: string | null } {
  const rate = normalizeExchangeRate(currency, exchangeRate)
  const primary = formatCurrency(amount, currency)

  if (currency === BASE_CURRENCY) {
    return { primary, secondary: null }
  }

  const base = toBaseAmount(amount, rate)
  return { primary, secondary: `≈ ${formatBase(base)}` }
}
