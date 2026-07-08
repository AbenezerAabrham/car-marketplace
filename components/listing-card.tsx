import Link from 'next/link'
import Image from 'next/image'
import TrustStrip from './trust-strip'

export default function ListingCard({ listing }: { listing: any }) {
  const photo = listing.listing_photos?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
  const photoUrl = photo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${photo.storage_path}`
    : null

  return (
    <Link 
      href={`/listings/${listing.id}`} 
      className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden block shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:border-amber-500/40 hover:-translate-y-1 transition duration-300"
    >
      <div className="relative w-full h-48 bg-slate-950 overflow-hidden">
        {photoUrl ? (
          <Image 
            src={photoUrl} 
            alt={`${listing.make} ${listing.model}`} 
            fill 
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-900 to-slate-950">
            <span className="text-3xl">🚗</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">No Photo Available</span>
          </div>
        )}
        
        {/* Floating location tag */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-800">
          📍 {listing.location_city}
        </div>

        {/* Condition tag */}
        <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-sm text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-slate-800">
          {listing.condition === 'new' ? 'New' : 'Used'}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-400 transition duration-150">
            {listing.make} {listing.model} 
            <span className="text-xs font-semibold text-slate-500 ml-1.5 font-mono">
              &apos;{String(listing.year).slice(-2)}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold">{listing.location_region} Region</p>
        </div>

        <div className="flex items-baseline justify-between border-t border-slate-800/60 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Price</span>
            <span className="font-black text-amber-500 text-base font-mono">
              {Number(listing.price_etb).toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mileage</span>
            <span className="text-xs font-bold text-slate-300 font-mono">
              {Number(listing.mileage_km).toLocaleString()} km
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px]">
          <span className="text-slate-500 font-medium">Verification Status:</span>
          <TrustStrip 
            userVerified={!!listing.users?.email_verified_at} 
            reportCount={listing.users?.report_count ?? 0} 
          />
        </div>
      </div>
    </Link>
  )
}
