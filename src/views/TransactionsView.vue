<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import TransactionList from '@/components/transactions/TransactionList.vue'
import Modal from '@/components/ui/Modal.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import CategorySelect from '@/components/ui/CategorySelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useCategoryOptions } from '@/composables/useCategoryOptions'
import { usePagination } from '@/composables/usePagination'
import { Plus, Search, Filter } from '@lucide/vue'
import type { TransactionType } from '@/types'

const store = useTransactionStore()

const now = new Date()
const budgetMonth = now.getMonth() + 1
const budgetYear = now.getFullYear()

const { ensureLoaded, getOptions } = useCategoryOptions(budgetMonth, budgetYear)

const showAddModal = ref(false)
const search = ref('')
const filterType = ref<TransactionType | 'all'>('all')
const filterCategory = ref('')

const filterCategoryMode = computed(() => {
  if (filterType.value === 'income') return 'income' as const
  if (filterType.value === 'expense') return 'expense-all' as const
  return 'all' as const
})

const filterCategories = computed(() => getOptions(filterCategoryMode.value))

const filteredTransactions = computed(() => {
  let result = store.transactions

  if (filterType.value !== 'all') {
    result = result.filter(t => t.type === filterType.value)
  }

  if (filterCategory.value) {
    result = result.filter(t => t.category_id === filterCategory.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(t =>
      t.description?.toLowerCase().includes(q) ||
      t.category?.name.toLowerCase().includes(q)
    )
  }

  return result
})

const {
  pageSize,
  currentPage,
  totalItems,
  totalPages,
  paginatedItems,
  rangeStart,
  rangeEnd,
  goToPage,
  resetPage,
} = usePagination(filteredTransactions)

watch([search, filterType, filterCategory], () => {
  resetPage()
})

watch(filterType, () => {
  if (filterCategory.value) {
    const stillValid = filterCategories.value.some(c => c.id === filterCategory.value)
    if (!stillValid) filterCategory.value = ''
  }
})

onMounted(async () => {
  await ensureLoaded('all')
  await store.fetchTransactions()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-100">Transactions</h1>
        <p class="text-surface-500 mt-1">{{ store.transactions.length }} total transactions</p>
      </div>
      <button class="btn-primary flex items-center gap-2 self-start" @click="showAddModal = true">
        <Plus class="w-4 h-4" />
        Add Transaction
      </button>
    </div>

    <div class="glass-card p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
        <input
          v-model="search"
          type="text"
          placeholder="Search transactions..."
          class="input-field pr-10"
        />
      </div>
      <div class="flex gap-2">
        <select v-model="filterType" class="input-field w-auto">
          <option value="all">All Types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <CategorySelect
          v-model="filterCategory"
          :mode="filterCategoryMode"
          :month="budgetMonth"
          :year="budgetYear"
          :required="false"
          placeholder="All Categories"
        />
      </div>
    </div>

    <div v-if="filteredTransactions.length" class="glass-card p-4">
      <TransactionList :transactions="paginatedItems" show-actions />
      <Pagination
        v-model:page-size="pageSize"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        @update:current-page="goToPage"
      />
    </div>

    <EmptyState
      v-else
      title="No transactions found"
      :description="store.transactions.length
        ? 'Try adjusting your filters'
        : 'Start tracking your income and expenses'"
    >
      <template #icon>
        <Filter class="w-8 h-8 text-surface-500" />
      </template>
      <template #action>
        <button class="btn-primary" @click="showAddModal = true">Add Transaction</button>
      </template>
    </EmptyState>

    <Modal :show="showAddModal" title="Add Transaction" @close="showAddModal = false">
      <TransactionForm
        @saved="showAddModal = false"
        @cancel="showAddModal = false"
      />
    </Modal>
  </div>
</template>
