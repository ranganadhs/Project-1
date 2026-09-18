import { themes } from './index';

describe('tier 2 shape roles', () => {
  const roles = ['button', 'card', 'field', 'overlay', 'chip', 'notice'] as const;

  /**
   * The whole reason these are styles and not numbers. React Native defaults
   * `borderCurve` to 'circular' (BorderCurve : uint8_t { Circular, Continuous }
   * — first enumerator, so zero), so a corner is only smoothed if something
   * says so. Carrying it on the role token means using the token IS saying so.
   */
  it('carries continuous corner curvature on every role', () => {
    for (const role of roles) {
      expect(themes.light.shape[role]).toMatchObject({ borderCurve: 'continuous' });
    }
  });

  it('carries a numeric radius on every role', () => {
    for (const role of roles) {
      expect(typeof themes.light.shape[role].borderRadius).toBe('number');
    }
  });

  /** For radii that arrive as a prop or are computed — spread alongside. */
  it('exposes a curve-only token for radii a role cannot name', () => {
    expect(themes.light.shape.smooth).toEqual({ borderCurve: 'continuous' });
    expect(themes.light.shape.smooth).not.toHaveProperty('borderRadius');
  });

  /** Shape does not change between light and dark, unlike elevation. */
  it('is identical in both themes', () => {
    expect(themes.dark.shape).toBe(themes.light.shape);
  });
});
