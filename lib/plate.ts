/**
 * Ethiopian license plate normalization.
 * Accepts formats like AA-12345, AA 12345, 03-AA-12345, OR-1234, etc.
 */
export function normalizePlate(plate: string): string | null {
  const cleaned = plate.replace(/[\s\-_.]/g, '').toUpperCase()
  if (!cleaned || cleaned.length < 4 || cleaned.length > 12) return null

  // Common patterns: AA12345, OR1234, 03AA12345
  if (!/^[A-Z0-9]+$/.test(cleaned)) return null
  if (!/[A-Z]/.test(cleaned) || !/\d/.test(cleaned)) return null

  return cleaned
}

/** Extract the most plate-like token from OCR text */
export function extractPlateFromOcrText(text: string): string | null {
  const candidates = text
    .toUpperCase()
    .replace(/[^A-Z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .flatMap(chunk => chunk.split('-'))
    .map(normalizePlate)
    .filter((c): c is string => c !== null)

  if (candidates.length === 0) {
    const joined = normalizePlate(text.replace(/[^A-Za-z0-9]/g, ''))
    return joined
  }

  // Prefer longer alphanumeric matches (full plates beat partial noise)
  return candidates.sort((a, b) => b.length - a.length)[0] ?? null
}

export function platesMatch(inputPlate: string, ocrText: string): boolean {
  const input = normalizePlate(inputPlate)
  const detected = extractPlateFromOcrText(ocrText)
  if (!input || !detected) return false
  if (input === detected) return true

  // Allow 1-character OCR error on plates 5+ chars
  if (input.length >= 5 && detected.length >= 5) {
    return levenshtein(input, detected) <= 1
  }
  return false
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}
