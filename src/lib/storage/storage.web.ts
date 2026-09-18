import { createMMKV, type MMKV } from 'react-native-mmkv';
import { createKv } from './create-kv';

/**
 * Web storage — UNENCRYPTED, deliberately.
 *
 * Two reasons this cannot mirror the native module:
 *
 * 1. `expo-secure-store` has no synchronous web API. `SecureStore.getItem` is
 *    undefined in a browser, so the native module throws at import time during
 *    static rendering.
 * 2. Even with an async key, encrypting localStorage with a key that also lives
 *    in the browser is theatre — anything that can read the ciphertext can read
 *    the key beside it.
 *
 * Treat web storage as plainly readable. Do not put anything here you would not
 * put in a cookie; on web, session tokens belong in an httpOnly cookie set by
 * the server, not in this store.
 */
const STORAGE_ID = 'app-storage-v1';

export const storage: MMKV = createMMKV({ id: STORAGE_ID });

export const kv = createKv(storage);
