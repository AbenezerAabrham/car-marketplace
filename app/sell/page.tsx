import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SellForm from '@/components/sell-form'

export default async function SellPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/sell')
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <SellForm />
    </main>
  )
}
