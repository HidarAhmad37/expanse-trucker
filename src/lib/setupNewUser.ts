import { supabase } from './supabase'

const DEFAULT_CATEGORIES = [
  { name: 'Salary', icon: 'briefcase', color: '#10b981', type: 'income' as const },
  { name: 'Freelance', icon: 'laptop', color: '#34d399', type: 'income' as const },
  { name: 'Other Income', icon: 'plus-circle', color: '#6ee7b7', type: 'income' as const },
  { name: 'Food & Dining', icon: 'utensils', color: '#ef4444', type: 'expense' as const },
  { name: 'Transport', icon: 'car', color: '#f97316', type: 'expense' as const },
  { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense' as const },
  { name: 'Bills & Utilities', icon: 'receipt', color: '#8b5cf6', type: 'expense' as const },
  { name: 'Entertainment', icon: 'film', color: '#06b6d4', type: 'expense' as const },
  { name: 'Health', icon: 'heart-pulse', color: '#14b8a6', type: 'expense' as const },
  { name: 'Education', icon: 'graduation-cap', color: '#3b82f6', type: 'expense' as const },
  { name: 'Subscriptions', icon: 'repeat', color: '#a855f7', type: 'expense' as const },
  { name: 'Other', icon: 'more-horizontal', color: '#6b7280', type: 'expense' as const },
]

export async function setupNewUser(fullName?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated') }

  const name = fullName ?? user.user_metadata?.full_name ?? ''

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: user.id, full_name: name })

    if (profileError) return { error: profileError }
  }

  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (!existingCategories?.length) {
    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(DEFAULT_CATEGORIES.map(cat => ({ ...cat, user_id: user.id })))

    if (categoriesError) return { error: categoriesError }
  }

  return { error: null }
}
