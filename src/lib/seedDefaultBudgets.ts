import { supabase } from './supabase'

/** Default monthly budget limits in AFN per expense category */
export const DEFAULT_BUDGET_AMOUNTS: Record<string, number> = {
  'Food & Dining': 15000,
  'Transport': 5000,
  'Shopping': 8000,
  'Bills & Utilities': 10000,
  'Entertainment': 3000,
  'Health': 5000,
  'Education': 5000,
  'Subscriptions': 2000,
  'Other': 5000,
}

export async function seedDefaultBudgets(month: number, year: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated'), seeded: 0 }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('type', 'expense')

  if (catError) return { error: catError, seeded: 0 }
  if (!categories?.length) return { error: null, seeded: 0 }

  const { data: existing } = await supabase
    .from('budgets')
    .select('category_id')
    .eq('user_id', user.id)
    .eq('month', month)
    .eq('year', year)

  const existingIds = new Set(existing?.map(b => b.category_id) ?? [])

  const toInsert = categories
    .filter(cat => !existingIds.has(cat.id) && DEFAULT_BUDGET_AMOUNTS[cat.name])
    .map(cat => ({
      user_id: user.id,
      category_id: cat.id,
      amount: DEFAULT_BUDGET_AMOUNTS[cat.name]!,
      month,
      year,
    }))

  if (!toInsert.length) return { error: null, seeded: 0 }

  const { error } = await supabase.from('budgets').insert(toInsert)
  return { error, seeded: toInsert.length }
}
