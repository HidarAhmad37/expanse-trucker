<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
      <slot name="icon" />
    </div>
    <h3 class="text-lg font-medium text-surface-200 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-surface-500 max-w-sm">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
