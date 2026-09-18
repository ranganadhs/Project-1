import * as SecureStore from 'expo-secure-store';
import type { Session } from './types';

/**
 * The session token's home when biometric login is ON.
 *
 * ── WHY THE TOKEN, AND NOT THE PASSWORD ───────────────────────────────────
 * "Re-authenticate after a biometric check" needs either a refresh endpoint or
 * the user's password stored on the device. Storing a password is not an option
 * — no amount of encryption makes it acceptable, because it is a credential for
 * every surface the user has, not just this app. The session token is the
 * smallest secret that does the job: it is already scoped to this app, it
 * already expires, and the server can already revoke it.
 *
 * If your backend HAS a refresh endpoint, storing the refresh token here
 * instead is strictly better — it is revocable independently and shorter-lived.
 * The mechanism below does not change.
 *
 * ── WHY SECURE-STORE AND NOT MMKV ─────────────────────────────────────────
 * MMKV is bulk storage; its encryption key already lives in secure-store. This
 * value is a secret in its own right, and — the whole point of the feature —
 * it is written with `requireAuthentication`, so the OS keychain will not hand
 * it back without a successful biometric or device-credential check. That gate
 * is enforced by the OS, not by our JavaScript, which is the difference between
 * this and a lock screen drawn in React.
 *
 * ── THIS FILE DELIBERATELY DOES NOT IMPORT expo-local-authentication ───────
 * `expo-secure-store` ships in every binary built from this template; the
 * biometric module is a separate native module and crashes a binary built
 * before it was installed. Keeping the two apart means `session-store` can
 * depend on the vault — and therefore run at startup — without dragging the
 * prompting module into the app's startup graph. Prompting lives in
 * `biometric.ts`.
 */

const SESSION_KEY = 'auth.biometric.session';

/**
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — readable only while the device is
 * unlocked, and never migrated to a new device by an iCloud or iTunes backup.
 * A session restored onto a different phone from a backup would be a token
 * escaping the device it was bound to.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  authenticationPrompt: 'Unlock',
};

/** Why a read failed, so callers can tell "locked out" from "gone". */
export type VaultReadResult =
  | { status: 'ok'; session: Session }
  /** Nothing stored — biometric login was never enabled, or was turned off. */
  | { status: 'empty' }
  /**
   * The entry exists but could not be returned: the user cancelled the prompt,
   * or failed it. Still recoverable — they can try again.
   */
  | { status: 'denied' }
  /**
   * The stored value is unusable. The common cause is NOT corruption: adding or
   * removing a fingerprint or face invalidates a `requireAuthentication` entry
   * on both platforms, by design. The session is gone and the only way forward
   * is signing in with a password again.
   */
  | { status: 'invalidated' };

export async function writeSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), OPTIONS);
}

/**
 * Prompts. The OS shows its own biometric sheet as part of this read — the
 * keychain will not release the value without it, which is why there is no
 * separate "check then read" dance that could be skipped.
 */
export async function readSession(): Promise<VaultReadResult> {
  let raw: string | null;
  try {
    raw = await SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
  } catch {
    /*
     * Both "the user cancelled" and "the key was invalidated by a biometric
     * enrolment change" surface as a thrown error here, and the platforms do
     * not report them distinguishably. Treated as `denied` — the recoverable
     * reading — because telling someone their session is gone when they merely
     * mistapped is worse than offering the prompt again. A genuine invalidation
     * shows up on the next line instead: the entry reads as absent, which
     * `empty` already covers.
     */
    return { status: 'denied' };
  }

  if (raw === null) return { status: 'empty' };

  try {
    // Not schema-validated: this is our own value, written by `writeSession` in
    // this same module. A parse failure means the stored blob is not what we
    // wrote, which is unusable rather than merely unexpected.
    return { status: 'ok', session: JSON.parse(raw) as Session };
  } catch {
    return { status: 'invalidated' };
  }
}

/**
 * Removes the stored session.
 *
 * Deliberately does NOT require authentication to succeed — deleting a secret
 * is not a privileged act, and a delete that can fail leaves a live token in
 * the keychain after sign-out, which is the failure that actually matters.
 */
export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY, {
      keychainAccessible: OPTIONS.keychainAccessible,
    });
  } catch {
    // Already absent, or the entry was invalidated. Either way there is nothing
    // left to protect and nothing useful to tell the user.
  }
}
