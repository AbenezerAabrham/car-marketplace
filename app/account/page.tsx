import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PhoneVerification from '@/components/phone-verification'
import { isPhoneVerificationEnabled } from '@/lib/phone'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/account')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, phone, phone_verified_at, email_verified_at, created_at')
    .eq('auth_id', user.id)
    .maybeSingle()

  const params = await searchParams
  const phoneRequired = isPhoneVerificationEnabled() && !profile?.phone_verified_at

  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">Account</h1>
        <p className="text-sm text-slate-500">Manage your verification status</p>
      </div>

      {params.verify === 'phone' && phoneRequired && (
        <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl">
          <p className="text-xs text-amber-300 font-medium">
            Phone verification is required before you can list a car.
          </p>
        </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-200 font-medium">{profile?.display_name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-200 font-medium">{profile?.email || user.email}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Email status</dt>
              <dd>
                {profile?.email_verified_at ? (
                  <span className="text-[10px] font-bold text-emerald-400">Verified</span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500">Unverified</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <hr className="border-slate-800" />

        <PhoneVerification
          currentPhone={profile?.phone ?? null}
          phoneVerifiedAt={profile?.phone_verified_at ?? null}
        />
      </div>
    </main>
  )
}
