import { computed, unref, type MaybeRef } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useBudgetStore } from '@/stores/budgets'
import type { Category, TransactionType } from '@/types'

export type CategorySelectMode =
  | 'all'
  | 'income'
  | 'expense-all'
  | 'expense-budgeted'
  | 'expense-unbudgeted'
  | 'all-with-budget'

export function useCategoryOptions(
  month: MaybeRef<number>,
  year: MaybeRef<number>
) {
  const txStore = useTransactionStore()
  const budgetStore = useBudgetStore()

  const budgetedCategoryIds = computed(() =>
    new Set(budgetStore.budgets.map(b => b.category_id))
  )

  function resolveMonth() {
    return unref(month)
  }

  function resolveYear() {
    return unref(year)
  }

  const BUDGET_MODES: CategorySelectMode[] = [
    'expense-budgeted',
    'expense-unbudgeted',
    'all-with-budget',
  ]

  async function ensureLoaded(mode?: CategorySelectMode) {
    if (!txStore.categories.length) {
      await txStore.fetchCategories()
    }
    if (mode && BUDGET_MODES.includes(mode)) {
      await budgetStore.fetchBudgets(resolveMonth(), resolveYear())
    }
  }

  function getOptions(
    mode: CategorySelectMode,
    excludeIds: string[] = [],
    includeId?: string | null
  ): Category[] {
    const exclude = new Set(excludeIds)
    const budgeted = budgetedCategoryIds.value
    const include = includeId ?? null

    const allow = (cat: Category) => {
      if (cat.id === include) return true
      if (exclude.has(cat.id)) return false
      return true
    }

    switch (mode) {
      case 'all':
        return txStore.categories.filter(allow)

      case 'income':
        return txStore.incomeCategories.filter(allow)

      case 'expense-budgeted':
        return txStore.expenseCategories.filter(
          cat => allow(cat) && (budgeted.has(cat.id) || cat.id === include)
        )

      case 'expense-unbudgeted':
        return txStore.expenseCategories.filter(
          cat => allow(cat) && !budgeted.has(cat.id)
        )

      case 'expense-all':
        return txStore.expenseCategories.filter(allow)

      case 'all-with-budget':
        return txStore.categories.filter(
          cat => allow(cat) && (budgeted.has(cat.id) || cat.id === include)
        )

      default:
        return txStore.categories.filter(allow)
    }
  }

  function getOptionsForType(
    type: TransactionType,
    excludeIds: string[] = [],
    includeId?: string | null
  ): Category[] {
    return type === 'income'
      ? getOptions('income', excludeIds, includeId)
      : getOptions('expense-all', excludeIds, includeId)
  }

  return {
    budgetedCategoryIds,
    ensureLoaded,
    getOptions,
    getOptionsForType,
    categories: computed(() => txStore.categories),
    incomeCategories: computed(() => txStore.incomeCategories),
    expenseCategories: computed(() => txStore.expenseCategories),
    budgetedExpenseCategories: computed(() =>
      getOptions('expense-budgeted')
    ),
  }
}
