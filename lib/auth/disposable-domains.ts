// Common disposable / relay email domains — expand as needed
const BLOCKED_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'tempmail.com',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'dispostable.com',
  'maildrop.cc',
  'getnada.com',
  'trashmail.com',
  '10minutemail.com',
  'tempail.com',
  'fakeinbox.com',
  'mintemail.com',
  'emailondeck.com',
  'burnermail.io',
  'mailnesia.com',
  'mytemp.email',
  'tmpmail.net',
  'tmpmail.org',
  'discard.email',
  'mailcatch.com',
  'inboxkitten.com',
  'harakirimail.com',
  'mailsac.com',
  'mailpoof.com',
])

export function isBlockedEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1]
  if (!domain) return true
  if (BLOCKED_DOMAINS.has(domain)) return true
  // Block plus-address abuse on suspicious patterns is optional; keep simple for now
  return false
}
