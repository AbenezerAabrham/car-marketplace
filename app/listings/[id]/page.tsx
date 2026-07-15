import { createClient } from '@/lib/supabase/server'
import ContactButtons from '@/components/contact-buttons'
import ReportButton from '@/components/report-button'
import TrustStrip from '@/components/trust-strip'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order, is_plate_photo), users(phone, display_name, email_verified_at, report_count)')
    .eq('id', id).single()

  if (!listing) return notFound()

  const photos = (listing.listing_photos ?? [])
    .filter((p: { is_plate_photo?: boolean }) => !p.is_plate_photo)
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  const seller = listing.users
  
  const mainPhotoUrl = photos[0]
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${photos[0].storage_path}`
    : null

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          ← Back to listings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Photos & Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              {mainPhotoUrl ? (
                <Image 
                  src={mainPhotoUrl} 
                  alt={`${listing.make} ${listing.model}`} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-4xl">🚗</span>
                  <span className="text-xs font-bold uppercase tracking-wider mt-2">No Photo</span>
                </div>
              )}
            </div>
            
            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {photos.slice(1).map((p: any) => (
                  <div key={p.storage_path} className="relative h-24 bg-slate-950 rounded-xl overflow-hidden shadow-sm border border-slate-800 hover:opacity-90 transition cursor-pointer">
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${p.storage_path}`} 
                      alt={`${listing.make} ${listing.model}`} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Specifications Grid */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 shadow-lg space-y-6">
            <h2 className="text-base font-bold text-white tracking-tight">Specifications</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Condition</span>
                <p className="text-sm font-bold text-slate-100 capitalize">
                  {listing.condition.replace('_', ' ')}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year</span>
                <p className="text-sm font-bold text-slate-100 font-mono">
                  {listing.year}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mileage</span>
                <p className="text-sm font-bold text-slate-100 font-mono">
                  {listing.mileage_km.toLocaleString()} km
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region</span>
                <p className="text-sm font-bold text-slate-100">
                  {listing.location_region}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</span>
                <p className="text-sm font-bold text-slate-100">
                  {listing.location_city}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plate</span>
                <p className="text-sm font-bold text-amber-400/80 font-mono uppercase tracking-wider">
                  {listing.plate_number
                    ? listing.plate_verified
                      ? `${String(listing.plate_number).slice(0, 2)}•••${String(listing.plate_number).slice(-2)}`
                      : listing.plate_number
                    : 'N/A'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-0.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">VIN</span>
                <p className="text-sm font-bold text-amber-400/80 font-mono uppercase tracking-wider">
                  {listing.vin || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Description Card */}
          {listing.description && (
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 shadow-lg space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">Seller Description</h2>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Title, Price & Contact Sidebar */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 shadow-lg space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                {listing.make} {listing.model}
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Posted on {new Date(listing.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70 block mb-0.5">Asking Price</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {Number(listing.price_etb).toLocaleString()} <span className="text-sm font-bold">ETB</span>
              </span>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 shadow-lg space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Seller Information</h2>
            
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center text-lg shadow-lg uppercase">
                {(seller?.display_name || "S").slice(0, 1)}
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold text-slate-100 leading-none">
                  {seller?.display_name || 'Private Seller'}
                </p>
                <div className="flex items-center">
                  <TrustStrip 
                    userVerified={!!seller?.email_verified_at} 
                    reportCount={seller?.report_count ?? 0}
                    plateVerified={!!listing.plate_verified}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <ContactButtons 
                phone={seller?.phone ?? ''} 
                listingTitle={`${listing.make} ${listing.model} (${listing.year})`} 
              />
            </div>
          </div>

          {/* Reporting Options */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-4 shadow-lg text-center">
            <ReportButton listingId={listing.id} reportedUserId={listing.user_id} />
          </div>
        </div>
      </div>
    </main>
  )
}
