import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
// expo-camera exposes its imperative permission calls on the `Camera`
// namespace object; the module root only exports the React hooks.
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import * as Audio from 'expo-audio';
import * as Tracking from 'expo-tracking-transparency';
import type { PermissionAdapter, PermissionKey, PermissionState } from './types';
import { UNAVAILABLE } from './types';

/**
 * The shape every Expo permission call returns. Declared locally rather than
 * imported so a single module changing its export surface cannot break the
 * whole layer.
 */
type ExpoPermissionResponse = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
};

/**
 * Normalises an Expo response.
 *
 * The important translation is `blocked`: Expo reports a permanently-refused
 * permission as `denied` with `canAskAgain: false`. Callers that only check
 * `denied` will keep calling request(), which resolves instantly with no OS
 * prompt and looks like a broken button. Splitting it out forces the caller to
 * handle the Settings path.
 */
function normalise(response: ExpoPermissionResponse): PermissionState {
  const { status, granted, canAskAgain } = response;

  if (granted) return { status: 'granted', granted: true, canAskAgain };
  if (status === 'undetermined') {
    return { status: 'undetermined', granted: false, canAskAgain: true };
  }
  return {
    status: canAskAgain ? 'denied' : 'blocked',
    granted: false,
    canAskAgain,
  };
}

/** Media library adds partial access on iOS, which is granted-but-limited. */
function normaliseMediaLibrary(
  response: ExpoPermissionResponse & { accessPrivileges?: 'all' | 'limited' | 'none' },
): PermissionState {
  const base = normalise(response);
  if (response.accessPrivileges === 'limited') {
    // Reads work against the user-picked subset; treat as granted so features
    // are not gated, but surface 'limited' so UI can offer "select more photos".
    return { status: 'limited', granted: true, canAskAgain: base.canAskAgain };
  }
  return base;
}

const always = () => true;
const iosOnly = () => Platform.OS === 'ios';

export const ADAPTERS: Record<PermissionKey, PermissionAdapter> = {
  notifications: {
    key: 'notifications',
    label: 'Notifications',
    rationale: 'Send you alerts about activity that needs your attention.',
    isAvailable: always,
    check: async () => normalise(await Notifications.getPermissionsAsync()),
    request: async () => normalise(await Notifications.requestPermissionsAsync()),
  },

  location: {
    key: 'location',
    label: 'Location (while using)',
    rationale: 'Show what is nearby and use your position while the app is open.',
    isAvailable: always,
    check: async () => normalise(await Location.getForegroundPermissionsAsync()),
    request: async () => normalise(await Location.requestForegroundPermissionsAsync()),
  },

  locationBackground: {
    key: 'locationBackground',
    label: 'Location (always)',
    rationale: 'Keep updating your position while the app is in the background.',
    isAvailable: always,
    check: async () => normalise(await Location.getBackgroundPermissionsAsync()),
    /**
     * The OS refuses background location until foreground has been granted, and
     * on iOS this is a SECOND prompt shown some time after the first. Requesting
     * it cold resolves denied without ever showing UI, so escalate explicitly.
     */
    request: async () => {
      const foreground = normalise(await Location.getForegroundPermissionsAsync());
      if (!foreground.granted) {
        const requested = normalise(await Location.requestForegroundPermissionsAsync());
        if (!requested.granted) return requested;
      }
      return normalise(await Location.requestBackgroundPermissionsAsync());
    },
  },

  camera: {
    key: 'camera',
    label: 'Camera',
    rationale: 'Take photos and video inside the app.',
    isAvailable: always,
    check: async () => normalise(await Camera.getCameraPermissionsAsync()),
    request: async () => normalise(await Camera.requestCameraPermissionsAsync()),
  },

  microphone: {
    key: 'microphone',
    label: 'Microphone',
    rationale: 'Record audio and capture sound with video.',
    isAvailable: always,
    check: async () => normalise(await Audio.getRecordingPermissionsAsync()),
    request: async () => normalise(await Audio.requestRecordingPermissionsAsync()),
  },

  mediaLibrary: {
    key: 'mediaLibrary',
    label: 'Photos',
    rationale: 'Choose existing photos and save new ones to your library.',
    isAvailable: always,
    check: async () => normaliseMediaLibrary(await MediaLibrary.getPermissionsAsync()),
    request: async () => normaliseMediaLibrary(await MediaLibrary.requestPermissionsAsync()),
  },

  contacts: {
    key: 'contacts',
    label: 'Contacts',
    rationale: 'Find people you already know.',
    isAvailable: always,
    check: async () => normalise(await Contacts.getPermissionsAsync()),
    request: async () => normalise(await Contacts.requestPermissionsAsync()),
  },

  calendar: {
    key: 'calendar',
    label: 'Calendar',
    rationale: 'Check your availability and add events you agree to.',
    isAvailable: always,
    // SDK 57 moved expo-calendar to an object-oriented API and DEPRECATED the
    // *Async permission calls — they now THROW at runtime, not just warn. The
    // replacements drop the Async suffix and return the same PermissionResponse.
    //
    // TypeScript could not catch this: the deprecated names are still exported
    // with valid types, and the failure is a runtime guard. `pnpm check:deprecated`
    // exists to catch this class of breakage.
    //
    // Pass `true` to request WRITE-ONLY access on iOS — a lighter prompt for
    // apps that only add events and never read the user's calendar.
    check: async () => normalise(await Calendar.getCalendarPermissions()),
    request: async () => normalise(await Calendar.requestCalendarPermissions()),
  },

  tracking: {
    key: 'tracking',
    label: 'App tracking',
    rationale: 'Measure how well features work across apps. Never used to identify you.',
    // App Tracking Transparency is an iOS construct; Android has no equivalent
    // prompt, so reporting 'unavailable' is more honest than a fake 'granted'.
    isAvailable: iosOnly,
    check: async () =>
      iosOnly() ? normalise(await Tracking.getTrackingPermissionsAsync()) : UNAVAILABLE,
    request: async () =>
      iosOnly() ? normalise(await Tracking.requestTrackingPermissionsAsync()) : UNAVAILABLE,
  },
};

export const PERMISSION_KEYS = Object.keys(ADAPTERS) as PermissionKey[];
