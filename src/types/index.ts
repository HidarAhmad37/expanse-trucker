export type TransactionType = 'income' | 'expense'
export type LoanType = 'borrowed' | 'lent'

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: TransactionType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  loan_id?: string | null
  amount: number
  currency: string
  exchange_rate: number
  type: TransactionType
  description: string | null
  date: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  category?: Category
}

export interface Loan {
  id: string
  user_id: string
  type: LoanType
  person_name: string
  amount: number
  amount_repaid: number
  currency: string
  exchange_rate: number
  description: string | null
  date: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface LoanSummary {
  totalBorrowed: number
  totalLent: number
  borrowedOutstanding: number
  lentOutstanding: number
  netLoanPosition: number
  activeBorrowedCount: number
  activeLentCount: number
}

export interface Profile {
  id: string
  full_name: string | null
  currency: string
  monthly_income: number | null
  created_at: string
  updated_at: string
}

export interface MonthlySummary {
  income: number
  expenses: number
  balance: number
  byCategory: { category: Category; amount: number; percentage: number }[]
}

export interface DailySpending {
  date: string
  amount: number
}

/** Base currency — all totals and reports are converted to AFN */
export const BASE_CURRENCY = 'AFN'
export const DEFAULT_CURRENCY = BASE_CURRENCY

export const CURRENCIES = [
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const
