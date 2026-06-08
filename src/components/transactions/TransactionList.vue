<script setup lang="ts">
import { ref } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { formatMoneyWithBase, formatShortDate } from '@/utils/format'
import type { Transaction } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import TransactionForm from './TransactionForm.vue'
import { Pencil, Trash2, TrendingUp, TrendingDown } from '@lucide/vue'

defineProps<{
  transactions: Transaction[]
  showActions?: boolean
}>()

const store = useTransactionStore()
const editingTransaction = ref<Transaction | null>(null)
const deletingId = ref<string | null>(null)

async function handleDelete(id: string) {
  if (!confirm('Delete this transaction?')) return
  deletingId.value = id
  await store.deleteTransaction(id)
  deletingId.value = null
}

function displayAmount(tx: Transaction) {
  return formatMoneyWithBase(
    Number(tx.amount),
    tx.currency ?? 'AFN',
    Number(tx.exchange_rate ?? 1)
  )
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="tx in transactions"
      :key="tx.id"
      class="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-800/70 border border-surface-700/30 transition-all group"
    >
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        :style="{
          backgroundColor: (tx.category?.color ?? '#6b7280') + '20',
          color: tx.category?.color ?? '#6b7280',
        }"
      >
        <TrendingDown v-if="tx.type === 'expense'" class="w-5 h-5" />
        <TrendingUp v-else class="w-5 h-5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="font-medium text-surface-200 truncate">
          {{ tx.description || tx.category?.name || 'Transaction' }}
        </p>
        <p class="text-xs text-surface-500">
          {{ tx.category?.name }} · {{ formatShortDate(tx.date) }}
        </p>
      </div>

      <div class="text-right shrink-0">
        <p
          class="font-semibold"
          :class="tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'"
        >
          {{ tx.type === 'income' ? '+' : '-' }}{{ displayAmount(tx).primary }}
        </p>
        <p v-if="displayAmount(tx).secondary" class="text-xs text-surface-500">
          {{ displayAmount(tx).secondary }}
        </p>
      </div>

      <div v-if="showActions" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
          @click="editingTransaction = tx"
        >
          <Pencil class="w-4 h-4" />
        </button>
        <button
          class="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400"
          :disabled="deletingId === tx.id"
          @click="handleDelete(tx.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <Modal
      :show="!!editingTransaction"
      title="Edit Transaction"
      @close="editingTransaction = null"
    >
      <TransactionForm
        :transaction="editingTransaction"
        @saved="editingTransaction = null"
        @cancel="editingTransaction = null"
      />
    </Modal>
  </div>
</template>
