<script setup lang="ts">
import { computed } from 'vue'
import { formatBase } from '@/utils/format'
import type { MonthlySummary } from '@/types'
import { Lightbulb, AlertTriangle, TrendingDown } from '@lucide/vue'

const props = defineProps<{
  summary: MonthlySummary
  daysInMonth: number
  currentDay: number
}>()

const insights = computed(() => {
  const results: { type: 'warning' | 'info' | 'tip'; message: string }[] = []
  const { income, expenses, balance, byCategory } = props.summary

  if (income > 0 && expenses > 0) {
    const burnRate = expenses / props.currentDay
    const projectedTotal = burnRate * props.daysInMonth

    if (projectedTotal > income) {
      results.push({
        type: 'warning',
        message: `At your current spending rate (${formatBase(burnRate)}/day), you'll spend ${formatBase(projectedTotal)} this month — ${formatBase(projectedTotal - income)} over your income!`,
      })
    }

    const daysUntilBroke = balance > 0 && burnRate > 0
      ? Math.floor(balance / burnRate)
      : 0

    if (daysUntilBroke > 0 && daysUntilBroke < 15) {
      results.push({
        type: 'warning',
        message: `Your money will run out in about ${daysUntilBroke} days at this spending pace.`,
      })
    }
  }

  if (byCategory.length > 0) {
    const top = byCategory[0]!
    results.push({
      type: 'info',
      message: `Your biggest expense is ${top.category.name} at ${formatBase(top.amount)} (${Math.round(top.percentage)}% of total spending).`,
    })
  }

  if (expenses === 0 && income > 0) {
    results.push({
      type: 'tip',
      message: 'Great start! You have income recorded but no expenses yet. Start tracking to see where your money goes.',
    })
  }

  if (balance < 0) {
    results.push({
      type: 'warning',
      message: `You're in the red by ${formatBase(Math.abs(balance))}. Time to cut back on non-essential spending.`,
    })
  }

  return results
})

const iconMap = {
  warning: AlertTriangle,
  info: TrendingDown,
  tip: Lightbulb,
}

const colorMap = {
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  info: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  tip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}
</script>

<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-surface-100 mb-4">Money Insights</h3>
    <div v-if="insights.length" class="space-y-3">
      <div
        v-for="(insight, i) in insights"
        :key="i"
        class="flex gap-3 p-4 rounded-xl border"
        :class="colorMap[insight.type]"
      >
        <component :is="iconMap[insight.type]" class="w-5 h-5 shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed">{{ insight.message }}</p>
      </div>
    </div>
    <p v-else class="text-sm text-surface-500 text-center py-4">
      Add transactions to get personalized insights
    </p>
  </div>
</template>
