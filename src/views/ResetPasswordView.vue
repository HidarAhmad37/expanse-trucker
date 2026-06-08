<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { Wallet, Lock } from '@lucide/vue'

const auth = useAuthStore()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const ready = ref(false)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  ready.value = !!session
  if (!session) {
    error.value = 'Invalid or expired reset link. Please request a new one.'
  }
})

async function handleUpdate() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  const { error: authError } = await auth.updatePassword(password.value)
  loading.value = false

  if (authError) {
    error.value = authError.message
  } else {
    router.push('/')
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
        <p class="text-surface-500 mt-2">Set a new password</p>
      </div>

      <div class="glass-card p-8">
        <h2 class="text-xl font-semibold mb-6">Create new password</h2>

        <form v-if="ready" class="space-y-5" @submit.prevent="handleUpdate">
          <div>
            <label class="label">New Password</label>
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

          <div>
            <label class="label">Confirm Password</label>
            <div class="relative">
              <Lock class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 pointer-events-none" />
              <input
                v-model="confirmPassword"
                type="password"
                required
                placeholder="Repeat password"
                class="input-field pr-11"
              />
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {{ error }}
          </p>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Updating...' : 'Update Password' }}
          </button>
        </form>

        <div v-else class="text-center py-4">
          <p class="text-sm text-red-400 mb-4">{{ error }}</p>
          <router-link to="/forgot-password" class="btn-primary inline-block">
            Request New Link
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
