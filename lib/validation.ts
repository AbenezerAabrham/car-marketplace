import { z } from 'zod'

export const listingSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  priceEtb: z.number().positive().max(100_000_000),
  mileageKm: z.number().int().min(0).max(2_000_000),
  locationRegion: z.string().min(1).max(50),
  locationCity: z.string().min(1).max(50),
  condition: z.enum(['new', 'used_excellent', 'used_good', 'used_fair']),
  description: z.string().max(2000).optional(),
  vin: z.string().length(17).optional(),
})
