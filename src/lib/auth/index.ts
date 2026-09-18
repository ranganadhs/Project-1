export type { AuthAdapter, Credentials, Session } from './types';
export { mockAuthAdapter } from './mock-adapter';
export {
  useSession,
  useSessionStore,
  configureAuth,
  getAuthToken,
  persistedSlice,
} from './session-store';
/*
  `./biometric` is deliberately NOT re-exported here. It imports
  expo-local-authentication, a native module that crashes a binary built before
  it was installed — and this barrel is reachable from startup code. Import it
  directly (`@/lib/auth/biometric`) from the settings screen that offers the
  toggle, which is the only place that needs it.
*/
export type { VaultReadResult } from './biometric-vault';
