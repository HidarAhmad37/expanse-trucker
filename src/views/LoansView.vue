<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLoanStore } from '@/stores/loans'
import { formatBase } from '@/utils/format'
import LoanList from '@/components/loans/LoanList.vue'
import Modal from '@/components/ui/Modal.vue'
import LoanForm from '@/components/loans/LoanForm.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { Plus, ArrowDownLeft, ArrowUpRight, Scale, HandCoins } from '@lucide/vue'

const loanStore = useLoanStore()

const showAddModal = ref(false)
const activeTab = ref<'all' | 'borrowed' | 'lent'>('all')

const filteredLoans = computed(() => {
  if (activeTab.value === 'borrowed') return loanStore.borrowedLoans
  if (activeTab.value === 'lent') return loanStore.lentLoans
  return loanStore.loans
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
} = usePagination(filteredLoans)

watch(activeTab, () => {
  resetPage()
})

const isInProfit = computed(() => loanStore.summary.netLoanPosition >= 0)

onMounted(() => loanStore.fetchLoans())
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-100">Loans</h1>
        <p class="text-surface-500 mt-1">Track money you borrowed or lent</p>
      </div>
      <button class="btn-primary flex items-center gap-2 self-start" @click="showAddModal = true">
        <Plus class="w-4 h-4" />
        Add Loan
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glass-card p-5">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <ArrowDownLeft class="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p class="text-sm text-surface-500">You Owe</p>
            <p class="text-xl font-bold text-red-400">
              {{ formatBase(loanStore.summary.borrowedOutstanding) }}
            </p>
          </div>
        </div>
        <p class="text-xs text-surface-500">{{ loanStore.summary.activeBorrowedCount }} active loans</p>
      </div>

      <div class="glass-card p-5">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ArrowUpRight class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Owed To You</p>
            <p class="text-xl font-bold text-emerald-400">
              {{ formatBase(loanStore.summary.lentOutstanding) }}
            </p>
          </div>
        </div>
        <p class="text-xs text-surface-500">{{ loanStore.summary.activeLentCount }} active loans</p>
      </div>

      <div class="glass-card p-5">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="isInProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'"
          >
            <Scale class="w-5 h-5" :class="isInProfit ? 'text-emerald-400' : 'text-red-400'" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Loan Balance</p>
            <p class="text-xl font-bold" :class="isInProfit ? 'text-emerald-400' : 'text-red-400'">
              {{ isInProfit ? '+' : '−' }}{{ formatBase(Math.abs(loanStore.summary.netLoanPosition)) }}
            </p>
          </div>
        </div>
        <p class="text-xs text-surface-500">
          {{ isInProfit ? 'Others owe you more' : 'You owe more than others owe you' }}
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 p-1 bg-surface-800/60 rounded-xl w-fit">
      <button
        v-for="tab in ([['all', 'All'], ['borrowed', 'I Borrowed'], ['lent', 'I Lent']] as const)"
        :key="tab[0]"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === tab[0]
          ? 'bg-brand-600/20 text-brand-400'
          : 'text-surface-400 hover:text-surface-200'"
        @click="activeTab = tab[0]"
      >
        {{ tab[1] }}
      </button>
    </div>

    <div v-if="filteredLoans.length" class="glass-card p-4">
      <LoanList :loans="paginatedItems" />
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
      title="No loans recorded"
      description="Add loans you've taken or given to track if you're in debt or profit"
    >
      <template #icon>
        <HandCoins class="w-8 h-8 text-surface-500" />
      </template>
      <template #action>
        <button class="btn-primary" @click="showAddModal = true">Add Loan</button>
      </template>
    </EmptyState>

    <Modal :show="showAddModal" title="Add Loan" @close="showAddModal = false">
      <LoanForm @saved="showAddModal = false" @cancel="showAddModal = false" />
    </Modal>
  </div>
</template>
