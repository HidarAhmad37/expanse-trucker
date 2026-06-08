<script setup lang="ts">
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '@/composables/usePagination'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const pageSize = defineModel<PageSizeOption>('pageSize', { required: true })

const props = defineProps<{
  currentPage: number
  totalPages: number
  totalItems: number
  rangeStart: number
  rangeEnd: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

function prev() {
  emit('update:currentPage', Math.max(1, props.currentPage - 1))
}

function next() {
  emit('update:currentPage', Math.min(props.totalPages, props.currentPage + 1))
}
</script>

<template>
  <div
    v-if="totalItems > 0"
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-surface-700/50"
  >
    <p class="text-sm text-surface-500">
      Showing <span class="text-surface-300">{{ rangeStart }}–{{ rangeEnd }}</span>
      of <span class="text-surface-300">{{ totalItems }}</span>
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm text-surface-500">Per page</label>
        <select v-model="pageSize" class="input-field w-auto py-2 text-sm">
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-2 rounded-lg border border-surface-600 hover:bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          :disabled="currentPage <= 1"
          @click="prev"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm text-surface-400 min-w-[80px] text-center">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          type="button"
          class="p-2 rounded-lg border border-surface-600 hover:bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          :disabled="currentPage >= totalPages"
          @click="next"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
