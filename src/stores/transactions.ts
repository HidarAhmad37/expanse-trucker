import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { requireUser } from '@/lib/requireUser'
import type { Transaction, Category, TransactionType, MonthlySummary, DailySpending } from '@/types'
import { BASE_CURRENCY } from '@/types'
import { getTransactionBaseAmount } from '@/utils/currency'
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns'

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)

  const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'))
  const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'))

  function reset() {
    transactions.value = []
    categories.value = []
    loading.value = false
  }

  async function fetchCategories() {
    const { user, error: authError } = await requireUser()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (!error && data) categories.value = data
    return { data, error }
  }

  async function addCategory(category: {
    name: string
    type: TransactionType
    color: string
    icon?: string
  }) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: category.name.trim(),
        type: category.type,
        color: category.color,
        icon: category.icon ?? 'tag',
      })
      .select('*')
      .single()

    if (data) {
      categories.value = [...categories.value, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    }
    return { data, error }
  }

  async function updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'type'>>
  ) {
    const { user, error: authError } = await requireUser()
    if (authError) return { data: null, error: authError }

    const payload = { ...updates }
    if (payload.name) payload.name = payload.name.trim()

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (data) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) categories.value[index] = data
      categories.value.sort((a, b) => a.name.localeCompare(b.name))
    }
    return { data, error }
  }

  async function deleteCategory(id: string) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) categories.value = categories.value.filter(c => c.id !== id)
    return { error }
  }

  async function fetchTransactions(startDate?: string, endDate?: string) {
    const { user, error: authError } = await requireUser()
    if (authError) {
      transactions.value = []
      return { data: null, error: authError }
    }

    loading.value = true
    let query = supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query
    if (!error && data) transactions.value = data
    loading.value = false
    return { data, error }
  }

  async function addTransaction(transaction: {
    category_id: string | null
    amount: number
    currency: string
    exchange_rate: number
    type: TransactionType
    description?: string
    date: string
  }) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select('*, category:categories(*)')
      .single()

    if (data) transactions.value.unshift(data)
    return { data, error }
  }

  function prependTransaction(transaction: Transaction) {
    const exists = transactions.value.some(t => t.id === transaction.id)
    if (!exists) transactions.value.unshift(transaction)
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    const { user, error: authError } = await requireUser()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:categories(*)')
      .single()

    if (data) {
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) transactions.value[index] = data
    }
    return { data, error }
  }

  async function deleteTransaction(id: string) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) transactions.value = transactions.value.filter(t => t.id !== id)
    return { error }
  }

  function getMonthlySummary(year: number, month: number): MonthlySummary {
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(start)
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')

    const monthTransactions = transactions.value.filter(
      t => t.date >= startStr && t.date <= endStr
    )

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + getTransactionBaseAmount(t), 0)

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + getTransactionBaseAmount(t), 0)

    const categoryTotals = new Map<string, { category: Category; amount: number }>()
    monthTransactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        const key = t.category_id!
        const base = getTransactionBaseAmount(t)
        const existing = categoryTotals.get(key)
        if (existing) {
          existing.amount += base
        } else {
          categoryTotals.set(key, { category: t.category!, amount: base })
        }
      })

    const byCategory = Array.from(categoryTotals.values())
      .map(item => ({
        ...item,
        percentage: expenses > 0 ? (item.amount / expenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    return { income, expenses, balance: income - expenses, byCategory }
  }

  function getDailySpending(year: number, month: number): DailySpending[] {
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(start)
    const days = eachDayOfInterval({ start, end })

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const amount = transactions.value
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + getTransactionBaseAmount(t), 0)
      return { date: dateStr, amount }
    })
  }

  function getTopExpenses(limit = 5) {
    return transactions.value
      .filter(t => t.type === 'expense')
      .sort((a, b) => getTransactionBaseAmount(b) - getTransactionBaseAmount(a))
      .slice(0, limit)
  }

  return {
    transactions,
    categories,
    loading,
    expenseCategories,
    incomeCategories,
    reset,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchTransactions,
    addTransaction,
    prependTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySummary,
    getDailySpending,
    getTopExpenses,
    getTransactionBaseAmount,
    baseCurrency: BASE_CURRENCY,
  }
})
