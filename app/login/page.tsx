'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [stage, setStage] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { shouldCreateUser: true }
    })
    setLoading(false)
    if (error) return setError(error.message)
    setStage('otp')
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error || !data.user) {
      setLoading(false)
      return setError(error?.message ?? 'Invalid verification code')
    }
    const { data: existing } = await supabase.from('users').select('id').eq('auth_id', data.user.id).maybeSingle()
    if (!existing) {
      await supabase.from('users').insert({
        auth_id: data.user.id,
        email,
        phone: phone.trim() || null,
        email_verified_at: new Date().toISOString(),
        display_name: displayName.trim() || email.split('@')[0],
      })
    }
    setLoading(false)
    router.push(nextRoute)
    router.refresh()
  }

  const inputClass = "w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 bg-slate-950/80 focus:bg-slate-900/90 p-3.5 rounded-xl outline-none transition text-sm text-slate-100 placeholder-slate-600"

  return (
    <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl shadow-black/30 p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl shadow-lg mb-1">
          ✉️
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          {stage === 'email' ? 'Welcome to MekinaMarket' : 'Check your inbox'}
        </h1>
        <p className="text-xs text-slate-500">
          {stage === 'email' 
            ? 'Sign in or register with your email. Supabase sends a free 6-digit code straight to your inbox — no SMS costs.'
            : `A 6-digit code was sent to ${email}. Enter it below to continue.`}
        </p>
      </div>

      {stage === 'email' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required type="email" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Contact Phone <span className="text-slate-600 font-normal">(optional — for WhatsApp & Telegram)</span>
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251912345678" type="tel" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Your Name <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Abebe" className={inputClass} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] transition duration-150 disabled:opacity-60">
            {loading ? 'Sending code...' : '→ Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 text-center block">6-Digit Code</label>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="· · · · · ·" maxLength={6} required className={`${inputClass} text-center tracking-[0.5em] text-xl font-black font-mono`} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition duration-150 disabled:opacity-60">
            {loading ? 'Verifying...' : '✓ Verify & Sign In'}
          </button>
          <button onClick={() => setStage('email')} type="button" className="w-full text-center text-xs text-slate-600 hover:text-slate-300 font-semibold transition">
            ← Use a different email address
          </button>
        </form>
      )}

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl">
          <p className="text-xs font-medium text-red-400 text-center">{error}</p>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center">
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
