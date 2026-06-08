<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.initialize()
})
</script>

<template>
  <div v-if="auth.loading" class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-brand-600 animate-pulse" />
      <p class="text-surface-500 text-sm">Loading...</p>
    </div>
  </div>
  <RouterView v-else />
</template>
