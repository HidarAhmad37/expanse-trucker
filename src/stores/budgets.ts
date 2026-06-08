import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { requireUser } from '@/lib/requireUser'
import type { Budget } from '@/types'

export const useBudgetStore = defineStore('budgets', () => {
  const budgets = ref<Budget[]>([])
  const loading = ref(false)

  function reset() {
    budgets.value = []
    loading.value = false
  }

  async function fetchBudgets(month: number, year: number) {
    const { user, error: authError } = await requireUser()
    if (authError) {
      budgets.value = []
      return { data: null, error: authError }
    }

    loading.value = true
    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: true })

    if (!error && data) budgets.value = data
    loading.value = false
    return { data, error }
  }

  async function addBudget(budget: {
    category_id: string
    amount: number
    month: number
    year: number
  }) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...budget, user_id: user.id })
      .select('*, category:categories(*)')
      .single()

    if (data) budgets.value.push(data)
    return { data, error }
  }

  async function updateBudget(id: string, updates: {
    category_id?: string
    amount?: number
    month?: number
    year?: number
  }) {
    const { user, error: authError } = await requireUser()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:categories(*)')
      .single()

    if (data) {
      const index = budgets.value.findIndex(b => b.id === id)
      if (index !== -1) budgets.value[index] = data
    }
    return { data, error }
  }

  async function upsertBudget(budget: {
    category_id: string
    amount: number
    month: number
    year: number
  }) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        { ...budget, user_id: user.id },
        { onConflict: 'user_id,category_id,month,year' }
      )
      .select('*, category:categories(*)')
      .single()

    if (data) {
      const index = budgets.value.findIndex(b => b.id === data.id)
      if (index !== -1) {
        budgets.value[index] = data
      } else {
        budgets.value.push(data)
      }
    }
    return { data, error }
  }

  async function deleteBudget(id: string) {
    const { user, error: authError } = await requireUser()
    if (authError) return { error: authError }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) budgets.value = budgets.value.filter(b => b.id !== id)
    return { error }
  }

  return {
    budgets,
    loading,
    reset,
    fetchBudgets,
    addBudget,
    updateBudget,
    upsertBudget,
    deleteBudget,
  }
})
