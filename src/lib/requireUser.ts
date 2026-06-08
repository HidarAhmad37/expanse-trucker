import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireUser(): Promise<{ user: User; error: null } | { user: null; error: Error }> {
  const user = await getCurrentUser()
  if (!user) return { user: null, error: new Error('Not authenticated') }
  return { user, error: null }
}
