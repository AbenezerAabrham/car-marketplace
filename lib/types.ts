export interface ListingPhoto {
  storage_path: string
  is_plate_photo?: boolean
  sort_order: number
}

export interface ListingUser {
  phone?: string
  display_name?: string
  email_verified_at: string | null
  report_count: number
}

export interface Listing {
  id: string
  user_id?: string
  make: string
  model: string
  year: number
  price_etb: number | string
  mileage_km: number | string
  location_region: string
  location_city: string
  condition: string
  description?: string | null
  vin?: string | null
  plate_number?: string | null
  plate_verified: boolean
  plate_ocr_confidence?: number | null
  plate_verification_status?: string
  attribute_fingerprint?: string
  status?: string
  created_at?: string
  listing_photos?: ListingPhoto[] | null
  users?: ListingUser | null
}
