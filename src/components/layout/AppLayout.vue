<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CalculatorModal from '@/components/ui/CalculatorModal.vue'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  HandCoins,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
} from '@lucide/vue'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)
const calculatorOpen = ref(false)

const navItems = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
  { name: 'Budgets', to: '/budgets', icon: PiggyBank },
  { name: 'Loans', to: '/loans', icon: HandCoins },
  { name: 'Reports', to: '/reports', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  await auth.signOut()
}

function onGlobalKeydown(e: KeyboardEvent) {
  // Toggle calculator: Ctrl + Shift (no extra key)
  if (!e.ctrlKey || !e.shiftKey) return

  // Prevent accidental open while toggling modifiers: only trigger on actual Shift press.
  if (e.key !== 'Shift') return

  e.preventDefault()
  calculatorOpen.value = !calculatorOpen.value
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 glass border-r border-surface-700/50">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-surface-700/50">
        <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
          <Wallet class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="font-bold text-lg text-surface-100">SpendWise</h1>
          <p class="text-xs text-surface-500">Track every penny</p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="isActive(item.to)
            ? 'bg-brand-600/20 text-brand-400 shadow-sm'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.name }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-surface-700/50">
        <div class="flex items-center gap-3 px-2 mb-3">
          <div class="w-9 h-9 rounded-full bg-linear-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-sm font-bold text-white">
            {{ auth.profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-200 truncate">
              {{ auth.profile?.full_name ?? 'User' }}
            </p>
            <p class="text-xs text-surface-500 truncate">{{ auth.user?.email }}</p>
          </div>
        </div>
        <button
          class="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Overlay -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Mobile Sidebar -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="sidebarOpen"
        class="lg:hidden fixed inset-y-0 left-0 z-50 w-72 glass border-r border-surface-700/50 flex flex-col"
      >
        <div class="flex items-center justify-between px-6 py-5 border-b border-surface-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Wallet class="w-5 h-5 text-white" />
            </div>
            <h1 class="font-bold text-lg">SpendWise</h1>
          </div>
          <button class="p-2 rounded-lg hover:bg-surface-700" @click="sidebarOpen = false">
            <X class="w-5 h-5" />
          </button>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="isActive(item.to)
              ? 'bg-brand-600/20 text-brand-400'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'"
            @click="sidebarOpen = false"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </router-link>
        </nav>
      </aside>
    </Transition>

    <!-- Main Content -->
    <div class="flex-1 lg:ml-64 relative">
      <!-- Mobile Header -->
      <header class="lg:hidden sticky top-0 z-30 glass border-b border-surface-700/50 px-4 py-3 flex items-center gap-3">
        <button class="p-2 rounded-lg hover:bg-surface-800" @click="sidebarOpen = true">
          <Menu class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2">
          <Wallet class="w-5 h-5 text-brand-400" />
          <span class="font-bold">SpendWise</span>
        </div>
      </header>

      <main class="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <RouterView />
      </main>

      <!-- Floating calculator button -->
      <button
        class="fixed bottom-4 right-4 z-40 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/40 px-4 py-3 text-sm font-medium flex items-center gap-2"
        type="button"
        @click="calculatorOpen = true"
      >
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-xs font-bold">
          C
        </span>
        <span>Calculator</span>
      </button>
    </div>

    <CalculatorModal :show="calculatorOpen" @close="calculatorOpen = false" />
  </div>
</template>
