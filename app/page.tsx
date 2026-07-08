import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/listing-card'

const REGIONS = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'SNNPR', 'Sidama', 'Somali', 'Afar']

export default async function HomePage({ searchParams }: { searchParams: Promise<{ make?: string; region?: string; maxPrice?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('listings')
    .select('*, listing_photos(storage_path, sort_order), users(email_verified_at, report_count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (params.make) query = query.ilike('make', `%${params.make}%`)
  if (params.region) query = query.eq('location_region', params.region)
  if (params.maxPrice) query = query.lte('price_etb', Number(params.maxPrice))

  const { data: listings } = await query.limit(30)

  return (
    <div className="space-y-10">
      {/* Visual Hero Banner */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            ✨ Verified & Middleman-Free
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white max-w-4xl mx-auto">
            Find Your Next Car Without The <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Broker Fees</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            MekinaMarket uses smart digital fingerprints and duplicate image hashing to catch and block reposted vehicles. Directly connect with genuine private sellers.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Search Panel Card */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-slate-800/60 -mt-16 relative z-20">
          <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" method="get">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Make or Brand</label>
              <input 
                name="make" 
                defaultValue={params.make} 
                placeholder="e.g. Toyota, Hyundai" 
                className="w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-950/80 focus:bg-slate-900/90 p-3 rounded-xl outline-none transition text-sm font-medium text-white placeholder-slate-600" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Region</label>
              <select 
                name="region" 
                defaultValue={params.region} 
                className="w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-950/80 focus:bg-slate-900/90 p-3 rounded-xl outline-none transition text-sm font-medium text-slate-200"
              >
                <option value="" className="bg-slate-900 text-white">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Max Price (ETB)</label>
              <input 
                name="maxPrice" 
                defaultValue={params.maxPrice} 
                type="number" 
                placeholder="e.g. 5,000,000" 
                className="w-full border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-950/80 focus:bg-slate-900/90 p-3 rounded-xl outline-none font-mono transition text-sm text-white placeholder-slate-600" 
              />
            </div>

            <div className="flex items-end">
              <button className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-orange-500/10 active:scale-98 transition duration-150 text-sm cursor-pointer">
                🔍 Filter Listings
              </button>
            </div>
          </form>
        </div>

        {/* Listings Feed Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-white">Active Listings</h2>
          <span className="text-xs text-slate-500 font-semibold">{listings?.length || 0} vehicle(s) found</span>
        </div>

        {/* Grid and listings */}
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-850 rounded-2xl shadow-sm space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-base font-bold text-slate-300">No Listings Match Your Search</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try resetting your filters or widen your search criteria to discover more vehicles.</p>
          </div>
        )}
      </div>
    </div>
  )
}
