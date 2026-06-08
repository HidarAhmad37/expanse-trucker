<script setup lang="ts">
import { computed } from 'vue'
import { formatBase } from '@/utils/format'
import type { Budget } from '@/types'
import { PiggyBank, Pencil, Trash2 } from '@lucide/vue'

const props = defineProps<{
  budgets: Budget[]
  spentByCategory: Map<string, number>
}>()

const emit = defineEmits<{
  edit: [budget: Budget]
  delete: [id: string]
}>()

const rows = computed(() =>
  props.budgets.map(budget => {
    const spent = props.spentByCategory.get(budget.category_id) ?? 0
    const limit = Number(budget.amount)
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0
    const isOver = spent > limit
    return { budget, spent, limit, percentage, isOver }
  }).sort((a, b) => b.spent - a.spent)
)

async function handleDelete(id: string) {
  if (!confirm('Delete this budget?')) return
  emit('delete', id)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="row in rows"
      :key="row.budget.id"
      class="glass-card p-5 group"
    >
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          :style="{
            backgroundColor: (row.budget.category?.color ?? '#6366f1') + '20',
            color: row.budget.category?.color ?? '#6366f1',
          }"
        >
          <PiggyBank class="w-6 h-6" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-surface-200">{{ row.budget.category?.name }}</h3>
            <span class="text-sm" :class="row.isOver ? 'text-red-400' : 'text-surface-400'">
              {{ formatBase(row.spent) }} / {{ formatBase(row.limit) }}
            </span>
          </div>

          <div class="h-2.5 bg-surface-800 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="row.isOver ? 'bg-red-500' : ''"
              :style="{
                width: `${Math.min(row.percentage, 100)}%`,
                backgroundColor: row.isOver ? undefined : row.budget.category?.color,
              }"
            />
          </div>

          <p v-if="row.isOver" class="text-xs text-red-400 mt-1.5">
            Over by {{ formatBase(row.spent - row.limit) }}
          </p>
          <p v-else class="text-xs text-surface-500 mt-1.5">
            {{ row.percentage }}% used · {{ formatBase(row.limit - row.spent) }} remaining
          </p>
        </div>

        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
            title="Edit"
            @click="emit('edit', row.budget)"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            class="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400"
            title="Delete"
            @click="handleDelete(row.budget.id)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
