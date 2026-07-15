'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isBlockedEmail } from '@/lib/auth/disposable-domains'
import { ensureUserProfile } from '@/lib/auth/ensure-profile'

function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute = searchParams.get('next') || '/'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [stage, setStage] = useState<'main' | 'otp'>('main')
  const [error, setError] = useState<string | null>(
    authError === 'auth_failed' ? 'Sign in failed. Please try again.' : null
  )
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextRoute)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function sendEmailOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (isBlockedEmail(email)) {
      return setError('Temporary or disposable email addresses are not allowed. Use Google or a real email.')
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setStage('otp')
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error || !data.user) {
      setLoading(false)
      return setError(error?.message ?? 'Invalid verification code')
    }

    try {
      await ensureUserProfile(supabase, data.user)
      if (displayName.trim()) {
        await supabase
          .from('users')
          .update({ display_name: displayName.trim() })
          .eq('auth_id', data.user.id)
      }
    } catch {
      // Profile may already exist from trigger; continue
    }

    setLoading(false)
    router.push(nextRoute)
    router.refresh()
  }

  const inputClass =
    'w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 bg-slate-950/80 focus:bg-slate-900/90 p-3.5 rounded-xl outline-none transition text-sm text-slate-100 placeholder-slate-600'
  const buttonClass =
    'w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] transition duration-150 disabled:opacity-60'

  return (
    <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl shadow-black/30 p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl shadow-lg mb-1">
          {stage === 'otp' ? '✓' : '🚗'}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          {stage === 'otp' ? 'Enter Your Code' : 'Welcome to MekinaMarket'}
        </h1>
        <p className="text-xs text-slate-500">
          {stage === 'otp'
            ? `We sent a 6-digit code to ${email}`
            : 'Sign in with Google or your email to buy and sell verified cars'}
        </p>
      </div>

      {stage === 'main' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition duration-150 disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">or email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={sendEmailOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                required
                type="email"
                className={inputClass}
              />
            </div>
            <button disabled={loading} type="submit" className={buttonClass}>
              {loading ? 'Sending code...' : '→ Send Code to Email'}
            </button>
          </form>

          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Disposable and temporary email addresses are blocked. Phone verification for listing will be available soon.
          </p>
        </div>
      ) : (
        <form onSubmit={verifyEmailOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Your Name <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Abebe"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 text-center block">6-Digit Code</label>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="· · · · · ·"
              maxLength={6}
              required
              className={`${inputClass} text-center tracking-[0.5em] text-xl font-black font-mono`}
            />
          </div>
          <button disabled={loading} type="submit" className={buttonClass}>
            {loading ? 'Verifying...' : '✓ Verify & Sign In'}
          </button>
          <button
            onClick={() => { setStage('main'); setOtp('') }}
            type="button"
            className="w-full text-center text-xs text-slate-600 hover:text-slate-300 font-semibold transition"
          >
            ← Use a different email
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
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center">
            <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
