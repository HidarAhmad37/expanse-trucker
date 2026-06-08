<script setup lang="ts">
export interface TabItem {
  id: string
  label: string
}

const model = defineModel<string>({ required: true })

defineProps<{
  tabs: TabItem[]
}>()
</script>

<template>
  <div class="flex gap-1 p-1 bg-surface-800 rounded-xl w-fit">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
      :class="model === tab.id
        ? 'bg-brand-600/20 text-brand-400 shadow-sm'
        : 'text-surface-400 hover:text-surface-200'"
      @click="model = tab.id"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
