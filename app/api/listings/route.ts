import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listingSchema } from '@/lib/validation'
import { attributeFingerprint, perceptualHash, hammingDistance } from '@/lib/fingerprint'
import crypto from 'crypto'

const PHASH_DUPLICATE_THRESHOLD = 8

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', authUser.id).single()
  if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  const formData = await req.formData()
  const parsed = listingSchema.safeParse({
    make: formData.get('make'),
    model: formData.get('model'),
    year: Number(formData.get('year')),
    priceEtb: Number(formData.get('priceEtb')),
    mileageKm: Number(formData.get('mileageKm')),
    locationRegion: formData.get('locationRegion'),
    locationCity: formData.get('locationCity'),
    condition: formData.get('condition'),
    description: formData.get('description') || undefined,
    vin: formData.get('vin') || undefined,
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const input = parsed.data

  const photos = formData.getAll('photos') as File[]
  if (photos.length === 0) return NextResponse.json({ error: 'At least one photo required' }, { status: 400 })

  const fingerprint = attributeFingerprint({
    make: input.make, model: input.model, year: input.year,
    mileageKm: input.mileageKm, priceEtb: input.priceEtb, region: input.locationRegion,
  })

  const { data: attrMatches } = await supabase
    .from('listings').select('id')
    .eq('attribute_fingerprint', fingerprint).eq('status', 'active').neq('user_id', dbUser.id)

  const initialStatus = attrMatches?.length ? 'flagged' : 'active'

  const { data: listing, error: insertError } = await supabase
    .from('listings')
    .insert({
      user_id: dbUser.id, make: input.make, model: input.model, year: input.year,
      price_etb: input.priceEtb, mileage_km: input.mileageKm,
      location_region: input.locationRegion, location_city: input.locationCity,
      condition: input.condition, description: input.description, vin: input.vin,
      attribute_fingerprint: fingerprint, status: initialStatus,
    })
    .select().single()

  if (insertError || !listing) return NextResponse.json({ error: insertError?.message }, { status: 500 })

  if (attrMatches?.length) {
    await supabase.from('duplicate_flags').insert(
      attrMatches.map(m => ({ listing_id: listing.id, matched_listing_id: m.id, match_type: 'attribute' }))
    )
  }

  let sortOrder = 0
  for (const photo of photos) {
    const buffer = Buffer.from(await photo.arrayBuffer())
    const phash = await perceptualHash(buffer)
    const path = `${dbUser.id}/${listing.id}/${crypto.randomUUID()}.jpg`

    await supabase.storage.from('listing-photos').upload(path, buffer, { contentType: photo.type })

    const { data: existing } = await supabase
      .from('listing_photos').select('id, listing_id, perceptual_hash').neq('listing_id', listing.id)

    const imageMatches = (existing ?? []).filter(p => hammingDistance(p.perceptual_hash, phash) <= PHASH_DUPLICATE_THRESHOLD)

    await supabase.from('listing_photos').insert({ listing_id: listing.id, storage_path: path, perceptual_hash: phash, sort_order: sortOrder++ })

    if (imageMatches.length) {
      await supabase.from('duplicate_flags').insert(
        imageMatches.map(m => ({ listing_id: listing.id, matched_listing_id: m.listing_id, match_type: 'image' }))
      )
      await supabase.from('listings').update({ status: 'flagged' }).eq('id', listing.id)
    }
  }

  return NextResponse.json({ listing, flagged: initialStatus === 'flagged' })
}
