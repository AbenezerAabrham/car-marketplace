import { extractPlateFromOcrText } from './plate'

type OcrResult = {
  rawText: string
  detectedPlate: string | null
  confidence: number
}

/**
 * Read plate text from an image using Google Cloud Vision (free tier: ~1k/mo).
 * Set GOOGLE_VISION_API_KEY in env. Without it, returns null.
 */
export async function readPlateFromImage(buffer: Buffer): Promise<OcrResult | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) return null

  const base64 = buffer.toString('base64')
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    console.error('Vision API error:', await response.text())
    return null
  }

  const data = await response.json()
  const annotation = data.responses?.[0]?.fullTextAnnotation
  const rawText: string = annotation?.text ?? data.responses?.[0]?.textAnnotations?.[0]?.description ?? ''

  if (!rawText.trim()) {
    return { rawText: '', detectedPlate: null, confidence: 0 }
  }

  const detectedPlate = extractPlateFromOcrText(rawText)
  // Vision doesn't give per-field confidence for TEXT_DETECTION; estimate from detection
  const confidence = detectedPlate ? 0.9 : 0.3

  return { rawText, detectedPlate, confidence }
}

export function isPlateOcrConfigured(): boolean {
  return !!process.env.GOOGLE_VISION_API_KEY
}
