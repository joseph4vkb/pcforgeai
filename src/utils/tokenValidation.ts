/**
 * Decode a JWT token without verifying the signature.
 * This is safe for client-side validation of expiration only.
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a JWT token is valid (not expired).
 * This only checks expiration time, not signature validity.
 * @param token The JWT token to validate
 * @returns true if the token is valid and not expired, false otherwise
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return false;
  }

  // Check if token has an expiration time
  if (!payload.exp) {
    // If no expiration, consider it valid (though this shouldn't happen in our app)
    return true;
  }

  // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime;
}
