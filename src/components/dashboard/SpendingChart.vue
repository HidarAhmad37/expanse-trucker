<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type TooltipItem,
} from 'chart.js'
import { formatBase } from '@/utils/format'
import type { DailySpending } from '@/types'
import { format, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{ dailySpending: DailySpending[] }>()
const chartData = computed(() => ({
  labels: props.dailySpending.map(d => format(parseISO(d.date), 'd')),
  datasets: [{
    label: 'Daily Spending',
    data: props.dailySpending.map(d => d.amount),
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 6,
    pointHoverBackgroundColor: '#6366f1',
    borderWidth: 2,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' as const },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', maxTicksLimit: 10 },
    },
    y: {
      grid: { color: 'rgba(51, 65, 85, 0.3)' },
      ticks: {
        color: '#64748b',
        callback: (value: string | number) => formatBase(Number(value)),
      },
      beginAtZero: true,
    },
  },
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
        title: (items: TooltipItem<'line'>[]) => {
          const idx = items[0]?.dataIndex
          if (idx === undefined) return ''
          return format(parseISO(props.dailySpending[idx]!.date), 'MMM d, yyyy')
        },
        label: (ctx: TooltipItem<'line'>) =>
          ` Spent: ${formatBase(ctx.parsed.y ?? 0)}`,
      },
    },
  },
}
</script>

<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-surface-100 mb-4">Daily Spending</h3>
    <div class="h-64">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
