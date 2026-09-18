import { z } from 'zod';

/**
 * Only EXPO_PUBLIC_* variables are inlined into the bundle by Metro, and they are
 * PUBLIC — readable by anyone with the binary. Never put a secret here.
 *
 * Validated at module load so a misconfigured build fails immediately with a
 * readable message, rather than as a confusing runtime error deep in a screen.
 */
const schema = z.object({
  EXPO_PUBLIC_API_URL: z.url('must be a valid URL'),
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
  EXPO_PUBLIC_ANALYTICS_KEY: z.string().optional(),
});

export type Env = {
  apiUrl: string;
  sentryDsn?: string;
  analyticsKey?: string;
};

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = schema.safeParse(raw);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => {
        const key = issue.path.join('.');
        // A missing key and a malformed one both surface as a format failure.
        // Distinguish them, or "must be a valid URL" sends you hunting for a
        // typo in a variable that was never set.
        const missing = raw[key] === undefined || raw[key] === '';
        return `  ${key}: ${missing ? 'is required but was not set' : issue.message}`;
      })
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}\n\nSee .env.example.`);
  }

  return {
    apiUrl: result.data.EXPO_PUBLIC_API_URL,
    sentryDsn: result.data.EXPO_PUBLIC_SENTRY_DSN,
    analyticsKey: result.data.EXPO_PUBLIC_ANALYTICS_KEY,
  };
}

/**
 * Metro inlines EXPO_PUBLIC_* only for STATIC member expressions, so each key
 * must be written out literally here — `process.env[name]` returns undefined
 * in a release bundle.
 */
export const env: Env = parseEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_ANALYTICS_KEY: process.env.EXPO_PUBLIC_ANALYTICS_KEY,
});
