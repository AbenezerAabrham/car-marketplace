import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SellForm from '@/components/sell-form'
import { isPhoneVerificationEnabled } from '@/lib/phone'

export default async function SellPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/sell')
  }

  if (isPhoneVerificationEnabled()) {
    const { data: profile } = await supabase
      .from('users')
      .select('phone_verified_at')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (!profile?.phone_verified_at) {
      redirect('/account?verify=phone')
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <SellForm />
    </main>
  )
}
