<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLoanStore } from '@/stores/loans'
import type { Loan, LoanType } from '@/types'
import { BASE_CURRENCY } from '@/types'
import { normalizeExchangeRate } from '@/utils/currency'
import CurrencyFields from '@/components/ui/CurrencyFields.vue'
import { format } from 'date-fns'

const props = defineProps<{
  loan?: Loan | null
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useLoanStore()
const saving = ref(false)
const error = ref('')

const type = ref<LoanType>(props.loan?.type ?? 'borrowed')
const personName = ref(props.loan?.person_name ?? '')
const amount = ref(props.loan?.amount?.toString() ?? '')
const amountRepaid = ref(props.loan?.amount_repaid?.toString() ?? '0')
const currency = ref(props.loan?.currency ?? BASE_CURRENCY)
const exchangeRate = ref(props.loan?.exchange_rate?.toString() ?? '1')
const description = ref(props.loan?.description ?? '')
const date = ref(props.loan?.date ?? format(new Date(), 'yyyy-MM-dd'))
const dueDate = ref(props.loan?.due_date ?? '')

watch(type, () => {
  if (!props.loan) amountRepaid.value = '0'
})

async function handleSubmit() {
  error.value = ''
  const parsedAmount = parseFloat(amount.value)
  const parsedRepaid = parseFloat(amountRepaid.value) || 0
  const parsedRate = normalizeExchangeRate(currency.value, parseFloat(exchangeRate.value) || 1)

  if (!personName.value.trim()) {
    error.value = 'Please enter a name'
    return
  }
  if (!parsedAmount || parsedAmount <= 0) {
    error.value = 'Please enter a valid amount'
    return
  }
  if (parsedRepaid < 0 || parsedRepaid > parsedAmount) {
    error.value = 'Repaid amount must be between 0 and total amount'
    return
  }
  if (currency.value !== BASE_CURRENCY && parsedRate <= 0) {
    error.value = 'Please enter a valid exchange rate'
    return
  }

  saving.value = true
  const payload = {
    type: type.value,
    person_name: personName.value.trim(),
    amount: parsedAmount,
    amount_repaid: parsedRepaid,
    currency: currency.value,
    exchange_rate: parsedRate,
    description: description.value || undefined,
    date: date.value,
    due_date: dueDate.value || undefined,
  }

  const result = props.loan
    ? await store.updateLoan(props.loan.id, payload)
    : await store.addLoan(payload)

  saving.value = false
  if (result.error) {
    error.value = result.error.message
  } else {
    emit('saved')
  }
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="flex gap-2 p-1 bg-surface-800 rounded-xl">
      <button
        type="button"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="type === 'borrowed'
          ? 'bg-red-500/20 text-red-400 shadow-sm'
          : 'text-surface-400 hover:text-surface-200'"
        @click="type = 'borrowed'"
      >
        I Borrowed
      </button>
      <button
        type="button"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="type === 'lent'
          ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
          : 'text-surface-400 hover:text-surface-200'"
        @click="type = 'lent'"
      >
        I Lent
      </button>
    </div>

    <p class="text-xs text-surface-500 -mt-2">
      {{ type === 'borrowed' ? 'Money you took — you owe this person' : 'Money you gave — they owe you' }}
    </p>

    <div>
      <label class="label">{{ type === 'borrowed' ? 'Borrowed From' : 'Lent To' }}</label>
      <input v-model="personName" type="text" required placeholder="Person name" class="input-field" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Total Amount</label>
        <input v-model="amount" type="number" step="0.01" min="0" required placeholder="0.00" class="input-field" />
      </div>
      <div>
        <label class="label">Already Repaid</label>
        <input v-model="amountRepaid" type="number" step="0.01" min="0" placeholder="0.00" class="input-field" />
        <p v-if="parseFloat(amountRepaid) > 0" class="text-xs text-surface-500 mt-1">
          Repaid amounts are auto-recorded as
          {{ type === 'lent' ? 'income' : 'expense' }}
          transactions.
        </p>
      </div>
    </div>

    <CurrencyFields v-model:currency="currency" v-model:exchange-rate="exchangeRate" v-model:amount="amount" />

    <div>
      <label class="label">Note (optional)</label>
      <input v-model="description" type="text" placeholder="Reason or details" class="input-field" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Date</label>
        <input v-model="date" type="date" class="input-field" />
      </div>
      <div>
        <label class="label">Due Date (optional)</label>
        <input v-model="dueDate" type="date" class="input-field" />
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="flex gap-3 pt-2">
      <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving...' : loan ? 'Update Loan' : 'Add Loan' }}
      </button>
    </div>
  </form>
</template>
