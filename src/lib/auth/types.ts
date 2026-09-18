export type Credentials = { email: string; password: string };

export type Session = {
  token: string;
  refreshToken?: string;
  user: { id: string; name: string };
};

/**
 * The single seam between the boilerplate and a real backend. Implement this
 * against your provider and pass it to `configureAuth` — nothing else changes.
 */
export type AuthAdapter = {
  signIn(credentials: Credentials): Promise<Session>;
  signOut(): Promise<void>;
  refresh(refreshToken: string): Promise<Session>;
};
