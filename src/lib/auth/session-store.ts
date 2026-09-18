import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { mockAuthAdapter } from './mock-adapter';
import { clearSession as clearBiometricSession } from './biometric-vault';
import type { AuthAdapter, Credentials, Session } from './types';

let adapter: AuthAdapter = mockAuthAdapter;

/** Swap in a real backend. Call once, before rendering. */
export function configureAuth(next: AuthAdapter): void {
  adapter = next;
}

/**
 * WHAT GETS WRITTEN TO MMKV. Exported so it can be tested directly — this is
 * the biometric feature's security property, not a formatting detail, and a
 * regression here is silent: the app keeps working, and the gate quietly stops
 * protecting anything.
 *
 * `isHydrated` is runtime state and must never be restored, or a cold start
 * would read as already-hydrated (trap 7).
 *
 * ── THE TOKEN LIVES IN EXACTLY ONE PLACE ──────────────────────────────────
 * With biometric login ON the session is held in the OS keychain behind
 * `requireAuthentication` and is deliberately NOT written here. Persisting it
 * in both would make the gate decorative — the token would still be sitting in
 * MMKV for anything able to read it, and "Biometric Login" would be claiming a
 * protection it does not provide.
 *
 * The PREFERENCE always persists. Without it a cold start could not tell "no
 * session because biometric is on" from "no session because the user signed
 * out", and would show sign-in with no unlock affordance.
 */
export function persistedSlice(
  state: Pick<SessionState, 'session' | 'biometricEnabled'>,
): { biometricEnabled: boolean; session?: Session | null } {
  return {
    biometricEnabled: state.biometricEnabled,
    ...(state.biometricEnabled ? {} : { session: state.session }),
  };
}

type SessionState = {
  session: Session | null;
  isHydrated: boolean;
  /**
   * A PREFERENCE, not a secret — it says where the token lives, it is not the
   * token. Persists unconditionally; the token's persistence is what it gates.
   */
  biometricEnabled: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => void;
  /** Puts a session back in memory after a successful biometric unlock. */
  restoreSession: (session: Session) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      isHydrated: false,
      biometricEnabled: false,

      signIn: async (credentials) => {
        const session = await adapter.signIn(credentials);
        set({ session });
      },

      signOut: async () => {
        await adapter.signOut();
        /*
         * Clear the keychain copy too, or signing out leaves a live token
         * behind the biometric gate and the next unlock silently resurrects a
         * session the user believed they ended. `biometric-vault` is imported
         * rather than `biometric` on purpose: the vault uses only
         * expo-secure-store, so signing out does not drag the biometric native
         * module into the startup graph.
         */
        await clearBiometricSession();
        set({ session: null, biometricEnabled: false });
      },

      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),

      restoreSession: (session) => set({ session }),
    }),
    {
      name: 'session',
      storage: createJSONStorage(() => zustandStorage),
      // Wrapped rather than passed by reference: zustand types `partialize` as
      // taking the FULL state, while `persistedSlice` deliberately takes only
      // the two fields it reads so it can be tested without stub functions.
      partialize: (state) => persistedSlice(state),
    },
  ),
);

/**
 * MMKV is synchronous, so rehydration completes DURING the `create` call above.
 * A listener attached afterwards would therefore never fire — `hasHydrated()`
 * covers that case. The subscription is the fallback for an async storage
 * adapter, should one ever be swapped in.
 */
if (useSessionStore.persist.hasHydrated()) {
  useSessionStore.setState({ isHydrated: true });
} else {
  useSessionStore.persist.onFinishHydration(() => {
    useSessionStore.setState({ isHydrated: true });
  });
}

/** Non-reactive token read, for the API client's `getAuthToken`. */
export function getAuthToken(): string | undefined {
  return useSessionStore.getState().session?.token;
}

/** Reactive session hook for components and route guards. */
export function useSession() {
  const session = useSessionStore((s) => s.session);
  const isHydrated = useSessionStore((s) => s.isHydrated);
  const signIn = useSessionStore((s) => s.signIn);
  const signOut = useSessionStore((s) => s.signOut);
  /*
   * Available on the FIRST render, not through an effect. MMKV rehydrates
   * synchronously inside `create()` (trap 7), so the flag is already correct
   * here — a hydration listener attached afterwards would never fire, and
   * sign-in would flash without its unlock affordance before catching up.
   */
  const biometricEnabled = useSessionStore((s) => s.biometricEnabled);

  return {
    session,
    isAuthenticated: session !== null,
    isHydrated,
    biometricEnabled,
    signIn,
    signOut,
  };
}
