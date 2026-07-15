import { createClient } from '@/lib/supabase/client'

type AuthUser = {
  id: string
  email?: string
  email_confirmed_at?: string
  user_metadata?: Record<string, string>
}

export async function ensureUserProfile(
  supabase: ReturnType<typeof createClient>,
  user: AuthUser
) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (existing) return existing

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: user.id,
      email: user.email!,
      display_name: displayName,
      email_verified_at: user.email_confirmed_at
        ? new Date(user.email_confirmed_at).toISOString()
        : new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
