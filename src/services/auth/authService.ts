import { runQuery, runSelect } from '../database/db';
import {
  generateSalt,
  hashPassphrase,
  deriveKey,
  generateRecoveryCode,
} from './encryptionService';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passphraseSalt: string;
  passphraseHash: string;
  recoveryCode?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new user account (v1: hardcoded single-user setup)
 */
export async function createUser(
  email: string,
  password: string,
  passphrase: string,
): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassphrase(password);
  const passphraseSalt = generateSalt();
  const passphraseHash = await hashPassphrase(passphrase);
  const recoveryCode = generateRecoveryCode();
  const now = new Date().toISOString();

  await runQuery(
    `INSERT INTO users (id, email, password_hash, passphrase_salt, passphrase_hash, recovery_code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email, passwordHash, passphraseSalt, passphraseHash, recoveryCode, now, now],
  );

  return {
    id,
    email,
    passwordHash,
    passphraseSalt,
    passphraseHash,
    recoveryCode,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const results = await runSelect('SELECT * FROM users WHERE email = ?', [email]);
  if (results.length === 0) return null;

  const row = results[0];
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    passphraseSalt: row.passphrase_salt,
    passphraseHash: row.passphrase_hash,
    recoveryCode: row.recovery_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const passwordHash = await hashPassphrase(password);
  if (passwordHash !== user.passwordHash) return null;

  return user;
}

/**
 * Unlock user session with passphrase
 */
export async function unlockSession(passphrase: string, user: User): Promise<CryptoKey | null> {
  try {
    const key = await deriveKey(passphrase, user.passphraseSalt);
    // Verify passphrase is correct by checking hash
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = btoa(String.fromCharCode(...hashArray));

    if (hash === user.passphraseHash) {
      return key;
    }
    return null;
  } catch (error) {
    console.error('Error unlocking session:', error);
    return null;
  }
}

/**
 * Reset passphrase via recovery code (email-based recovery)
 */
export async function resetPassphraseWithRecoveryCode(
  userId: string,
  recoveryCode: string,
  newPassphrase: string,
): Promise<boolean> {
  const user = await runSelect('SELECT * FROM users WHERE id = ?', [userId]);
  if (user.length === 0) return false;

  if (user[0].recovery_code !== recoveryCode) return false;

  const newSalt = generateSalt();
  const newHash = await hashPassphrase(newPassphrase);
  const now = new Date().toISOString();

  await runQuery(
    'UPDATE users SET passphrase_salt = ?, passphrase_hash = ?, updated_at = ? WHERE id = ?',
    [newSalt, newHash, now, userId],
  );

  return true;
}

/**
 * Verify user exists (for v1 hardcoded single-user check)
 */
export async function userExists(): Promise<boolean> {
  const results = await runSelect('SELECT COUNT(*) as count FROM users', []);
  return results.length > 0 && results[0].count > 0;
}
