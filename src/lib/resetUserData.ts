import { useTransactionStore } from '@/stores/transactions'
import { useBudgetStore } from '@/stores/budgets'
import { useLoanStore } from '@/stores/loans'

/** Clear all user-specific Pinia state (call on logout or account switch). */
export function resetUserData() {
  useTransactionStore().reset()
  useBudgetStore().reset()
  useLoanStore().reset()
}
