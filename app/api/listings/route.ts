import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listingSchema } from '@/lib/validation'
import { attributeFingerprint, perceptualHash, hammingDistance } from '@/lib/fingerprint'
import { normalizePlate, platesMatch } from '@/lib/plate'
import { readPlateFromImage, isPlateOcrConfigured } from '@/lib/plate-ocr'
import crypto from 'crypto'

const PHASH_DUPLICATE_THRESHOLD = 8

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: dbUser } = await supabase.from('users').select('id, phone_verified_at').eq('auth_id', authUser.id).single()
  if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  if (process.env.NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED === 'true' && !dbUser.phone_verified_at) {
    return NextResponse.json(
      { error: 'Phone verification required before listing. Go to Account settings.' },
      { status: 403 }
    )
  }

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
    plateNumber: formData.get('plateNumber'),
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const input = parsed.data

  const plateNumber = normalizePlate(input.plateNumber)!
  const platePhoto = formData.get('platePhoto') as File | null
  if (!platePhoto || platePhoto.size === 0) {
    return NextResponse.json({ error: 'A clear photo of the license plate is required' }, { status: 400 })
  }

  const plateBuffer = Buffer.from(await platePhoto.arrayBuffer())

  // Block duplicate active listings for the same plate
  const { data: existingPlate } = await supabase
    .from('listings')
    .select('id')
    .eq('plate_number', plateNumber)
    .eq('status', 'active')
    .neq('user_id', dbUser.id)
    .maybeSingle()

  if (existingPlate) {
    return NextResponse.json(
      { error: 'This plate number is already listed by another seller.' },
      { status: 409 }
    )
  }

  // Verify plate in photo matches input via OCR
  let plateVerified = false
  let plateOcrConfidence = 0
  let plateVerificationStatus: 'verified' | 'mismatch' | 'manual_review' = 'manual_review'

  if (isPlateOcrConfigured()) {
    const ocr = await readPlateFromImage(plateBuffer)
    if (!ocr?.rawText) {
      return NextResponse.json(
        { error: 'Could not read text from plate photo. Upload a clearer, closer photo of the plate.' },
        { status: 400 }
      )
    }
    if (!platesMatch(plateNumber, ocr.rawText)) {
      return NextResponse.json(
        {
          error: `Plate mismatch: you entered "${plateNumber}" but the photo shows "${ocr.detectedPlate ?? 'unreadable'}". They must match.`,
        },
        { status: 400 }
      )
    }
    plateVerified = true
    plateOcrConfidence = ocr.confidence
    plateVerificationStatus = 'verified'
  } else if (process.env.NODE_ENV === 'development') {
    // Dev without Vision API key — allow posting but mark unverified
    plateVerificationStatus = 'manual_review'
  } else {
    return NextResponse.json(
      { error: 'Plate verification is not configured. Set GOOGLE_VISION_API_KEY.' },
      { status: 503 }
    )
  }

  const photos = formData.getAll('photos') as File[]
  if (photos.length === 0) return NextResponse.json({ error: 'At least one car photo required' }, { status: 400 })

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
      plate_number: plateNumber,
      plate_verified: plateVerified,
      plate_ocr_confidence: plateOcrConfidence,
      plate_verification_status: plateVerificationStatus,
      attribute_fingerprint: fingerprint, status: initialStatus,
    })
    .select().single()

  if (insertError || !listing) return NextResponse.json({ error: insertError?.message }, { status: 500 })

  if (attrMatches?.length) {
    await supabase.from('duplicate_flags').insert(
      attrMatches.map(m => ({ listing_id: listing.id, matched_listing_id: m.id, match_type: 'attribute' }))
    )
  }

  // Upload plate photo first (sort_order 0), then car photos
  const platePath = `${dbUser.id}/${listing.id}/plate-${crypto.randomUUID()}.jpg`
  await supabase.storage.from('listing-photos').upload(platePath, plateBuffer, { contentType: platePhoto.type })
  const platePhash = await perceptualHash(plateBuffer)
  await supabase.from('listing_photos').insert({
    listing_id: listing.id,
    storage_path: platePath,
    perceptual_hash: platePhash,
    sort_order: 0,
    is_plate_photo: true,
  })

  let sortOrder = 1
  for (const photo of photos) {
    const buffer = Buffer.from(await photo.arrayBuffer())
    const phash = await perceptualHash(buffer)
    const path = `${dbUser.id}/${listing.id}/${crypto.randomUUID()}.jpg`

    await supabase.storage.from('listing-photos').upload(path, buffer, { contentType: photo.type })

    const { data: existing } = await supabase
      .from('listing_photos').select('id, listing_id, perceptual_hash').neq('listing_id', listing.id)

    const imageMatches = (existing ?? []).filter(p => hammingDistance(p.perceptual_hash, phash) <= PHASH_DUPLICATE_THRESHOLD)

    await supabase.from('listing_photos').insert({
      listing_id: listing.id,
      storage_path: path,
      perceptual_hash: phash,
      sort_order: sortOrder++,
      is_plate_photo: false,
    })

    if (imageMatches.length) {
      await supabase.from('duplicate_flags').insert(
        imageMatches.map(m => ({ listing_id: listing.id, matched_listing_id: m.listing_id, match_type: 'image' }))
      )
      await supabase.from('listings').update({ status: 'flagged' }).eq('id', listing.id)
    }
  }

  return NextResponse.json({ listing, flagged: initialStatus === 'flagged', plateVerified })
}
