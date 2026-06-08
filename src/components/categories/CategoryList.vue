<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types'
import { Pencil, Trash2, Tag } from '@lucide/vue'

const props = defineProps<{
  categories: Category[]
}>()

const emit = defineEmits<{
  edit: [category: Category]
  delete: [id: string]
}>()

const expenseCategories = computed(() =>
  props.categories.filter(c => c.type === 'expense')
)

const incomeCategories = computed(() =>
  props.categories.filter(c => c.type === 'income')
)

async function handleDelete(id: string, name: string) {
  if (!confirm(`Delete "${name}"? Linked budgets will be removed and transactions will be uncategorized.`)) {
    return
  }
  emit('delete', id)
}
</script>

<template>
  <div class="space-y-6">
    <section v-if="expenseCategories.length">
      <h3 class="text-sm font-medium text-surface-400 mb-3 uppercase tracking-wide">
        Expense · {{ expenseCategories.length }}
      </h3>
      <div class="space-y-2">
        <div
          v-for="cat in expenseCategories"
          :key="cat.id"
          class="glass-card p-4 flex items-center gap-4 group"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            :style="{ backgroundColor: cat.color + '20', color: cat.color }"
          >
            <Tag class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-surface-200">{{ cat.name }}</p>
            <p class="text-xs text-surface-500">Expense</p>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
              title="Edit"
              @click="emit('edit', cat)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400"
              title="Delete"
              @click="handleDelete(cat.id, cat.name)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="incomeCategories.length">
      <h3 class="text-sm font-medium text-surface-400 mb-3 uppercase tracking-wide">
        Income · {{ incomeCategories.length }}
      </h3>
      <div class="space-y-2">
        <div
          v-for="cat in incomeCategories"
          :key="cat.id"
          class="glass-card p-4 flex items-center gap-4 group"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            :style="{ backgroundColor: cat.color + '20', color: cat.color }"
          >
            <Tag class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-surface-200">{{ cat.name }}</p>
            <p class="text-xs text-surface-500">Income</p>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
              title="Edit"
              @click="emit('edit', cat)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400"
              title="Delete"
              @click="handleDelete(cat.id, cat.name)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
