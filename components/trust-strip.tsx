export default function TrustStrip({
  userVerified,
  reportCount,
  plateVerified,
}: {
  userVerified: boolean
  reportCount: number
  plateVerified?: boolean
}) {
  if (reportCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-900/60 py-0.5 px-2 rounded-full">
        ⚠️ {reportCount} report{reportCount > 1 ? 's' : ''}
      </span>
    )
  }

  if (plateVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 py-0.5 px-2 rounded-full">
        🔢 Plate Verified
      </span>
    )
  }
  
  if (userVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 py-0.5 px-2 rounded-full">
        🛡️ Verified Seller
      </span>
    )
  }
  
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60 py-0.5 px-2 rounded-full">
      👤 Unverified
    </span>
  )
}
