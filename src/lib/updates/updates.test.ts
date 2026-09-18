import { readUpdatePolicy } from './index';

/** The shape EAS actually serves: the publishing app config under `expoClient`. */
const manifestWith = (updatePolicy: unknown) => ({
  id: 'abc',
  createdAt: '2026-08-20T00:00:00.000Z',
  runtimeVersion: 'rt',
  launchAsset: { url: 'https://example.test/bundle' },
  assets: [],
  metadata: {},
  extra: { expoClient: { extra: { updatePolicy } } },
});

describe('readUpdatePolicy', () => {
  it('reads a forced policy off the manifest', () => {
    expect(readUpdatePolicy(manifestWith('forced'))).toBe('forced');
  });

  it('reads an explicit silent policy', () => {
    expect(readUpdatePolicy(manifestWith('silent'))).toBe('silent');
  });

  // Everything below must land on 'silent'. The asymmetry is the point: a
  // wrong answer in this direction shows nothing to a user who did not need
  // to be interrupted, while a wrong answer in the other direction puts an
  // undismissable banner in front of every user and the only way back is
  // another update.
  it.each([
    ['an unrecognised policy name', manifestWith('FORCED')],
    ['a typo', manifestWith('forcedd')],
    ['a non-string', manifestWith(42)],
    ['null', manifestWith(null)],
    ['no updatePolicy key', { extra: { expoClient: { extra: {} } } }],
    ['no extra on expoClient', { extra: { expoClient: {} } }],
    ['no expoClient', { extra: {} }],
    ['an embedded manifest with no extra at all', { id: 'x', assets: [] }],
    ['undefined', undefined],
    ['null manifest', null],
  ])('falls back to silent for %s', (_label, manifest) => {
    expect(readUpdatePolicy(manifest)).toBe('silent');
  });
});

/**
 * THE ONLY THING IN THIS REPO THAT CAN SEE THIS.
 *
 * `extra` is a fingerprint input by default, so without this skip every
 * `APP_UPDATE_POLICY=forced` publish gets a different `runtimeVersion` from
 * the build it is meant for. The update publishes, is billed, and reaches zero
 * devices — with no error, because nothing is wrong: it is simply an update for
 * a different app than the one installed.
 *
 * Typecheck, lint, the bundler, `expo export` and every other test are
 * identically green whether this file exists or not.
 */
describe('fingerprint.config.js', () => {
  // The exported value, not the file text — a skip that is commented out or
  // spelled into a dead key would still match a string search.
  const config = jest.requireActual('../../../fingerprint.config.js') as {
    sourceSkips?: string[];
  };

  it('skips ExpoConfigExtraSection', () => {
    expect(config.sourceSkips).toContain('ExpoConfigExtraSection');
  });

  it('does not skip PackageJsonScriptsAll, which would hide a real native change', () => {
    expect(config.sourceSkips).not.toContain('PackageJsonScriptsAll');
  });
});
