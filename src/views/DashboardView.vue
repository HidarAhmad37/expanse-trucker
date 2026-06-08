<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useBudgetStore } from '@/stores/budgets'
import { useLoanStore } from '@/stores/loans'
import { useAuthStore } from '@/stores/auth'
import { format, getDaysInMonth } from 'date-fns'
import BalanceCard from '@/components/dashboard/BalanceCard.vue'
import NetPositionCard from '@/components/dashboard/NetPositionCard.vue'
import CategoryChart from '@/components/dashboard/CategoryChart.vue'
import SpendingChart from '@/components/dashboard/SpendingChart.vue'
import BudgetProgress from '@/components/dashboard/BudgetProgress.vue'
import InsightCard from '@/components/dashboard/InsightCard.vue'
import TransactionList from '@/components/transactions/TransactionList.vue'
import Modal from '@/components/ui/Modal.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import { Plus, ChevronLeft, ChevronRight } from '@lucide/vue'

const txStore = useTransactionStore()
const budgetStore = useBudgetStore()
const loanStore = useLoanStore()
const auth = useAuthStore()

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const showAddModal = ref(false)

const summary = computed(() =>
  txStore.getMonthlySummary(selectedYear.value, selectedMonth.value)
)

const dailySpending = computed(() =>
  txStore.getDailySpending(selectedYear.value, selectedMonth.value)
)

const recentTransactions = computed(() =>
  txStore.transactions.slice(0, 5)
)

const spentByCategory = computed(() => {
  const map = new Map<string, number>()
  summary.value.byCategory.forEach(item => {
    map.set(item.category.id, item.amount)
  })
  return map
})

const monthLabel = computed(() =>
  new Date(selectedYear.value, selectedMonth.value - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
)

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
  loadData()
}

function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
  loadData()
}

async function loadData() {
  const start = format(new Date(selectedYear.value, selectedMonth.value - 1, 1), 'yyyy-MM-dd')
  const end = format(new Date(selectedYear.value, selectedMonth.value, 0), 'yyyy-MM-dd')
  await Promise.all([
    txStore.fetchTransactions(start, end),
    budgetStore.fetchBudgets(selectedMonth.value, selectedYear.value),
    loanStore.fetchLoans(),
  ])
}

onMounted(async () => {
  await txStore.fetchCategories()
  await loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-100">
          Hey, {{ auth.profile?.full_name?.split(' ')[0] ?? 'there' }} 👋
        </h1>
        <p class="text-surface-500 mt-1">Here's where your money is going</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 glass rounded-xl px-2 py-1">
          <button class="p-2 rounded-lg hover:bg-surface-700 transition-colors" @click="prevMonth">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm font-medium px-2 min-w-[140px] text-center">{{ monthLabel }}</span>
          <button class="p-2 rounded-lg hover:bg-surface-700 transition-colors" @click="nextMonth">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        <button class="btn-primary flex items-center gap-2" @click="showAddModal = true">
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">Add</span>
        </button>
      </div>
    </div>

    <!-- Balance + Net Position -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BalanceCard
        :balance="summary.balance"
        :income="summary.income"
        :expenses="summary.expenses"
      />
      <NetPositionCard
        :cash-balance="summary.balance"
        :borrowed-outstanding="loanStore.summary.borrowedOutstanding"
        :lent-outstanding="loanStore.summary.lentOutstanding"
        :net-loan-position="loanStore.summary.netLoanPosition"
      />
    </div>

    <!-- Insights -->
    <InsightCard
      :summary="summary"
      :days-in-month="getDaysInMonth(new Date(selectedYear, selectedMonth - 1))"
      :current-day="now.getMonth() + 1 === selectedMonth && now.getFullYear() === selectedYear
        ? now.getDate()
        : getDaysInMonth(new Date(selectedYear, selectedMonth - 1))"
    />

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoryChart :summary="summary" />
      <SpendingChart :daily-spending="dailySpending" />
    </div>

    <!-- Budget + Recent -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BudgetProgress
        :budgets="budgetStore.budgets"
        :spent-by-category="spentByCategory"
      />
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-surface-100">Recent Transactions</h3>
          <router-link to="/transactions" class="text-sm text-brand-400 hover:underline">
            View all
          </router-link>
        </div>
        <TransactionList
          v-if="recentTransactions.length"
          :transactions="recentTransactions"
        />
        <p v-else class="text-sm text-surface-500 text-center py-8">
          No transactions yet. Add your first one!
        </p>
      </div>
    </div>

    <Modal :show="showAddModal" title="Add Transaction" @close="showAddModal = false">
      <TransactionForm
        :budget-month="selectedMonth"
        :budget-year="selectedYear"
        @saved="showAddModal = false; loadData()"
        @cancel="showAddModal = false"
      />
    </Modal>
  </div>
</template>
