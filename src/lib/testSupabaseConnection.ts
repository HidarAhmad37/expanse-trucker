import { supabase } from './supabase'

export interface SupabaseConnectionResult {
  connected: boolean
  configured: boolean
  message: string
  checks: {
    envVars: boolean
    auth: boolean
    database: boolean
  }
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionResult> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  const checks = {
    envVars: false,
    auth: false,
    database: false,
  }

  const isPlaceholder =
    !url ||
    !key ||
    url === 'https://placeholder.supabase.co' ||
    key === 'placeholder-key'

  if (isPlaceholder) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
      checks,
    }
  }

  checks.envVars = true

  try {
    const { error: authError } = await supabase.auth.getSession()
    if (authError) {
      return {
        connected: false,
        configured: true,
        message: `Auth service unreachable: ${authError.message}`,
        checks,
      }
    }
    checks.auth = true
  } catch (err) {
    return {
      connected: false,
      configured: true,
      message: `Auth service unreachable: ${err instanceof Error ? err.message : 'Unknown error'}`,
      checks,
    }
  }

  try {
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
    if (dbError) {
      const tableMissing = dbError.message.includes('does not exist') || dbError.code === '42P01'
      return {
        connected: false,
        configured: true,
        message: tableMissing
          ? 'Connected to Supabase, but tables are missing. Run supabase/fix_signup.sql in the SQL Editor.'
          : `Database error: ${dbError.message}`,
        checks,
      }
    }
    checks.database = true
  } catch (err) {
    return {
      connected: false,
      configured: true,
      message: `Database unreachable: ${err instanceof Error ? err.message : 'Unknown error'}`,
      checks,
    }
  }

  return {
    connected: true,
    configured: true,
    message: 'Supabase is connected and ready.',
    checks,
  }
}
