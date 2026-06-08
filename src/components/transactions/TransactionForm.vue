<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import type { Transaction, TransactionType } from '@/types'
import { BASE_CURRENCY } from '@/types'
import { normalizeExchangeRate } from '@/utils/currency'
import CurrencyFields from '@/components/ui/CurrencyFields.vue'
import CategorySelect from '@/components/ui/CategorySelect.vue'
import { format } from 'date-fns'

const props = defineProps<{
  transaction?: Transaction | null
  budgetMonth?: number
  budgetYear?: number
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useTransactionStore()
const saving = ref(false)
const error = ref('')

const budgetMonth = computed(() => {
  if (props.budgetMonth) return props.budgetMonth
  if (props.transaction?.date) {
    const d = new Date(props.transaction.date + 'T00:00:00')
    return d.getMonth() + 1
  }
  return new Date().getMonth() + 1
})

const budgetYear = computed(() => {
  if (props.budgetYear) return props.budgetYear
  if (props.transaction?.date) {
    const d = new Date(props.transaction.date + 'T00:00:00')
    return d.getFullYear()
  }
  return new Date().getFullYear()
})

const type = ref<TransactionType>(props.transaction?.type ?? 'expense')
const amount = ref(props.transaction?.amount?.toString() ?? '')
const currency = ref(props.transaction?.currency ?? BASE_CURRENCY)
const exchangeRate = ref(props.transaction?.exchange_rate?.toString() ?? '1')
const categoryId = ref(props.transaction?.category_id ?? '')
const description = ref(props.transaction?.description ?? '')
const date = ref(props.transaction?.date ?? format(new Date(), 'yyyy-MM-dd'))

onMounted(async () => {
  if (!store.categories.length) await store.fetchCategories()
})

async function handleSubmit() {
  error.value = ''
  const parsedAmount = parseFloat(amount.value)
  const parsedRate = normalizeExchangeRate(currency.value, parseFloat(exchangeRate.value) || 1)

  if (!parsedAmount || parsedAmount <= 0) {
    error.value = 'Please enter a valid amount'
    return
  }
  if (!categoryId.value) {
    error.value = 'Please select a category'
    return
  }
  if (currency.value !== BASE_CURRENCY && parsedRate <= 0) {
    error.value = 'Please enter a valid exchange rate'
    return
  }

  saving.value = true
  const payload = {
    category_id: categoryId.value,
    amount: parsedAmount,
    currency: currency.value,
    exchange_rate: parsedRate,
    type: type.value,
    description: description.value || undefined,
    date: date.value,
  }

  const result = props.transaction
    ? await store.updateTransaction(props.transaction.id, payload)
    : await store.addTransaction(payload)

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
        :class="type === 'expense'
          ? 'bg-red-500/20 text-red-400 shadow-sm'
          : 'text-surface-400 hover:text-surface-200'"
        @click="type = 'expense'"
      >
        Expense
      </button>
      <button
        type="button"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="type === 'income'
          ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
          : 'text-surface-400 hover:text-surface-200'"
        @click="type = 'income'"
      >
        Income
      </button>
    </div>

    <div>
      <label class="label">Amount</label>
      <input
        v-model="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        class="input-field text-2xl font-semibold"
        autofocus
      />
    </div>

    <CurrencyFields v-model:currency="currency" v-model:exchange-rate="exchangeRate" v-model:amount="amount" />

    <div>
      <label class="label">Category</label>
      <CategorySelect
        v-model="categoryId"
        mode="all"
        :month="budgetMonth"
        :year="budgetYear"
        :include-id="transaction?.category_id"
        placeholder="Select category"
      />
    </div>

    <div>
      <label class="label">Description (optional)</label>
      <input v-model="description" type="text" placeholder="What was this for?" class="input-field" />
    </div>

    <div>
      <label class="label">Date</label>
      <input v-model="date" type="date" class="input-field" />
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="flex gap-3 pt-2">
      <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving...' : transaction ? 'Update' : 'Add Transaction' }}
      </button>
    </div>
  </form>
</template>
