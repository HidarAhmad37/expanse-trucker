<script setup lang="ts">
import { computed, onMounted, toRef, watch } from 'vue'
import { useCategoryOptions, type CategorySelectMode } from '@/composables/useCategoryOptions'

const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<{
  mode: CategorySelectMode
  month?: number
  year?: number
  excludeIds?: string[]
  includeId?: string | null
  placeholder?: string
  disabled?: boolean
  required?: boolean
}>(), {
  month: () => new Date().getMonth() + 1,
  year: () => new Date().getFullYear(),
  excludeIds: () => [],
  includeId: null,
  placeholder: 'Select category',
  disabled: false,
  required: true,
})

const { ensureLoaded, getOptions } = useCategoryOptions(
  toRef(() => props.month),
  toRef(() => props.year)
)

const options = computed(() =>
  getOptions(props.mode, props.excludeIds, props.includeId ?? (model.value || undefined))
)

const emptyHint = computed(() => {
  if (options.value.length) return ''
  if (props.mode === 'expense-budgeted' || props.mode === 'all-with-budget') {
    return 'No budgeted categories. Set up budgets first.'
  }
  if (props.mode === 'expense-unbudgeted') {
    return 'All expense categories already have a budget.'
  }
  return 'No categories found. They will be created on first login.'
})

onMounted(() => ensureLoaded(props.mode))
watch(() => [props.month, props.year, props.mode], () => ensureLoaded(props.mode))
</script>

<template>
  <div>
    <select
      v-model="model"
      class="input-field"
      :disabled="disabled || !options.length"
      :required="required"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="cat in options" :key="cat.id" :value="cat.id">
        {{ cat.name }}
      </option>
    </select>
    <p v-if="emptyHint && !options.length" class="text-xs text-amber-400 mt-1.5">
      {{ emptyHint }}
    </p>
  </div>
</template>
