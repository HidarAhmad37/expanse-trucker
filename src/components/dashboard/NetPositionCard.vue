<script setup lang="ts">
import { computed } from 'vue'
import { formatBase } from '@/utils/format'
import { Scale, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from '@lucide/vue'

const props = defineProps<{
  cashBalance: number
  borrowedOutstanding: number
  lentOutstanding: number
  netLoanPosition: number
}>()

const trueNetPosition = computed(() =>
  props.cashBalance + props.netLoanPosition
)

const isInProfit = computed(() => trueNetPosition.value >= 0)
</script>

<template>
  <div class="glass-card p-6">
    <div class="flex items-center gap-2 mb-4">
      <Scale class="w-5 h-5 text-brand-400" />
      <h3 class="text-lg font-semibold text-surface-100">Your True Position</h3>
    </div>

    <div class="text-center mb-6 p-4 rounded-xl border"
      :class="isInProfit
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-red-500/10 border-red-500/20'"
    >
      <p class="text-sm text-surface-400 mb-1">
        {{ isInProfit ? 'You are in profit' : 'You are in debt' }}
      </p>
      <p class="text-3xl font-bold" :class="isInProfit ? 'text-emerald-400' : 'text-red-400'">
        {{ formatBase(Math.abs(trueNetPosition)) }}
      </p>
      <p class="text-xs text-surface-500 mt-1">Cash + loans owed to you − loans you owe</p>
    </div>

    <div class="space-y-3 text-sm">
      <div class="flex justify-between items-center">
        <span class="text-surface-400 flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-emerald-400" /> Cash balance
        </span>
        <span :class="cashBalance >= 0 ? 'text-emerald-400' : 'text-red-400'" class="font-medium">
          {{ formatBase(cashBalance) }}
        </span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-surface-400 flex items-center gap-2">
          <ArrowUpRight class="w-4 h-4 text-emerald-400" /> Others owe you
        </span>
        <span class="text-emerald-400 font-medium">+{{ formatBase(lentOutstanding) }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-surface-400 flex items-center gap-2">
          <ArrowDownLeft class="w-4 h-4 text-red-400" /> You owe others
        </span>
        <span class="text-red-400 font-medium">−{{ formatBase(borrowedOutstanding) }}</span>
      </div>
      <div class="border-t border-surface-700/50 pt-3 flex justify-between items-center">
        <span class="text-surface-300 flex items-center gap-2">
          <TrendingDown v-if="!isInProfit" class="w-4 h-4" />
          <TrendingUp v-else class="w-4 h-4" />
          Net position
        </span>
        <span class="font-semibold" :class="isInProfit ? 'text-emerald-400' : 'text-red-400'">
          {{ formatBase(trueNetPosition) }}
        </span>
      </div>
    </div>

    <router-link to="/loans" class="block text-center text-sm text-brand-400 hover:underline mt-4">
      Manage loans →
    </router-link>
  </div>
</template>
