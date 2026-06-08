<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBudgetStore } from '@/stores/budgets'
import { useTransactionStore } from '@/stores/transactions'
import CategorySelect from '@/components/ui/CategorySelect.vue'
import type { Budget } from '@/types'

const props = defineProps<{
  budget?: Budget | null
  month: number
  year: number
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()

const budgetStore = useBudgetStore()
const txStore = useTransactionStore()
const saving = ref(false)
const error = ref('')

const categoryId = ref(props.budget?.category_id ?? '')
const amount = ref(props.budget?.amount?.toString() ?? '')

const categoryMode = computed(() => 'expense-all' as const)

onMounted(async () => {
  if (!txStore.categories.length) await txStore.fetchCategories()
  await budgetStore.fetchBudgets(props.month, props.year)
})

async function handleSubmit() {
  error.value = ''
  const parsedAmount = parseFloat(amount.value)

  if (!categoryId.value) {
    error.value = 'Please select a category'
    return
  }
  if (!parsedAmount || parsedAmount <= 0) {
    error.value = 'Please enter a valid amount in AFN'
    return
  }

  saving.value = true
  const payload = {
    category_id: categoryId.value,
    amount: parsedAmount,
    month: props.month,
    year: props.year,
  }

  const result = props.budget
    ? await budgetStore.updateBudget(props.budget.id, payload)
    : await budgetStore.addBudget(payload)

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
    <div>
      <label class="label">Category</label>
      <CategorySelect
        v-model="categoryId"
        :mode="categoryMode"
        :month="month"
        :year="year"
        :include-id="budget?.category_id"
        :disabled="!!budget"
        :placeholder="budget ? 'Category' : 'Select category'"
      />
      <p v-if="budget" class="text-xs text-surface-500 mt-1">Category cannot be changed when editing</p>
      <p v-else class="text-xs text-surface-500 mt-1">All expense categories from your account are listed.</p>
    </div>

    <div>
      <label class="label">Monthly Limit (AFN)</label>
      <input
        v-model="amount"
        type="number"
        step="0.01"
        min="0"
        required
        placeholder="0.00"
        class="input-field text-xl font-semibold"
      />
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="flex gap-3 pt-2">
      <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving...' : budget ? 'Update Budget' : 'Add Budget' }}
      </button>
    </div>
  </form>
</template>
