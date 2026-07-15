'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeEthiopianPhone, isPhoneVerificationEnabled } from '@/lib/phone'

type Props = {
  currentPhone: string | null
  phoneVerifiedAt: string | null
}

export default function PhoneVerification({ currentPhone, phoneVerifiedAt }: Props) {
  const supabase = createClient()
  const enabled = isPhoneVerificationEnabled()

  const [phone, setPhone] = useState(currentPhone?.replace(/^\+251/, '0') ?? '')
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState<'idle' | 'otp'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const verified = !!phoneVerifiedAt

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!enabled) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    const normalized = normalizeEthiopianPhone(phone)
    if (!normalized) {
      setLoading(false)
      return setError('Invalid phone. Use +251912345678 or 0912345678')
    }

    const { error } = await supabase.auth.updateUser({ phone: normalized })
    setLoading(false)

    if (error) return setError(error.message)
    setStage('otp')
    setSuccess(`Code sent to ${normalized}`)
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!enabled) return

    setLoading(true)
    setError(null)

    const normalized = normalizeEthiopianPhone(phone)
    if (!normalized) {
      setLoading(false)
      return setError('Invalid phone number')
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp,
      type: 'phone_change',
    })

    if (error || !data.user) {
      setLoading(false)
      return setError(error?.message ?? 'Invalid code')
    }

    await supabase
      .from('users')
      .update({
        phone: normalized,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('auth_id', data.user.id)

    setLoading(false)
    setSuccess('Phone verified successfully')
    setStage('idle')
    window.location.reload()
  }

  const inputClass =
    'w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 bg-slate-950/80 p-3 rounded-xl outline-none transition text-sm text-slate-100 placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Phone Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            One verified phone per account — required to list cars when enabled
          </p>
        </div>
        {verified && (
          <span className="text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 py-1 px-2.5 rounded-full">
            ✓ Verified
          </span>
        )}
      </div>

      {!enabled && (
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg opacity-50">📱</span>
            <p className="text-xs font-semibold text-slate-400">Coming soon</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            SMS verification via Twilio will be enabled when ready.             Set <code className="text-slate-500">NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED=true</code> and configure Twilio in Supabase Auth → Phone.
          </p>
          <button
            type="button"
            disabled
            className="w-full py-3 rounded-xl bg-slate-800/50 text-slate-500 text-sm font-bold cursor-not-allowed opacity-60"
          >
            Verify Phone (Coming Soon)
          </button>
        </div>
      )}

      {enabled && !verified && (
        <form onSubmit={stage === 'otp' ? verifyOtp : sendOtp} className="space-y-3">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+251912345678 or 0912345678"
            type="tel"
            disabled={stage === 'otp'}
            className={`${inputClass} font-mono`}
          />
          {stage === 'otp' && (
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              required
              className={`${inputClass} text-center tracking-widest font-mono`}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Please wait...' : stage === 'otp' ? 'Verify Code' : 'Send Verification Code'}
          </button>
          {stage === 'otp' && (
            <button
              type="button"
              onClick={() => { setStage('idle'); setOtp('') }}
              className="w-full text-xs text-slate-500 hover:text-slate-300"
            >
              ← Change number
            </button>
          )}
        </form>
      )}

      {enabled && verified && currentPhone && (
        <p className="text-sm font-mono text-slate-300">{currentPhone}</p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-400">{success}</p>
      )}
    </div>
  )
}
