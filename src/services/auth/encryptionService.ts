/**
 * Encryption service using Web Crypto API
 * Supports AES-256-GCM encryption for sensitive data
 */

const ALGORITHM = {
  name: 'PBKDF2',
  hash: 'SHA-256',
  iterations: 100000,
  saltLength: 16,
};

const ENCRYPTION_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(ALGORITHM.saltLength));
  return btoa(String.fromCharCode(...Array.from(salt)));
}

/**
 * Derive a key from a passphrase using PBKDF2
 */
export async function deriveKey(
  passphrase: string,
  salt: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const saltBuffer = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ALGORITHM.iterations,
      hash: 'SHA-256',
    },
    baseKey,
    ENCRYPTION_ALGORITHM,
    false, // not extractable
    ['encrypt', 'decrypt'],
  );
}

/**
 * Hash a passphrase for storage (not decryptable)
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Encrypt data with a derived key
 */
export async function encrypt(
  data: string,
  key: CryptoKey,
): Promise<{ iv: string; ciphertext: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(data);

  const ciphertext = await crypto.subtle.encrypt(
    { ...ENCRYPTION_ALGORITHM, iv },
    key,
    encoded,
  );

  return {
    iv: btoa(String.fromCharCode(...Array.from(iv))),
    ciphertext: btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext)))),
  };
}

/**
 * Decrypt data with a derived key
 */
export async function decrypt(
  encryptedData: { iv: string; ciphertext: string },
  key: CryptoKey,
): Promise<string> {
  const decoder = new TextDecoder();
  const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(
    atob(encryptedData.ciphertext),
    (c) => c.charCodeAt(0),
  );

  const plaintext = await crypto.subtle.decrypt(
    { ...ENCRYPTION_ALGORITHM, iv },
    key,
    ciphertext,
  );

  return decoder.decode(plaintext);
}

/**
 * Verify a passphrase against its hash
 */
export async function verifyPassphrase(
  passphrase: string,
  hash: string,
): Promise<boolean> {
  const computedHash = await hashPassphrase(passphrase);
  return computedHash === hash;
}

/**
 * Generate a recovery code for email-based recovery
 */
export function generateRecoveryCode(): string {
  const array = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...Array.from(array)));
}
