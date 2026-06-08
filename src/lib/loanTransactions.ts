import { format } from 'date-fns'
import { supabase } from './supabase'
import type { Loan, Transaction, TransactionType } from '@/types'

const LOAN_INCOME_CATEGORY = 'Loan Collection'
const LOAN_EXPENSE_CATEGORY = 'Loan Repayment'

async function getOrCreateLoanCategory(type: TransactionType) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated') }

  const name = type === 'income' ? LOAN_INCOME_CATEGORY : LOAN_EXPENSE_CATEGORY
  const { data: existing } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', name)
    .maybeSingle()

  if (existing) return { data: existing, error: null }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      type,
      icon: type === 'income' ? 'hand-coins' : 'banknote',
      color: type === 'income' ? '#10b981' : '#ef4444',
    })
    .select('*')
    .single()

  return { data, error }
}

export async function createLoanPaymentTransaction(
  loan: Loan,
  amount: number,
  date?: string
): Promise<{ data: Transaction | null; error: Error | null }> {
  if (amount <= 0) return { data: null, error: null }

  const txType: TransactionType = loan.type === 'lent' ? 'income' : 'expense'
  const { data: category, error: catError } = await getOrCreateLoanCategory(txType)
  if (catError || !category) {
    return { data: null, error: catError ?? new Error('Could not resolve loan category') }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const description =
    loan.type === 'lent'
      ? `Loan repayment received from ${loan.person_name}`
      : `Loan repayment paid to ${loan.person_name}`

  const payload: Record<string, unknown> = {
    user_id: user.id,
    category_id: category.id,
    amount,
    currency: loan.currency ?? 'AFN',
    exchange_rate: Number(loan.exchange_rate ?? 1),
    type: txType,
    description: loan.description ? `${description} — ${loan.description}` : description,
    date: date ?? format(new Date(), 'yyyy-MM-dd'),
    loan_id: loan.id,
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select('*, category:categories(*)')
    .single()

  if (error) {
    // loan_id column may not exist yet — retry without it
    if (String(error.message).includes('loan_id')) {
      delete payload.loan_id
      const retry = await supabase
        .from('transactions')
        .insert(payload)
        .select('*, category:categories(*)')
        .single()
      return {
        data: retry.data,
        error: retry.error ? new Error(retry.error.message) : null,
      }
    }
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}
