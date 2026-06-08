<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type TooltipItem } from 'chart.js'
import { formatBase } from '@/utils/format'
import type { MonthlySummary } from '@/types'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ summary: MonthlySummary }>()
const chartData = computed(() => ({
  labels: props.summary.byCategory.map(c => c.category.name),
  datasets: [{
    data: props.summary.byCategory.map(c => c.amount),
    backgroundColor: props.summary.byCategory.map(c => c.category.color),
    borderWidth: 0,
    hoverOffset: 8,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: TooltipItem<'doughnut'>) =>
          ` ${ctx.label}: ${formatBase(ctx.parsed)}`,
      },
    },
  },
}
</script>

<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-surface-100 mb-4">Spending by Category</h3>
    <div v-if="summary.byCategory.length" class="flex flex-col md:flex-row items-center gap-6">
      <div class="w-48 h-48 shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
      <div class="flex-1 w-full space-y-3">
        <div
          v-for="item in summary.byCategory.slice(0, 6)"
          :key="item.category.id"
          class="flex items-center gap-3"
        >
          <div
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: item.category.color }"
          />
          <span class="text-sm text-surface-300 flex-1 truncate">{{ item.category.name }}</span>
          <span class="text-sm font-medium text-surface-200">
            {{ formatBase(item.amount) }}
          </span>
          <span class="text-xs text-surface-500 w-10 text-right">
            {{ Math.round(item.percentage) }}%
          </span>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-surface-500 text-center py-8">No expenses this month yet</p>
  </div>
</template>
