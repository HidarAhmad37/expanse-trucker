<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { BASE_CURRENCY, CURRENCIES } from '@/types'
import { User, Save } from '@lucide/vue'

const auth = useAuthStore()
const saving = ref(false)
const success = ref(false)
const error = ref('')

const fullName = ref('')
const monthlyIncome = ref('')

const baseCurrencyInfo = CURRENCIES.find(c => c.code === BASE_CURRENCY)

onMounted(() => {
  if (auth.profile) {
    fullName.value = auth.profile.full_name ?? ''
    monthlyIncome.value = auth.profile.monthly_income?.toString() ?? ''
  }
})

async function handleSave() {
  saving.value = true
  error.value = ''
  success.value = false

  const { error: updateError } = await auth.updateProfile({
    full_name: fullName.value,
    currency: BASE_CURRENCY,
    monthly_income: monthlyIncome.value ? parseFloat(monthlyIncome.value) : null,
  })

  saving.value = false
  if (updateError) {
    error.value = updateError.message
  } else {
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="text-2xl font-bold text-surface-100">Settings</h1>
      <p class="text-surface-500 mt-1">Manage your profile and preferences</p>
    </div>

    <div class="glass-card p-6 space-y-6">
      <div class="flex items-center gap-4 pb-6 border-b border-surface-700/50">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
          {{ fullName.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div>
          <h2 class="text-lg font-semibold text-surface-100">{{ fullName || 'User' }}</h2>
          <p class="text-sm text-surface-500">{{ auth.user?.email }}</p>
        </div>
      </div>

      <form class="space-y-5" @submit.prevent="handleSave">
        <div>
          <label class="label">
            <User class="w-4 h-4 inline mr-1" />
            Full Name
          </label>
          <input v-model="fullName" type="text" class="input-field" placeholder="Your name" />
        </div>

        <div>
          <label class="label">Base Currency</label>
          <div class="input-field bg-surface-800/50 text-surface-300 cursor-not-allowed">
            {{ baseCurrencyInfo?.symbol }} {{ baseCurrencyInfo?.name }} ({{ BASE_CURRENCY }})
          </div>
          <p class="text-xs text-surface-500 mt-1">
            All totals and reports are converted to AFN. When adding transactions or loans in other currencies, enter the exchange rate.
          </p>
        </div>

        <div>
          <label class="label">Expected Monthly Income (AFN)</label>
          <input
            v-model="monthlyIncome"
            type="number"
            step="0.01"
            min="0"
            class="input-field"
            placeholder="Your typical monthly salary in AFN"
          />
          <p class="text-xs text-surface-500 mt-1">
            Used for budget insights and spending pace warnings
          </p>
        </div>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-400">Settings saved successfully!</p>

        <button type="submit" class="btn-primary flex items-center gap-2" :disabled="saving">
          <Save class="w-4 h-4" />
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>
  </div>
</template>
