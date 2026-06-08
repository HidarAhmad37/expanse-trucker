<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { testSupabaseConnection, type SupabaseConnectionResult } from '@/lib/testSupabaseConnection'
import { Wallet, Mail, Lock, Wifi, CheckCircle, XCircle } from '@lucide/vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const testingConnection = ref(false)
const connectionResult = ref<SupabaseConnectionResult | null>(null)

async function handleTestConnection() {
  testingConnection.value = true
  connectionResult.value = null
  connectionResult.value = await testSupabaseConnection()
  testingConnection.value = false
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  const { error: authError } = await auth.signIn(email.value, password.value)
  loading.value = false

  if (authError) {
    error.value = authError.message
  } else {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
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
        <p class="text-surface-500 mt-2">Take control of your money</p>
      </div>

      <div class="glass-card p-8">
        <h2 class="text-xl font-semibold mb-6">Welcome back</h2>

        <form class="space-y-5" @submit.prevent="handleLogin">
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

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="label mb-0">Password</label>
              <router-link to="/forgot-password" class="text-xs text-brand-400 hover:underline">
                Forgot password?
              </router-link>
            </div>
            <div class="relative">
              <Lock class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 pointer-events-none" />
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="input-field pr-11"
              />
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {{ error }}
          </p>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <button
            type="button"
            class="btn-secondary w-full flex items-center justify-center gap-2"
            :disabled="testingConnection"
            @click="handleTestConnection"
          >
            <Wifi class="w-4 h-4" />
            {{ testingConnection ? 'Testing...' : 'Test Supabase Connection' }}
          </button>

          <div
            v-if="connectionResult"
            class="p-4 rounded-xl border flex gap-3"
            :class="connectionResult.connected
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'"
          >
            <CheckCircle v-if="connectionResult.connected" class="w-5 h-5 shrink-0 mt-0.5" />
            <XCircle v-else class="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-sm">{{ connectionResult.connected ? 'Connected' : 'Not Connected' }}</p>
              <p class="text-xs mt-1 opacity-90">{{ connectionResult.message }}</p>
              <div class="flex flex-wrap gap-2 mt-2 text-xs">
                <span :class="connectionResult.checks.envVars ? 'text-emerald-400' : 'text-red-400'">
                  Env vars {{ connectionResult.checks.envVars ? '✓' : '✗' }}
                </span>
                <span :class="connectionResult.checks.auth ? 'text-emerald-400' : 'text-red-400'">
                  Auth {{ connectionResult.checks.auth ? '✓' : '✗' }}
                </span>
                <span :class="connectionResult.checks.database ? 'text-emerald-400' : 'text-red-400'">
                  Database {{ connectionResult.checks.database ? '✓' : '✗' }}
                </span>
              </div>
            </div>
          </div>
        </form>

        <p class="text-center text-sm text-surface-500 mt-6">
          Don't have an account?
          <router-link to="/register" class="text-brand-400 hover:underline font-medium">
            Create one
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
