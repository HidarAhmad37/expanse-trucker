<script setup lang="ts">
import { formatBase } from '@/utils/format'
import { Wallet, TrendingUp, TrendingDown } from '@lucide/vue'

defineProps<{
  balance: number
  income: number
  expenses: number
}>()

</script>

<template>
  <div class="glass-card p-6 relative overflow-hidden">
    <div class="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
    <div class="relative">
      <div class="flex items-center gap-2 mb-1">
        <Wallet class="w-5 h-5 text-brand-400" />
        <span class="text-sm text-surface-400">Current Balance (AFN)</span>
      </div>
      <p class="text-4xl font-bold gradient-text mb-6">
        {{ formatBase(balance) }}
      </p>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <TrendingUp class="w-5 h-5 text-emerald-400" />
          <div>
            <p class="text-xs text-surface-500">Income</p>
            <p class="font-semibold text-emerald-400">{{ formatBase(income) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <TrendingDown class="w-5 h-5 text-red-400" />
          <div>
            <p class="text-xs text-surface-500">Expenses</p>
            <p class="font-semibold text-red-400">{{ formatBase(expenses) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
