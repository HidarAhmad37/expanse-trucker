import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { setupNewUser } from '@/lib/setupNewUser'
import type { Profile } from '@/types'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    loading.value = true
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    session.value = currentSession
    user.value = currentSession?.user ?? null

    if (user.value) {
      await setupNewUser()
      await fetchProfile()
    }

    supabase.auth.onAuthStateChange(async (event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null

      if (event === 'PASSWORD_RECOVERY') {
        const { default: router } = await import('@/router')
        router.push('/reset-password')
      }

      if (user.value && event !== 'PASSWORD_RECOVERY') {
        await setupNewUser()
        await fetchProfile()
      } else if (!user.value) {
        profile.value = null
      }
    })

    loading.value = false
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    profile.value = data
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (!error && data.session) {
      user.value = data.user
      session.value = data.session
      await setupNewUser(fullName)
      await fetchProfile()
    }

    return { data, error }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (!error && data.user) {
      await setupNewUser()
      await fetchProfile()
    }

    return { data, error }
  }

  async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    profile.value = null
    return { error }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user.value) return { error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.value.id)
      .select()
      .single()
    if (data) profile.value = data
    return { data, error }
  }

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated,
    initialize,
    fetchProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }
})
