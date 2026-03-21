export function generateSessionToken() {
  return crypto.randomUUID()
}