import crypto from 'crypto'
import sharp from 'sharp'

// Attribute fingerprint: catches "same car, different account" reposts
export function attributeFingerprint(input: {
  make: string; model: string; year: number; mileageKm: number; priceEtb: number; region: string
}) {
  const normalized = [
    input.make.trim().toLowerCase(),
    input.model.trim().toLowerCase(),
    input.year,
    Math.round(input.mileageKm / 500) * 500,   // bucketed — tolerates small entry discrepancies
    Math.round(input.priceEtb / 5000) * 5000,  // bucketed to nearest 5k ETB
    input.region.trim().toLowerCase(),
  ].join('|')
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

// dHash: catches cropped/resized/recompressed reposted photos
export async function perceptualHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let hash = ''
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      hash += data[row * 9 + col] < data[row * 9 + col + 1] ? '1' : '0'
    }
  }
  return BigInt('0b' + hash).toString(16).padStart(16, '0')
}

export function hammingDistance(a: string, b: string): number {
  let xor = BigInt('0x' + a) ^ BigInt('0x' + b)
  let dist = 0
  const zero = BigInt(0)
  const one = BigInt(1)
  while (xor > zero) {
    dist += Number(xor & one)
    xor >>= one
  }
  return dist
}
