import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { createLoanPaymentTransaction } from '@/lib/loanTransactions'
import { useTransactionStore } from '@/stores/transactions'
import type { Loan, LoanType, LoanSummary } from '@/types'
import { getLoanBaseAmount } from '@/utils/currency'

export const useLoanStore = defineStore('loans', () => {
  const loans = ref<Loan[]>([])
  const loading = ref(false)

  const borrowedLoans = computed(() => loans.value.filter(l => l.type === 'borrowed'))
  const lentLoans = computed(() => loans.value.filter(l => l.type === 'lent'))

  function getOutstanding(loan: Loan) {
    return Number(loan.amount) - Number(loan.amount_repaid)
  }

  function getOutstandingBase(loan: Loan) {
    return getLoanBaseAmount(loan, 'outstanding')
  }

  function isPaid(loan: Loan) {
    return Number(loan.amount_repaid) >= Number(loan.amount)
  }

  const summary = computed<LoanSummary>(() => {
    let borrowedOutstanding = 0
    let lentOutstanding = 0
    let activeBorrowedCount = 0
    let activeLentCount = 0

    loans.value.forEach(loan => {
      const outstanding = getOutstanding(loan)
      if (outstanding <= 0) return

      const outstandingBase = getOutstandingBase(loan)
      if (loan.type === 'borrowed') {
        borrowedOutstanding += outstandingBase
        activeBorrowedCount++
      } else {
        lentOutstanding += outstandingBase
        activeLentCount++
      }
    })

    return {
      totalBorrowed: borrowedLoans.value.reduce((s, l) => s + getLoanBaseAmount(l, 'amount'), 0),
      totalLent: lentLoans.value.reduce((s, l) => s + getLoanBaseAmount(l, 'amount'), 0),
      borrowedOutstanding,
      lentOutstanding,
      netLoanPosition: lentOutstanding - borrowedOutstanding,
      activeBorrowedCount,
      activeLentCount,
    }
  })

  async function syncPaymentToTransactions(
    loan: Loan,
    amount: number,
    date?: string
  ) {
    const { data, error } = await createLoanPaymentTransaction(loan, amount, date)
    if (error) return { error }

    if (data) {
      const txStore = useTransactionStore()
      txStore.prependTransaction(data)
      if (!txStore.categories.some(c => c.id === data.category_id)) {
        await txStore.fetchCategories()
      }
    }
    return { error: null }
  }

  async function fetchLoans() {
    loading.value = true
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) loans.value = data
    loading.value = false
    return { data, error }
  }

  async function addLoan(loan: {
    type: LoanType
    person_name: string
    amount: number
    amount_repaid?: number
    currency: string
    exchange_rate: number
    description?: string
    date: string
    due_date?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const amountRepaid = loan.amount_repaid ?? 0
    const { data, error } = await supabase
      .from('loans')
      .insert({ ...loan, user_id: user.id, amount_repaid: amountRepaid })
      .select()
      .single()

    if (data) {
      loans.value.unshift(data)
      if (amountRepaid > 0) {
        const txResult = await syncPaymentToTransactions(data, amountRepaid, loan.date)
        if (txResult.error) {
          return { data, error: txResult.error }
        }
      }
    }
    return { data, error }
  }

  async function updateLoan(
    id: string,
    updates: Partial<Loan>,
    options?: { paymentDate?: string }
  ) {
    const loan = loans.value.find(l => l.id === id)
    if (!loan) return { error: new Error('Loan not found') }

    const previousRepaid = Number(loan.amount_repaid)
    const { data, error } = await supabase
      .from('loans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (data) {
      const index = loans.value.findIndex(l => l.id === id)
      if (index !== -1) loans.value[index] = data

      if (updates.amount_repaid !== undefined) {
        const delta = Number(data.amount_repaid) - previousRepaid
        if (delta > 0) {
          const paymentDate = options?.paymentDate ?? format(new Date(), 'yyyy-MM-dd')
          const txResult = await syncPaymentToTransactions(data, delta, paymentDate)
          if (txResult.error) return { data, error: txResult.error }
        }
      }
    }
    return { data, error }
  }

  async function recordPayment(id: string, payment: number, date?: string) {
    const loan = loans.value.find(l => l.id === id)
    if (!loan) return { error: new Error('Loan not found') }

    const newRepaid = Math.min(Number(loan.amount_repaid) + payment, Number(loan.amount))
    if (newRepaid <= Number(loan.amount_repaid)) {
      return { error: new Error('Invalid payment amount') }
    }

    return updateLoan(id, { amount_repaid: newRepaid }, { paymentDate: date })
  }

  async function deleteLoan(id: string) {
    const { error } = await supabase.from('loans').delete().eq('id', id)
    if (!error) loans.value = loans.value.filter(l => l.id !== id)
    return { error }
  }

  return {
    loans,
    loading,
    borrowedLoans,
    lentLoans,
    summary,
    fetchLoans,
    addLoan,
    updateLoan,
    recordPayment,
    deleteLoan,
    getOutstanding,
    getOutstandingBase,
    isPaid,
  }
})
