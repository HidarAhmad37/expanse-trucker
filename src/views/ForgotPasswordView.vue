<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Wallet, Mail, ArrowLeft } from '@lucide/vue'

const auth = useAuthStore()
const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

async function handleReset() {
  error.value = ''
  loading.value = true
  const { error: authError } = await auth.resetPassword(email.value)
  loading.value = false

  if (authError) {
    error.value = authError.message
  } else {
    sent.value = true
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-600/30">
          <Wallet class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold gradient-text">SpendWise</h1>
        <p class="text-surface-500 mt-2">Reset your password</p>
      </div>

      <div class="glass-card p-8">
        <div v-if="sent" class="text-center py-4">
          <h2 class="text-xl font-semibold text-emerald-400 mb-2">Check your email</h2>
          <p class="text-surface-500 text-sm">
            We sent a password reset link to <strong class="text-surface-300">{{ email }}</strong>
          </p>
          <router-link to="/login" class="btn-primary inline-block mt-6">Back to Login</router-link>
        </div>

        <template v-else>
          <h2 class="text-xl font-semibold mb-2">Forgot password?</h2>
          <p class="text-sm text-surface-500 mb-6">Enter your email and we'll send you a reset link.</p>

          <form class="space-y-5" @submit.prevent="handleReset">
            <div>
              <label class="label">Email</label>
              <div class="relative">
                <Mail class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 pointer-events-none" />
                <input
                  v-model="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  class="input-field pr-11"
                />
              </div>
            </div>

            <p v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {{ error }}
            </p>

            <button type="submit" class="btn-primary w-full" :disabled="loading">
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
        </template>

        <router-link
          to="/login"
          class="flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-surface-300 mt-6"
        >
          <ArrowLeft class="w-4 h-4" />
          Back to login
        </router-link>
      </div>
    </div>
  </div>
</template>
