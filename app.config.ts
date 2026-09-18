import type { ExpoConfig } from 'expo/config';

/**
 * Which APNs environment a build is entitled for.
 *
 * `expo-notifications` writes `aps-environment` from its `mode` option, and
 * the option DEFAULTS TO 'development'. A bare `'expo-notifications'` plugin
 * entry therefore entitles every build — TestFlight and store builds
 * included — for the APNs sandbox, and a production push to that binary
 * reaches nobody. It does not error, because nothing is wrong: it is a push
 * for a different environment than the one installed. Nothing surfaces it
 * until the first real push, when it looks like a backend fault.
 *
 * So `mode` follows the EAS build profile: the two store-bound profiles get
 * production APNs, the two dev-client profiles get the sandbox. A local
 * `expo run:ios` has no EAS_BUILD_PROFILE and gets the sandbox, which is what
 * a local debug build wants.
 */
const APNS_PRODUCTION_PROFILES = ['preview', 'production'];

const apnsMode = APNS_PRODUCTION_PROFILES.includes(process.env.EAS_BUILD_PROFILE ?? '')
  ? 'production'
  : 'development';

const config: ExpoConfig = {
  /**
   * ── IDENTITY. All of it is the template's, and `pnpm check:release` says so. ──
   *
   * `name`, `slug`, `scheme`, `ios.bundleIdentifier` and `android.package` are
   * decided in docs/app-plan.md (step 2 of the build order) and set here once.
   * The bundle id / package is PERMANENT the moment an App Store Connect
   * record or a Play upload exists against it; see docs/release-pipeline.md.
   *
   * `owner` is the EAS account (personal or organisation) the project lives
   * under. Decide it BEFORE `eas init`: it determines where builds, credentials
   * and environment variables live, and it is not a setting you change
   * afterwards — it is a different project. Uncomment and fill it in:
   *
   *   owner: '<eas-account-name>',
   */
  name: 'Boilerplate',
  slug: 'boilerplate',
  scheme: 'boilerplate',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // No `newArchEnabled`: RN 0.86 dropped the old architecture entirely, so SDK 57
  // removed the flag from the config schema. New arch is the only architecture.
  //
  // 'automatic' lets the OS drive light/dark, which is what Unistyles
  // `adaptiveThemes: true` reacts to. Setting 'light' here would pin the app.
  userInterfaceStyle: 'automatic',
  ios: {
    /**
     * Three variants, because iOS 18+ DERIVES the ones you omit — and it
     * derives `tinted` from luminance, so a light-plate icon becomes a pale
     * tile with the mark barely visible. Overrides the top-level `icon`, which
     * stays for Android and web.
     *
     * Expo treats them asymmetrically (withIosIcons.js): `dark` keeps its
     * alpha and iOS composites its own backdrop behind it, while `light` and
     * `tinted` are flattened onto WHITE — which is why the tinted asset is
     * opaque. `pnpm icons` regenerates both from `icon.png`.
     */
    icon: {
      light: './assets/icon.png',
      dark: './assets/ios-icon-dark.png',
      tinted: './assets/ios-icon-tinted.png',
    },
    supportsTablet: true,
    bundleIdentifier: 'com.example.boilerplate',
    infoPlist: {
      // Overrides for strings the config plugins inject with a GENERIC default.
      // Apple rejects boilerplate purpose strings, and a plugin default like
      // "Allow $(PRODUCT_NAME) to access your location" is exactly that. Verify
      // the final set after prebuild with:
      //   /usr/libexec/PlistBuddy -c Print ios/*/Info.plist | grep Usage
      NSLocationAlwaysUsageDescription:
        'Allow $(PRODUCT_NAME) to use your location, including in the background.',
      // expo-location adds this whether or not you use motion activity. Delete
      // the key AND stop importing the motion API if you do not need it.
      NSMotionUsageDescription:
        'Allow $(PRODUCT_NAME) to detect motion so it can tell walking from driving.',
      // Injected by expo-secure-store AND expo-local-authentication. Both are
      // used here: `src/lib/auth/biometric-vault.ts` writes the session with
      // `requireAuthentication`, so the keychain IS gated behind Face ID.
      // Rewrite this to say what unlocking gets the user in YOUR app.
      NSFaceIDUsageDescription: 'Allow $(PRODUCT_NAME) to unlock your session with Face ID.',
    },
  },
  android: {
    package: 'com.example.boilerplate',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    // Biometric login (src/lib/auth/biometric.ts). Both this and
    // expo-secure-store contribute NSFaceIDUsageDescription; the override above
    // is what actually ships. Remove both the plugin and the package if the app
    // never offers biometric unlock — see "Removing what you do not ship".
    'expo-local-authentication',
    'expo-splash-screen',
    'expo-font',
    'react-native-edge-to-edge',
    'expo-image',
    'expo-localization',

    // ── Permissions ────────────────────────────────────────────────────────
    // iOS REJECTS a build that requests a permission without a usage string, so
    // every module below states one. Rewrite these to describe what YOUR app
    // actually does with the data — App Store review reads them, and a generic
    // string is a common rejection reason.
    //
    // Ship only what you use: delete the plugin AND the package for any
    // permission your app never requests. Declaring unused permissions invites
    // review questions and shows up in the store listing's privacy section.
    [
      'expo-notifications',
      {
        /** See `APNS_PRODUCTION_PROFILES` at the top of this file. */
        mode: apnsMode,
        /**
         * `UIBackgroundModes: ['remote-notification']` — the SILENT push
         * switch, and the only way to wake the app so it can check for an OTA
         * update before its next cold start (expo-updates is strictly pull).
         *
         * OFF by default. A declared background mode the app never uses is a
         * review question with no answer, the same trap as an unused
         * permission. Turn it on when there is code that handles a silent
         * push, and remove it again if that code goes.
         */
        enableBackgroundRemoteNotifications: false,
        /*
          Android needs an `icon` (96x96, all-white on transparency) and a
          brand `color`, or the status bar shows a flat white blob. Both are
          artwork, so they sit with the app icon and splash on the asset list.
          Android push also needs `android.googleServicesFile` from a Firebase
          project — native config, so it ships in a BUILD, never an update.
        */
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
        locationAlwaysAndWhenInUsePermission:
          'Allow $(PRODUCT_NAME) to use your location, including in the background.',
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to use the camera.',
        microphonePermission: 'Allow $(PRODUCT_NAME) to use the microphone.',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
        savePhotosPermission: 'Allow $(PRODUCT_NAME) to save photos.',
        isAccessMediaLocationEnabled: false,
      },
    ],
    [
      'expo-contacts',
      { contactsPermission: 'Allow $(PRODUCT_NAME) to access your contacts.' },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: 'Allow $(PRODUCT_NAME) to access your calendar.',
        remindersPermission: 'Allow $(PRODUCT_NAME) to access your reminders.',
      },
    ],
    [
      'expo-audio',
      { microphonePermission: 'Allow $(PRODUCT_NAME) to record audio.' },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This lets $(PRODUCT_NAME) measure how well its features work. It is never used to identify you.',
      },
    ],
  ],
  /**
   * Over-the-air updates. Wired, and INERT until you add a `url`.
   *
   * `eas update:configure` normally writes that url; it cannot edit a dynamic
   * config, so it prints the value and you paste it here alongside the
   * projectId it embeds (see `extra.eas` below):
   *
   *   url: 'https://u.expo.dev/<your-project-id>',
   *
   * Everything else is already correct, and every call in `src/lib/updates`
   * bails on `Updates.isEnabled`, so this whole block does nothing until you do
   * that. `pnpm check:release` fails while it is missing. See
   * docs/ota-updates.md for the procedure and docs/release-pipeline.md for
   * where it sits in the first-run checklist.
   */
  updates: {
    /**
     * Check at launch, never block launch, and run the new bundle at the NEXT
     * cold start. That is the entire `silent` policy, and it costs no JS: the
     * native module does it before React starts.
     *
     * `fallbackToCacheTimeout: 0` is the default and is stated anyway, because
     * it is the difference between an update that is invisible and one that
     * holds a user on the splash screen while a download finishes over a bad
     * connection. Never raise it.
     *
     * `ON_LOAD` fires at COLD START ONLY. An update published while the app is
     * open or merely backgrounded is not seen until the process is killed and
     * relaunched — which is why `src/lib/updates` also checks on foreground.
     * expo-updates is strictly PULL; there is no way to push a bundle.
     */
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,

    /**
     * Fall back to the bundle inside the binary if a downloaded update cannot
     * be launched. This is the anti-bricking floor and the target of
     * `eas update:roll-back-to-embedded`. Default true; stated so nobody
     * "tidies" it away.
     */
    useEmbeddedUpdate: true,
  },

  /**
   * FINGERPRINT, not a version string, and the distinction is the whole point.
   *
   * The runtime version identifies the NATIVE binary an update is allowed to
   * land on. `fingerprint` derives it from the native project itself — the
   * dependencies, the config plugins, the native directories — so adding a
   * native module changes it automatically and old binaries stop receiving
   * updates they cannot run.
   *
   * A hand-maintained string cannot do that: someone adds a native module,
   * forgets to bump, and EAS ships JS referencing a native module that is not
   * in the installed app. That is a crash on launch for everyone who already
   * has the build, delivered silently and remotely.
   *
   * What is allowed to MOVE this is pinned in `fingerprint.config.js`. Read
   * that file before changing anything in this one.
   */
  runtimeVersion: {
    policy: 'fingerprint',
  },

  extra: {
    /**
     * HOW THE NEXT BUNDLE WANTS TO LAND — chosen per publish, read by the
     * bundle that is already running.
     *
     * `checkForUpdateAsync()` returns the new update's MANIFEST before
     * downloading it, and the manifest carries this whole config under
     * `extra.expoClient` (expo-manifests types it as a full ExpoConfig). So
     * this is the one channel through which a shipped binary can be told
     * something about an update it has not installed yet.
     *
     *   silent  (default)  download quietly, run at the next cold start
     *   forced             download, then block with a banner until restarted
     *
     * Set it at publish time, never by editing this line:
     *
     *   pnpm ota:forced:production -m "fix checkout crash"
     *
     * ⚠️ Only works because `fingerprint.config.js` skips
     * `ExpoConfigExtraSection`. `extra` is a fingerprint input by default, so
     * without that skip changing the policy changes `runtimeVersion` and the
     * update reaches zero devices.
     */
    updatePolicy: process.env.APP_UPDATE_POLICY ?? 'silent',

    /**
     * A SEQUENCE NUMBER A HUMAN CAN SAY OUT LOUD — "OTA 3", not a UUID.
     *
     * Set by `scripts/ota-publish.mjs`, which counts the updates already
     * published to this runtime version and adds one. Absent in a build, which
     * is correct: a binary that has received no update has no OTA number, and
     * Settings says "Built-in bundle" instead.
     *
     * ── THE RESET IS FREE, AND THAT IS THE WHOLE DESIGN ────────────────────
     * `runtimeVersion` is a fingerprint of the native project, so a new binary
     * is a new runtime version and the count starts at zero by itself. Nobody
     * has to remember to reset it at a store submission — the same mechanism
     * that decides which binaries an update may reach also partitions the
     * numbering.
     */
    otaBuild: process.env.APP_OTA_BUILD ?? null,

    // `eas init` prints a projectId and cannot write it into a dynamic config.
    // Paste it here when you set EAS up (pairs with `owner` at the top — the
    // id identifies the project, the owner the account it lives under):
    //   eas: { projectId: '<uuid>' },
  },

  experiments: {
    typedRoutes: true,
  },
};

export default config;
