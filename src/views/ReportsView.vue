<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { formatBase, getMonthName } from '@/utils/format'
import { getTransactionBaseAmount } from '@/utils/currency'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { TrendingUp, TrendingDown, Scale } from '@lucide/vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const txStore = useTransactionStore()

const now = new Date()
const selectedYear = ref(now.getFullYear())

const monthlyData = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const summary = txStore.getMonthlySummary(selectedYear.value, month)
    return {
      month,
      name: getMonthName(month).slice(0, 3),
      ...summary,
    }
  })
})

const yearTotals = computed(() => {
  const income = monthlyData.value.reduce((s, m) => s + m.income, 0)
  const expenses = monthlyData.value.reduce((s, m) => s + m.expenses, 0)
  return { income, expenses, balance: income - expenses }
})

const topCategories = computed(() => {
  const totals = new Map<string, { name: string; color: string; amount: number }>()
  txStore.transactions
    .filter(t => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getFullYear() === selectedYear.value
    })
    .forEach(t => {
      if (!t.category) return
      const existing = totals.get(t.category_id!)
      const base = getTransactionBaseAmount(t)
      if (existing) {
        existing.amount += base
      } else {
        totals.set(t.category_id!, {
          name: t.category.name,
          color: t.category.color,
          amount: base,
        })
      }
    })
  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount).slice(0, 8)
})

const chartData = computed(() => ({
  labels: monthlyData.value.map(m => m.name),
  datasets: [
    {
      label: 'Income',
      data: monthlyData.value.map(m => m.income),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderRadius: 6,
    },
    {
      label: 'Expenses',
      data: monthlyData.value.map(m => m.expenses),
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
      borderRadius: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' },
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
    legend: {
      labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle' },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
}

onMounted(async () => {
  await txStore.fetchCategories()
  await txStore.fetchTransactions(`${selectedYear.value}-01-01`, `${selectedYear.value}-12-31`)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-100">Reports</h1>
        <p class="text-surface-500 mt-1">Yearly overview of your finances</p>
      </div>
      <select v-model="selectedYear" class="input-field w-auto self-start">
        <option v-for="y in [now.getFullYear(), now.getFullYear() - 1]" :key="y" :value="y">
          {{ y }}
        </option>
      </select>
    </div>

    <!-- Year Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glass-card p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp class="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p class="text-sm text-surface-500">Total Income</p>
          <p class="text-xl font-bold text-emerald-400">{{ formatBase(yearTotals.income) }}</p>
        </div>
      </div>
      <div class="glass-card p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
          <TrendingDown class="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p class="text-sm text-surface-500">Total Expenses</p>
          <p class="text-xl font-bold text-red-400">{{ formatBase(yearTotals.expenses) }}</p>
        </div>
      </div>
      <div class="glass-card p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Scale class="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <p class="text-sm text-surface-500">Net Savings</p>
          <p
            class="text-xl font-bold"
            :class="yearTotals.balance >= 0 ? 'text-emerald-400' : 'text-red-400'"
          >
            {{ formatBase(yearTotals.balance) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Monthly Chart -->
    <div class="glass-card p-6">
      <h3 class="text-lg font-semibold text-surface-100 mb-4">Monthly Overview</h3>
      <div class="h-80">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Monthly Breakdown Table -->
    <div class="glass-card overflow-hidden">
      <div class="p-6 border-b border-surface-700/50">
        <h3 class="text-lg font-semibold text-surface-100">Month by Month</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-surface-500 border-b border-surface-700/50">
              <th class="text-left p-4 font-medium">Month</th>
              <th class="text-right p-4 font-medium">Income</th>
              <th class="text-right p-4 font-medium">Expenses</th>
              <th class="text-right p-4 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in monthlyData"
              :key="m.month"
              class="border-b border-surface-800/50 hover:bg-surface-800/30"
            >
              <td class="p-4 text-surface-300">{{ getMonthName(m.month) }}</td>
              <td class="p-4 text-right text-emerald-400">{{ formatBase(m.income) }}</td>
              <td class="p-4 text-right text-red-400">{{ formatBase(m.expenses) }}</td>
              <td
                class="p-4 text-right font-medium"
                :class="m.balance >= 0 ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ formatBase(m.balance) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top Categories -->
    <div class="glass-card p-6">
      <h3 class="text-lg font-semibold text-surface-100 mb-4">Top Spending Categories ({{ selectedYear }})</h3>
      <div v-if="topCategories.length" class="space-y-3">
        <div
          v-for="(cat, i) in topCategories"
          :key="cat.name"
          class="flex items-center gap-4"
        >
          <span class="text-sm text-surface-500 w-6">{{ i + 1 }}</span>
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: cat.color }"
          />
          <span class="flex-1 text-surface-300">{{ cat.name }}</span>
          <span class="font-medium text-surface-200">{{ formatBase(cat.amount) }}</span>
        </div>
      </div>
      <p v-else class="text-sm text-surface-500 text-center py-4">No expense data for this year</p>
    </div>
  </div>
</template>
