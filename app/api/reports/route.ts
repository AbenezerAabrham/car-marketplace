import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', authUser.id).single()
  const { listingId, reportedUserId, reason } = await req.json()
  if (!reason?.trim()) return NextResponse.json({ error: 'Reason required' }, { status: 400 })

  const { error } = await supabase.from('reports').insert({
    listing_id: listingId, reported_user_id: reportedUserId, reporter_id: dbUser?.id, reason,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (reportedUserId) await supabase.rpc('increment_report_count', { target_user_id: reportedUserId })

  return NextResponse.json({ ok: true })
}
