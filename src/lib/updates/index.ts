import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Shortest gap between two update checks.
 *
 * `AppState` reports `active` far more often than a person "opens the app" —
 * dismissing a permission dialog, returning from the share sheet, and the iOS
 * app switcher all fire it. Expo rate-limits update requests, so an unthrottled
 * listener is both rude and self-defeating.
 */
const MIN_CHECK_INTERVAL_MS = 60_000;

/**
 * How a published update wants to be absorbed by devices already running the
 * app. Chosen per publish, carried in the manifest, read by the bundle that is
 * ALREADY RUNNING — not by the one being delivered.
 *
 *   silent   Download quietly. The new bundle runs at the next cold start.
 *            Nothing is shown, nothing is interrupted. This is the default and
 *            should stay the default: it is the only policy that costs a
 *            the user nothing.
 *
 *   forced   Download, then block with a banner until the app is restarted.
 *            For a fix that must not sit behind an app-open — a crash loop, a
 *            broken submit path, a scoring bug writing bad rows.
 *
 * There is no third tier. If you add one (a dismissible "prompt", say), add it
 * here, in `POLICIES`, and in `update-banner.tsx` — nowhere else should know
 * these strings.
 */
export type UpdatePolicy = 'silent' | 'forced';

const POLICIES: readonly UpdatePolicy[] = ['silent', 'forced'];

/**
 * The policy a manifest is asking for, defaulting to `silent`.
 *
 * ── WHY THIS READS FROM THE MANIFEST AND NOT FROM CONFIG ──────────────────
 * `Constants.expoConfig` describes the bundle you are RUNNING. The decision
 * this drives is about the bundle you have not installed yet, so it has to come
 * off the incoming manifest — which `checkForUpdateAsync()` hands over before
 * the download, and which carries the publishing app config verbatim under
 * `extra.expoClient` (expo-manifests types that field as a full ExpoConfig).
 *
 * ── WHY UNKNOWN MEANS SILENT ──────────────────────────────────────────────
 * Every failure mode here — a typo in the env var, an older binary that
 * predates a policy name, a manifest shape change — resolves to "do not
 * interrupt the user". The opposite default would let one mistyped
 * environment variable put an undismissable banner in front of every user, and
 * the only way out would be another update.
 */
export function readUpdatePolicy(manifest: unknown): UpdatePolicy {
  // Hand-walked rather than destructured: this is untrusted remote JSON, the
  // embedded-manifest variant has no `extra` at all, and a throw here would
  // take out the foreground listener.
  const extra = (manifest as { extra?: { expoClient?: { extra?: unknown } } })?.extra?.expoClient
    ?.extra;
  const policy = (extra as { updatePolicy?: unknown })?.updatePolicy;

  return POLICIES.includes(policy as UpdatePolicy) ? (policy as UpdatePolicy) : 'silent';
}

export type UpdateState = {
  /** What the pending update asked for. `silent` when nothing is pending. */
  policy: UpdatePolicy;
  /** A `forced` update is downloaded and waiting. Show the banner. */
  isRestartRequired: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  /** Applies the pending update. This RESTARTS the JS runtime. */
  restart: (reloadScreenOptions?: Updates.ReloadScreenOptions) => Promise<void>;
  /** Force a check now. The foreground listener already does this. */
  check: () => Promise<void>;
};

/**
 * Over-the-air updates.
 *
 * `Updates.isEnabled` is false in development, in Expo Go, and in any build
 * without EAS Update configured, so every call here is inert until there is
 * something to do. Safe to mount unconditionally.
 *
 * ── WHAT THIS ADDS TO THE NATIVE MODULE, AND WHAT IT DOES NOT ─────────────
 *
 * `checkAutomatically: 'ON_LOAD'` in app.config.ts already does the entire
 * `silent` policy without any JS: the native module checks at cold start,
 * downloads in the background, never blocks launch, and the new bundle runs the
 * next time the app is opened cold. Deleting this hook would not stop silent
 * updates from working.
 *
 * Two things it does add:
 *
 *   1. FOREGROUND CATCH-UP. `ON_LOAD` fires at cold start only, so an update
 *      published while the app is open or merely backgrounded is invisible
 *      until the process is killed. On a phone that can be days.
 *   2. THE POLICY READ. Nothing native knows what `forced` means.
 *
 * `useUpdates()` rather than hand-rolled state, because it seeds from the
 * NATIVE state machine context. A download the native `ON_LOAD` check finished
 * before React even started is already reflected on first render — hand-rolled
 * state would have to re-request it to find out.
 *
 * Fetching is unconditional and the policy gates only the banner. A silent
 * update downloaded now is applied at the next cold start for free, so there is
 * nothing to gain by holding it back.
 */
export function useOTAUpdates(): UpdateState {
  const { isUpdatePending, downloadedUpdate, availableUpdate, isChecking, isDownloading } =
    Updates.useUpdates();

  const lastCheckedAt = useRef(0);

  const check = useCallback(async () => {
    if (!Updates.isEnabled) return;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;
      await Updates.fetchUpdateAsync();
    } catch {
      // Offline, rate-limited, or the update server is unreachable. Never
      // surface this: a background check that did not happen is not something
      // the user can act on, and it is not something they did.
    }
  }, []);

  const restart = useCallback(async (reloadScreenOptions?: Updates.ReloadScreenOptions) => {
    if (!Updates.isEnabled) return;
    await Updates.reloadAsync(reloadScreenOptions ? { reloadScreenOptions } : undefined);
  }, []);

  useEffect(() => {
    if (!Updates.isEnabled) return;

    // No check on mount. The native ON_LOAD check has already run by the time
    // JS is executing, and `useUpdates()` above is reporting its result — a
    // second request at launch would duplicate it and compete with hydration,
    // fonts, and first render for the same thread.
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status !== 'active') return;

      const now = Date.now();
      if (now - lastCheckedAt.current < MIN_CHECK_INTERVAL_MS) return;
      lastCheckedAt.current = now;

      void check();
    });

    return () => subscription.remove();
  }, [check]);

  // The downloaded manifest is the authority once there is one; before the
  // download lands, the available one says the same thing.
  const policy = readUpdatePolicy(downloadedUpdate?.manifest ?? availableUpdate?.manifest);

  return {
    policy,
    isRestartRequired: isUpdatePending && policy === 'forced',
    isChecking,
    isDownloading,
    restart,
    check,
  };
}

/** Build metadata, useful in a settings/debug screen or a bug report. */
export const updateInfo = {
  get isEnabled() {
    return Updates.isEnabled;
  },
  get channel() {
    return Updates.channel;
  },
  get runtimeVersion() {
    return Updates.runtimeVersion;
  },
  get updateId() {
    return Updates.updateId;
  },
  /** True when running the bundle shipped inside the binary. */
  get isEmbedded() {
    return Updates.isEmbeddedLaunch;
  },
};
