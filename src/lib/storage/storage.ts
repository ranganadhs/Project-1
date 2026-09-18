import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { createKv } from './create-kv';

/**
 * Storage id is VERSIONED and must be BUMPED, never re-keyed.
 *
 * Opening an existing UNENCRYPTED store WITH an encryption key crashes at the
 * native layer — below the JS boundary, so a try/catch cannot recover from it.
 * The only safe migration is a new id, which abandons the old store's contents.
 * Treat everything in here as disposable cache, never as a system of record.
 */
const STORAGE_ID = 'app-storage-v1';
const ENCRYPTION_KEY_ALIAS = 'app.mmkv.encryption-key';

/**
 * Returns the MMKV encryption key, generating a random 256-bit key on first run
 * and persisting it in the OS keychain (iOS) / keystore (Android).
 *
 * Uses the SYNCHRONOUS SecureStore API deliberately: the MMKV constructor below
 * is synchronous and runs at module load, so the key must already be in hand.
 * That sync API does not exist on web, which is why storage.web.ts replaces
 * this whole module there.
 */
function getOrCreateEncryptionKey(): string {
  const existing = SecureStore.getItem(ENCRYPTION_KEY_ALIAS);
  if (existing) return existing;

  const bytes = Crypto.getRandomBytes(32); // 256-bit
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  SecureStore.setItem(ENCRYPTION_KEY_ALIAS, key);
  return key;
}

export const storage: MMKV = createMMKV({
  id: STORAGE_ID,
  encryptionKey: getOrCreateEncryptionKey(),
});

/** Typed accessors. Prefer these over touching `storage` directly. */
export const kv = createKv(storage);
