/** Normalize Ethiopian phone numbers to E.164 (+251...) */
export function normalizeEthiopianPhone(phone: string): string | null {
  let normalized = phone.replace(/\s+/g, '').replace(/-/g, '')

  if (normalized.startsWith('+')) normalized = normalized.slice(1)
  if (normalized.startsWith('0')) normalized = '251' + normalized.slice(1)
  if (!normalized.startsWith('251')) normalized = '251' + normalized

  if (!/^251\d{9}$/.test(normalized)) return null
  return '+' + normalized
}

export function isPhoneVerificationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED === 'true'
}
