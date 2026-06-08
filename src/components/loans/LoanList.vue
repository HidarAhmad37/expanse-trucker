<script setup lang="ts">
import { ref } from 'vue'
import { format } from 'date-fns'
import { useLoanStore } from '@/stores/loans'
import { formatMoneyWithBase, formatBase, formatShortDate } from '@/utils/format'
import type { Loan } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import LoanForm from './LoanForm.vue'
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Banknote } from '@lucide/vue'

defineProps<{
  loans: Loan[]
}>()

const store = useLoanStore()
const editingLoan = ref<Loan | null>(null)
const payingLoan = ref<Loan | null>(null)
const paymentAmount = ref('')
const paymentDate = ref(format(new Date(), 'yyyy-MM-dd'))
const paying = ref(false)
const paymentError = ref('')

async function handleDelete(id: string) {
  if (!confirm('Delete this loan record?')) return
  await store.deleteLoan(id)
}

async function handlePayment() {
  if (!payingLoan.value) return
  const amount = parseFloat(paymentAmount.value)
  if (!amount || amount <= 0) {
    paymentError.value = 'Enter a valid payment amount'
    return
  }

  paying.value = true
  paymentError.value = ''
  const { error } = await store.recordPayment(
    payingLoan.value.id,
    amount,
    paymentDate.value
  )
  paying.value = false

  if (error) {
    paymentError.value = error.message
    return
  }

  payingLoan.value = null
  paymentAmount.value = ''
  paymentDate.value = format(new Date(), 'yyyy-MM-dd')
}

function openPaymentModal(loan: Loan) {
  payingLoan.value = loan
  paymentAmount.value = ''
  paymentDate.value = format(new Date(), 'yyyy-MM-dd')
  paymentError.value = ''
}

function displayOutstanding(loan: Loan) {
  const outstanding = store.getOutstanding(loan)
  return formatMoneyWithBase(
    outstanding,
    loan.currency ?? 'AFN',
    Number(loan.exchange_rate ?? 1)
  )
}

function displayTotal(loan: Loan) {
  return formatMoneyWithBase(
    Number(loan.amount),
    loan.currency ?? 'AFN',
    Number(loan.exchange_rate ?? 1)
  )
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="loan in loans"
      :key="loan.id"
      class="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-800/70 border border-surface-700/30 transition-all group"
    >
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        :class="loan.type === 'borrowed'
          ? 'bg-red-500/15 text-red-400'
          : 'bg-emerald-500/15 text-emerald-400'"
      >
        <ArrowDownLeft v-if="loan.type === 'borrowed'" class="w-5 h-5" />
        <ArrowUpRight v-else class="w-5 h-5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="font-medium text-surface-200 truncate">{{ loan.person_name }}</p>
        <p class="text-xs text-surface-500">
          {{ loan.type === 'borrowed' ? 'You owe' : 'Owes you' }}
          · {{ formatShortDate(loan.date) }}
          <span v-if="loan.due_date"> · Due {{ formatShortDate(loan.due_date) }}</span>
        </p>
        <p v-if="loan.description" class="text-xs text-surface-500 truncate mt-0.5">{{ loan.description }}</p>
        <div class="mt-1.5 h-1.5 bg-surface-700 rounded-full overflow-hidden max-w-[120px]">
          <div
            class="h-full rounded-full"
            :class="store.isPaid(loan) ? 'bg-emerald-500' : loan.type === 'borrowed' ? 'bg-red-500' : 'bg-emerald-500'"
            :style="{ width: `${Math.min((Number(loan.amount_repaid) / Number(loan.amount)) * 100, 100)}%` }"
          />
        </div>
      </div>

      <div class="text-right shrink-0">
        <p
          class="font-semibold"
          :class="loan.type === 'borrowed' ? 'text-red-400' : 'text-emerald-400'"
        >
          {{ displayOutstanding(loan).primary }}
        </p>
        <p v-if="displayOutstanding(loan).secondary" class="text-xs text-surface-500">
          {{ displayOutstanding(loan).secondary }}
        </p>
        <p class="text-xs text-surface-500">
          of {{ displayTotal(loan).primary }}
        </p>
        <span v-if="store.isPaid(loan)" class="text-xs text-emerald-400 font-medium">Paid</span>
      </div>

      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          v-if="!store.isPaid(loan)"
          class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-emerald-400"
          title="Record payment"
          @click="openPaymentModal(loan)"
        >
          <Banknote class="w-4 h-4" />
        </button>
        <button
          class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
          @click="editingLoan = loan"
        >
          <Pencil class="w-4 h-4" />
        </button>
        <button
          class="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400"
          @click="handleDelete(loan.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <Modal :show="!!editingLoan" title="Edit Loan" @close="editingLoan = null">
      <LoanForm :loan="editingLoan" @saved="editingLoan = null" @cancel="editingLoan = null" />
    </Modal>

    <Modal :show="!!payingLoan" title="Record Payment" size="sm" @close="payingLoan = null">
      <div v-if="payingLoan" class="space-y-4">
        <p class="text-sm text-surface-400">
          Payment for <strong class="text-surface-200">{{ payingLoan.person_name }}</strong>.
          Outstanding: {{ displayOutstanding(payingLoan).primary }}
          <span v-if="displayOutstanding(payingLoan).secondary">
            ({{ formatBase(store.getOutstandingBase(payingLoan)) }})
          </span>
        </p>
        <input
          v-model="paymentAmount"
          type="number"
          step="0.01"
          min="0"
          :max="store.getOutstanding(payingLoan)"
          placeholder="Payment amount"
          class="input-field"
        />
        <p class="text-xs text-surface-500">Enter amount in {{ payingLoan.currency }}</p>
        <div>
          <label class="label">Payment Date</label>
          <input v-model="paymentDate" type="date" class="input-field" />
        </div>
        <p class="text-xs text-surface-500">
          {{
            payingLoan.type === 'lent'
              ? 'This payment will be recorded as income in your transactions.'
              : 'This payment will be recorded as an expense in your transactions.'
          }}
        </p>
        <p v-if="paymentError" class="text-sm text-red-400">{{ paymentError }}</p>
        <div class="flex gap-3">
          <button class="btn-secondary flex-1" @click="payingLoan = null">Cancel</button>
          <button class="btn-primary flex-1" :disabled="paying" @click="handlePayment">
            {{ paying ? 'Saving...' : 'Record' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
