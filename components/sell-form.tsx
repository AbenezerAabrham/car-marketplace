'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REGIONS = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'SNNPR', 'Sidama', 'Somali', 'Afar']

const inputClass = "w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 bg-slate-950/80 focus:bg-slate-900/90 p-3 rounded-xl outline-none transition text-sm text-slate-100 placeholder-slate-600"
const selectClass = "w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 bg-slate-950/80 focus:bg-slate-900/90 p-3 rounded-xl outline-none transition text-sm text-slate-200"
const labelClass = "text-xs font-semibold text-slate-400"

export default function SellForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/listings', { method: 'POST', body: new FormData(e.currentTarget) })
      const data = await res.json()
      setSubmitting(false)
      if (!res.ok) return setError(typeof data.error === 'string' ? data.error : 'Please verify all fields and try again.')
      setSuccess(true)
      router.push(`/listings/${data.listing.id}`)
    } catch {
      setSubmitting(false)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight text-white">List Your Vehicle</h1>
        <p className="text-sm text-slate-500">Our fingerprinting system will automatically flag duplicate or reposted listings to protect buyers from middlemen.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Specs */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Basic Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Make</label>
              <input name="make" placeholder="e.g. Toyota" required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Model</label>
              <input name="model" placeholder="e.g. Land Cruiser" required className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Year</label>
              <input name="year" type="number" min={1950} max={new Date().getFullYear() + 1} placeholder="e.g. 2020" required className={`${inputClass} font-mono`} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Mileage (km)</label>
              <input name="mileageKm" type="number" min={0} placeholder="e.g. 45000" required className={`${inputClass} font-mono`} />
            </div>
          </div>
        </div>

        <hr className="border-slate-800/60" />

        {/* Pricing & Location */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Pricing & Location</h2>
          <div className="space-y-1.5">
            <label className={labelClass}>Price (ETB)</label>
            <div className="relative">
              <input name="priceEtb" type="number" min={1} placeholder="e.g. 2500000" required className={`${inputClass} pr-14 font-mono`} />
              <div className="absolute right-3 top-3 text-xs font-bold text-amber-500/60">ETB</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Region</label>
              <select name="locationRegion" required className={selectClass}>
                <option value="" className="bg-slate-900">Select Region</option>
                {REGIONS.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>City</label>
              <input name="locationCity" placeholder="e.g. Addis Ababa" required className={inputClass} />
            </div>
          </div>
        </div>

        <hr className="border-slate-800/60" />

        {/* Condition & Details */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Condition & Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Condition</label>
              <select name="condition" required className={selectClass}>
                <option value="" className="bg-slate-900">Select Condition</option>
                <option value="new" className="bg-slate-900">New (Zero km)</option>
                <option value="used_excellent" className="bg-slate-900">Used — Excellent</option>
                <option value="used_good" className="bg-slate-900">Used — Good</option>
                <option value="used_fair" className="bg-slate-900">Used — Fair</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>VIN <span className="font-normal text-slate-600">(optional)</span></label>
              <input name="vin" placeholder="17-char VIN" maxLength={17} className={`${inputClass} font-mono uppercase tracking-wider`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Description</label>
            <textarea name="description" placeholder="Describe the car's features, history, and any known issues..." rows={4} className={`${inputClass} resize-none`} />
          </div>
        </div>

        <hr className="border-slate-800/60" />

        {/* Photo Upload */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Photos</h2>
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-800 border-dashed rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 hover:border-amber-500/40 transition duration-200 group">
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-3xl group-hover:scale-110 transition duration-200">📷</span>
              <p className="text-xs font-semibold text-slate-400 group-hover:text-amber-400 transition">
                {photoCount > 0 ? `${photoCount} file(s) selected ✓` : 'Click to select photos'}
              </p>
              <p className="text-[10px] text-slate-600">JPEG or PNG — multiple allowed</p>
            </div>
            <input name="photos" type="file" accept="image/*" multiple required onChange={e => setPhotoCount(e.target.files?.length || 0)} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl">
            <p className="text-xs font-medium text-red-400">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting || success} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] transition duration-150 disabled:opacity-50">
          {submitting ? '🔍 Verifying & Posting...' : 'Submit Listing →'}
        </button>
      </form>
    </div>
  )
}
