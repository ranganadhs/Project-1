/**
 * A permission's state, normalised across every Expo module.
 *
 * The OS APIs disagree on shape — some return `granted`, some `status`, some
 * expose `canAskAgain`, iOS photos adds a partial-access case — so everything
 * is funnelled through this one type. Feature code should never need to know
 * which module backs a permission.
 */
export type PermissionStatus =
  /** Never requested. The OS prompt has not been shown. */
  | 'undetermined'
  /** Fully granted. */
  | 'granted'
  /** iOS photo library only: granted for a user-picked subset of items. */
  | 'limited'
  /** Denied, but the OS will still show the prompt again. */
  | 'denied'
  /**
   * Denied permanently. The OS will NOT show the prompt again — requesting
   * resolves instantly with no UI. The only route forward is Settings.
   */
  | 'blocked'
  /** Not applicable on this platform (e.g. tracking transparency on Android). */
  | 'unavailable';

export type PermissionState = {
  status: PermissionStatus;
  /** True for 'granted' AND 'limited' — partial photo access still lets you read. */
  granted: boolean;
  /** False once the OS stops showing the prompt. */
  canAskAgain: boolean;
};

/**
 * Every permission this app can request.
 *
 * `location` and `locationBackground` are separate because the OS treats them
 * as a sequence: background access cannot be requested until foreground access
 * has been granted, and on iOS it is a second, separate prompt.
 */
export type PermissionKey =
  | 'notifications'
  | 'location'
  | 'locationBackground'
  | 'camera'
  | 'microphone'
  | 'mediaLibrary'
  | 'contacts'
  | 'calendar'
  | 'tracking';

/**
 * Adapts one Expo module to the shared model. Adding a permission means adding
 * an adapter — nothing else in the layer changes.
 */
export type PermissionAdapter = {
  key: PermissionKey;
  /** Human label, used by the demo screen and any rationale UI. */
  label: string;
  /** Why the app needs it. Show this BEFORE triggering the OS prompt. */
  rationale: string;
  /** False when the platform has no such concept — reports 'unavailable'. */
  isAvailable: () => boolean;
  check: () => Promise<PermissionState>;
  request: () => Promise<PermissionState>;
};

export const UNAVAILABLE: PermissionState = {
  status: 'unavailable',
  granted: false,
  canAskAgain: false,
};
