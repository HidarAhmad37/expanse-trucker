import { BASE_CURRENCY } from '@/types'

/** Convert an amount in foreign currency to base currency (AFN). */
export function toBaseAmount(amount: number, exchangeRate: number): number {
  return amount * exchangeRate
}

export function normalizeExchangeRate(currency: string, rate: number): number {
  return currency === BASE_CURRENCY ? 1 : rate
}

export function getTransactionBaseAmount(tx: {
  amount: number
  currency?: string
  exchange_rate?: number
}): number {
  const rate = normalizeExchangeRate(tx.currency ?? BASE_CURRENCY, Number(tx.exchange_rate ?? 1))
  return toBaseAmount(Number(tx.amount), rate)
}

export function getLoanBaseAmount(loan: {
  amount: number
  amount_repaid: number
  currency?: string
  exchange_rate?: number
}, field: 'amount' | 'outstanding' | 'repaid'): number {
  const rate = normalizeExchangeRate(loan.currency ?? BASE_CURRENCY, Number(loan.exchange_rate ?? 1))
  const amount = Number(loan.amount)
  const repaid = Number(loan.amount_repaid)

  if (field === 'amount') return toBaseAmount(amount, rate)
  if (field === 'repaid') return toBaseAmount(repaid, rate)
  return toBaseAmount(amount - repaid, rate)
}
