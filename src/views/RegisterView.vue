<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Wallet, Mail, Lock, User } from '@lucide/vue'

const auth = useAuthStore()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const signupData = ref<{ session: unknown } | null>(null)

async function handleRegister() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  const { data, error: authError } = await auth.signUp(email.value, password.value, fullName.value)
  signupData.value = data
  loading.value = false

  if (authError) {
    if (authError.message.includes('Database error saving new user')) {
      error.value = 'Auth trigger is blocking signup. Run supabase/fix_signup.sql in Supabase SQL Editor (it removes the broken trigger), then try again.'
    } else {
      error.value = authError.message
    }
  } else if (!data.session) {
    success.value = true
    error.value = ''
    // Email confirmation enabled — user must confirm then sign in
  } else {
    success.value = true
    setTimeout(() => router.push('/'), 1500)
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
        <p class="text-surface-500 mt-2">Start tracking your expenses today</p>
      </div>

      <div class="glass-card p-8">
        <div v-if="success" class="text-center py-8">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-emerald-400 mb-2">Account created!</h2>
          <p class="text-surface-500">
            {{ signupData?.session ? 'Redirecting to dashboard...' : 'Check your email to confirm your account, then sign in.' }}
          </p>
          <router-link
            v-if="!signupData?.session"
            to="/login"
            class="btn-primary inline-block mt-4"
          >
            Go to Login
          </router-link>
        </div>

        <template v-else>
          <h2 class="text-xl font-semibold mb-6">Create your account</h2>

          <form class="space-y-5" @submit.prevent="handleRegister">
            <div>
              <label class="label">Full Name</label>
              <div class="relative">
                <User class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 pointer-events-none" />
                <input
                  v-model="fullName"
                  type="text"
                  required
                  placeholder="John Doe"
                  class="input-field pr-11"
                />
              </div>
            </div>

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
              <label class="label">Password</label>
              <div class="relative">
                <Lock class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 pointer-events-none" />
                <input
                  v-model="password"
                  type="password"
                  required
                  minlength="6"
                  placeholder="At least 6 characters"
                  class="input-field pr-11"
                />
              </div>
            </div>

            <p v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {{ error }}
            </p>

            <button type="submit" class="btn-primary w-full" :disabled="loading">
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>

          <p class="text-center text-sm text-surface-500 mt-6">
            Already have an account?
            <router-link to="/login" class="text-brand-400 hover:underline font-medium">
              Sign in
            </router-link>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
