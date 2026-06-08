<script setup lang="ts">
import { computed, watch } from 'vue'
import { CURRENCIES, BASE_CURRENCY } from '@/types'
import { formatBase } from '@/utils/format'
import { toBaseAmount } from '@/utils/currency'

const currency = defineModel<string>('currency', { default: BASE_CURRENCY })
const exchangeRate = defineModel<string>('exchangeRate', { default: '1' })
const amount = defineModel<string>('amount', { default: '' })

const isBase = computed(() => currency.value === BASE_CURRENCY)

const basePreview = computed(() => {
  const amt = parseFloat(amount.value) || 0
  const rate = isBase.value ? 1 : parseFloat(exchangeRate.value) || 0
  return toBaseAmount(amt, rate)
})

watch(currency, (c) => {
  if (c === BASE_CURRENCY) exchangeRate.value = '1'
})
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Currency</label>
        <select v-model="currency" class="input-field">
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
            {{ c.symbol }} {{ c.code }}
          </option>
        </select>
      </div>
      <div v-if="!isBase">
        <label class="label">1 {{ currency }} = ? AFN</label>
        <input
          v-model="exchangeRate"
          type="number"
          step="0.0001"
          min="0.0001"
          required
          placeholder="Exchange rate"
          class="input-field"
        />
      </div>
      <div v-else class="flex items-end">
        <p class="text-xs text-surface-500 pb-2.5">Base currency — rate is 1</p>
      </div>
    </div>

    <p
      v-if="!isBase && parseFloat(amount) > 0 && parseFloat(exchangeRate) > 0"
      class="text-sm text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2"
    >
      = {{ formatBase(basePreview) }} in AFN
    </p>
  </div>
</template>
