'use client'
import { useState } from 'react'

export default function ReportButton({ listingId, reportedUserId }: { listingId: string; reportedUserId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/reports', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, reportedUserId, reason }),
      })
      setSent(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="py-2 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 rounded-lg">
        ✅ Report submitted successfully. Thank you!
      </div>
    )
  }

  return open ? (
    <div className="space-y-3 text-left">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason for report</label>
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
          placeholder="e.g. Inaccurate price, duplicate listing, broker middleman, spam..." 
          required 
          rows={3}
          className="w-full border border-slate-800 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 bg-slate-950/80 focus:bg-slate-900 p-3 rounded-xl outline-none text-xs transition text-slate-300 placeholder-slate-600" 
        />
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={submit} 
          disabled={submitting || !reason.trim()}
          className="flex-1 bg-red-900/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 font-bold py-2 rounded-lg text-xs transition disabled:opacity-40"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
        <button 
          onClick={() => setOpen(false)}
          className="px-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 font-bold py-2 rounded-lg text-xs transition"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <button 
      onClick={() => setOpen(true)} 
      className="text-xs font-semibold text-slate-600 hover:text-red-400 transition duration-150 py-1"
    >
      ⚠️ Report this Listing
    </button>
  )
}
