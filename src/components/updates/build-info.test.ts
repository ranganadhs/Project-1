// Populates the mocked Unistyles registry with the real themes. Needed even
// though this file asserts only strings: the module imports the UI barrel, and
// every styled component calls StyleSheet.create at module scope.
import '@/theme/unistyles';

import { describeBuild } from './build-info';

/**
 * ── WHY THESE MOCKS ARE GETTERS OVER A MUTABLE OBJECT ─────────────────────
 *
 * The obvious version — `Object.defineProperty(Application, …)`, or
 * `jest.replaceProperty` — does not work here, and fails in the worst way: it
 * is accepted, changes nothing, and the assertion then reports the value from
 * the mock factory, which reads like a bug in `describeBuild`.
 *
 * The cause is Babel's ESM interop. `import * as Application` compiles to
 * `_interopRequireWildcard(require('expo-application'))`, which builds a NEW
 * namespace object per importing module. So the object this test holds is not
 * the object `build-info.tsx` reads from, and mutating one cannot affect the
 * other.
 *
 * The interop copies property DESCRIPTORS, though. A getter is carried across
 * by reference, so a getter closing over shared mutable state is read live by
 * every copy — which is what these are. The `mock` name prefix is required:
 * `jest.mock` factories are hoisted above every other declaration, and
 * babel-plugin-jest-hoist only permits identifiers beginning with `mock`.
 */
const mockApp: { name: string | null; version: string | null; build: string | null } = {
  name: 'Demo',
  version: '1.0.0',
  build: '12',
};

const mockUpdates: {
  enabled: boolean;
  embedded: boolean;
  id: string | null;
  channel: string | null;
} = { enabled: true, embedded: false, id: null, channel: null };

const mockConstants: { otaBuild: unknown } = { otaBuild: null };

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { otaBuild: mockConstants.otaBuild } };
    },
  },
}));

jest.mock('expo-application', () => ({
  get applicationName() {
    return mockApp.name;
  },
  get nativeApplicationVersion() {
    return mockApp.version;
  },
  get nativeBuildVersion() {
    return mockApp.build;
  },
}));

jest.mock('expo-updates', () => ({
  get isEnabled() {
    return mockUpdates.enabled;
  },
  get isEmbeddedLaunch() {
    return mockUpdates.embedded;
  },
  get updateId() {
    return mockUpdates.id;
  },
  get channel() {
    return mockUpdates.channel;
  },
  runtimeVersion: 'rt',
  useUpdates: jest.fn(() => ({ isUpdatePending: false })),
}));

beforeEach(() => {
  mockApp.name = 'Demo';
  mockApp.version = '1.0.0';
  mockApp.build = '12';
  mockUpdates.enabled = true;
  mockUpdates.embedded = false;
  mockUpdates.id = '3f9a1c2d-0000-0000-0000-000000000000';
  mockUpdates.channel = 'preview';
  mockConstants.otaBuild = '3';
});

/**
 * These two strings are the only thing a support conversation has to go on, and
 * nothing else in the repo can check them — they come from native getters, so a
 * mounted assertion would prove only that *something* rendered.
 */
describe('describeBuild', () => {
  it('reports the binary version with its build number', () => {
    expect(describeBuild().version).toBe('Demo 1.0.0 (12)');
  });

  it('drops the parenthetical when there is no build number', () => {
    mockApp.build = null;
    expect(describeBuild().version).toBe('Demo 1.0.0');
  });

  it('survives a platform that reports no version at all', () => {
    mockApp.version = null;
    mockApp.build = null;
    expect(describeBuild().version).toBe('Demo —');
  });

  // The whole reason the component exists: two users on the same store
  // version can be running different JavaScript, and this is what tells them
  // apart. The ordinal is what a person can actually say on a phone call.
  it('names the OTA ordinal and its channel', () => {
    expect(describeBuild().bundle).toBe('OTA 3 · preview');
  });

  it('omits the channel when there is not one', () => {
    mockUpdates.channel = null;
    expect(describeBuild().bundle).toBe('OTA 3');
  });

  // `ota-publish.mjs` omits the number rather than guessing when it cannot
  // establish the count. The app must degrade to the id, never to a wrong
  // ordinal — two updates both called "OTA 4" is worse than neither having a
  // name, for the same reason a version that disagrees with the binary is.
  it.each([
    ['absent', undefined],
    ['null', null],
    ['empty', ''],
    ['zero', '0'],
    ['not a number', 'latest'],
    ['fractional', '2.5'],
  ])('falls back to the update id when the ordinal is %s', (_label, value) => {
    mockConstants.otaBuild = value;
    expect(describeBuild().bundle).toBe('Update 3f9a1c2d · preview');
  });

  it('accepts the ordinal as a number as well as a string', () => {
    mockConstants.otaBuild = 12;
    expect(describeBuild().bundle).toBe('OTA 12 · preview');
  });

  // No update has been applied — either none was published for this runtime
  // version, or one was rolled back to embedded. Both are worth seeing.
  it('says built-in when running the bundle inside the binary', () => {
    mockUpdates.embedded = true;
    expect(describeBuild().bundle).toBe('Built-in bundle');
  });

  // "Built-in" would be true in dev and still misleading: it implies an update
  // could arrive, and in a dev build none ever can.
  it('distinguishes a development build from a built-in bundle', () => {
    mockUpdates.enabled = false;
    mockUpdates.embedded = true;
    expect(describeBuild().bundle).toBe('Development bundle');
  });
});

/**
 * ── THE VERSION IS DELIBERATELY NOT OTA-UPDATABLE ─────────────────────────
 *
 * `Constants.expoConfig.version` comes from the manifest and would appear to
 * follow a publish. It is the wrong source twice over: `version` is a
 * fingerprint input, so the update could not reach an existing build anyway,
 * and if that were defeated
 * with `sourceSkips: ['ExpoConfigVersions']` the number would then disagree
 * with the binary the user actually has installed — which is worse than no
 * version at all, because support would trust it.
 *
 * This asserts the source, because swapping it is a one-line change that reads
 * like a simplification and would silently make the number a lie.
 */
describe('the version source', () => {
  it('is the installed binary, never the manifest', () => {
    mockApp.version = '9.9.9';
    mockApp.build = '99';
    expect(describeBuild().version).toBe('Demo 9.9.9 (99)');
  });
});
