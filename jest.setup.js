// src/lib/env validates at module load and throws when a required key is absent,
// so any test that transitively imports it needs a valid value present first.
process.env.EXPO_PUBLIC_API_URL = 'https://api.test';

// Unistyles is a Nitro (C++) module — importing it in Node throws before any
// test body runs. Its shipped mock swaps in a JS registry so components that
// call StyleSheet.create/useUnistyles can be rendered. A test still has to
// import '@/theme/unistyles' to populate that registry with the real themes.
//
// NOTE the mock STRIPS `variants` and makes `useVariants` a no-op, so
// variant-driven styling cannot be asserted here. Test token invariants and
// element structure instead, and verify appearance on a device.
require('react-native-unistyles/mocks');

/* global jest */
// `jest` is declared above rather than added to the ESLint config: this is the
// only file in the project that needs the global, and a project-wide one would
// let a stray `jest.fn()` into application code without complaint.

// react-native-keyboard-controller is a native module and throws on import in
// Node. It ships its own mock; registering it here rather than per-test is what
// lets anything rendering <Screen> mount at all — Screen reaches for
// KeyboardAwareScrollView, so without this NO screen-level test can run.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);

// react-native-reanimated pulls in react-native-worklets, whose native module
// throws at IMPORT time in Node ("Cannot read properties of undefined (reading
// 'loadUnpackers')") — so a component that merely imports Animated cannot be
// mounted, whether or not the test exercises animation.
//
// Reanimated 4's own `mock.js` does NOT solve this: it re-exports from the real
// `src/index`, so requiring it walks straight back into worklets and throws in
// exactly the same place. Hence a hand-rolled one.
//
// Everything here resolves to the animation's RESTING value synchronously,
// which is what a layout assertion wants — no timers to flush, and the value
// under test is the one the user ends up looking at. It covers what this
// codebase actually imports; extend it when a component reaches for something
// new rather than reaching for the shipped mock again.
jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView } = require('react-native');
  const identity = (value) => value;
  // A shared value with BOTH access styles. `.get()/.set()` is what the code
  // uses (the React Compiler-safe form); `.value` is for library code.
  const shared = (initial) => {
    const box = { value: initial };
    box.get = () => box.value;
    box.set = (next) => {
      box.value = typeof next === 'function' ? next(box.value) : next;
    };
    return box;
  };
  return {
    __esModule: true,
    default: { View, Text, ScrollView, createAnimatedComponent: (c) => c },
    useAnimatedStyle: (factory) => factory(),
    useDerivedValue: (factory) => shared(factory()),
    useSharedValue: shared,
    // Reduce Motion is an OS setting; the resting assumption in tests is off.
    // A test that wants the reduced path overrides this with `jest.spyOn`.
    useReducedMotion: () => false,
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    withSpring: identity,
    withTiming: identity,
    withDelay: (_delay, value) => value,
    withRepeat: identity,
    withSequence: (...values) => values[values.length - 1],
    cancelAnimation: () => {},
    runOnJS: (fn) => fn,
    // CSS transition easings are opaque objects to the renderer; a plain
    // descriptor is enough for a style assertion to see what was chosen.
    cubicBezier: (x1, y1, x2, y2) => ({ type: 'cubicBezier', x1, y1, x2, y2 }),
    Easing: new Proxy({}, { get: () => () => 0 }),
  };
});

// expo-updates is a native module and is INERT in every non-production build —
// `isEnabled` is false in dev, in Expo Go, and in any binary without EAS Update
// configured. That is exactly why it needs mocking rather than leaving alone:
// `src/lib/updates` bails early on `isEnabled`, so against the real module
// every assertion would pass for the wrong reason.
//
// `isEnabled` is a plain `true` here so the hook takes its real path. Tests that
// want the inert path override it with `jest.spyOn`.
//
// `useUpdates` returns the quiet state by default — nothing available, nothing
// pending — and a test that wants a pending update mocks its return value. That
// keeps every unrelated test that mounts the root layout from rendering a
// banner it never asked for.
jest.mock('expo-updates', () => ({
  isEnabled: true,
  channel: 'test',
  runtimeVersion: 'test-runtime',
  updateId: 'test-update-id',
  isEmbeddedLaunch: true,
  useUpdates: jest.fn(() => ({
    currentlyRunning: { updateId: 'test-update-id', isEmbeddedLaunch: true },
    isUpdateAvailable: false,
    isUpdatePending: false,
    isChecking: false,
    isDownloading: false,
    isStartupProcedureRunning: false,
    isRestarting: false,
    availableUpdate: undefined,
    downloadedUpdate: undefined,
  })),
  checkForUpdateAsync: jest.fn(() =>
    Promise.resolve({ isAvailable: false, manifest: undefined, isRollBackToEmbedded: false }),
  ),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({ isNew: false, manifest: undefined })),
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

// expo-haptics talks to a native taptic engine, so every call is a no-op in
// Node — but it must still be a JEST MOCK rather than left alone, because a
// haptic changes no pixel and `src/lib/haptics` swallows its own errors by
// design. A control wired to the wrong waveform, or to nothing at all, passes
// typecheck, lint and the bundler identically to a correct one.
//
// So this mock is the ONLY thing in the repo that can see press feel. Any test
// firing a press touches it; assert which waveform the control chose.
// `update-banner.test.tsx` is the worked example.
//
// The enums are spelled out rather than automocked because `src/lib/haptics`
// reads members off them — an automock gives `undefined` for each and the
// calls would still "succeed" while asserting nothing.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
