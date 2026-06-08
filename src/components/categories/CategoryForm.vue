<script setup lang="ts">
import { ref } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import type { Category, TransactionType } from '@/types'

const COLOR_PRESETS = [
  '#10b981', '#34d399', '#6ee7b7',
  '#ef4444', '#f97316', '#ec4899',
  '#8b5cf6', '#06b6d4', '#14b8a6',
  '#3b82f6', '#a855f7', '#6366f1',
  '#6b7280',
]

const props = defineProps<{
  category?: Category | null
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useTransactionStore()
const saving = ref(false)
const error = ref('')

const name = ref(props.category?.name ?? '')
const type = ref<TransactionType>(props.category?.type ?? 'expense')
const color = ref(props.category?.color ?? '#6366f1')

async function handleSubmit() {
  error.value = ''
  const trimmed = name.value.trim()

  if (!trimmed) {
    error.value = 'Please enter a category name'
    return
  }

  saving.value = true
  const payload = { name: trimmed, type: type.value, color: color.value }

  const result = props.category
    ? await store.updateCategory(props.category.id, payload)
    : await store.addCategory(payload)

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
      <label class="label">Name</label>
      <input
        v-model="name"
        type="text"
        required
        placeholder="e.g. Groceries"
        class="input-field"
        autofocus
      />
    </div>

    <div>
      <label class="label">Color</label>
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="preset in COLOR_PRESETS"
          :key="preset"
          type="button"
          class="w-8 h-8 rounded-lg border-2 transition-all"
          :class="color === preset ? 'border-white scale-110' : 'border-transparent'"
          :style="{ backgroundColor: preset }"
          @click="color = preset"
        />
      </div>
      <input v-model="color" type="color" class="w-full h-10 rounded-xl cursor-pointer bg-surface-800 border border-surface-600" />
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="flex gap-3 pt-2">
      <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving...' : category ? 'Update Category' : 'Add Category' }}
      </button>
    </div>
  </form>
</template>
