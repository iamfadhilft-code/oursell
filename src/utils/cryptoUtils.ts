/**
 * OURSELL Cryptographic Utilities
 * Production-ready SHA-256 password hashing and verification.
 * Works seamlessly in both Node.js (server runtime) and modern browsers (Web Crypto API).
 */

export async function hashPassword(
  password: string,
  customSalt?: string
): Promise<{ hash: string; salt: string }> {
  // Generate a cryptographically random salt if not provided
  let salt = customSalt;
  if (!salt) {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      salt = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      salt = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    }
  }

  const combined = password + salt;

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return { hash: hashHex, salt };
  } else {
    // Dynamic import for Node.js if subtle is not present
    const nodeCrypto = await import('crypto');
    const hashHex = nodeCrypto.createHash('sha256').update(combined).digest('hex');
    return { hash: hashHex, salt };
  }
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string = ''
): Promise<boolean> {
  if (!password || !storedHash) return false;
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}
