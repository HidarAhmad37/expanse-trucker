<script setup lang="ts">
import { computed } from 'vue'
import { formatBase, getPercentage } from '@/utils/format'
import type { Budget } from '@/types'

const props = defineProps<{
  budgets: Budget[]
  spentByCategory: Map<string, number>
}>()

const budgetItems = computed(() =>
  props.budgets.map(budget => {
    const spent = props.spentByCategory.get(budget.category_id) ?? 0
    const percentage = getPercentage(spent, Number(budget.amount))
    const isOver = spent > Number(budget.amount)
    return { budget, spent, percentage, isOver }
  })
)
</script>

<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-surface-100 mb-4">Budget Progress</h3>
    <div v-if="budgetItems.length" class="space-y-4">
      <div v-for="item in budgetItems" :key="item.budget.id">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm text-surface-300">{{ item.budget.category?.name }}</span>
          <span class="text-xs" :class="item.isOver ? 'text-red-400' : 'text-surface-500'">
            {{ formatBase(item.spent) }} / {{ formatBase(Number(item.budget.amount)) }}
          </span>
        </div>
        <div class="h-2 bg-surface-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="item.isOver ? 'bg-red-500' : 'bg-brand-500'"
            :style="{
              width: `${Math.min(item.percentage, 100)}%`,
              backgroundColor: item.isOver ? undefined : item.budget.category?.color,
            }"
          />
        </div>
        <p v-if="item.isOver" class="text-xs text-red-400 mt-1">
          Over budget by {{ formatBase(item.spent - Number(item.budget.amount)) }}
        </p>
      </div>
    </div>
    <p v-else class="text-sm text-surface-500 text-center py-4">
      No budgets set. <router-link to="/budgets" class="text-brand-400 hover:underline">Set up budgets</router-link>
    </p>
  </div>
</template>
