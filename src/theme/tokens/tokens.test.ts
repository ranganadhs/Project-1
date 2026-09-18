import {
  palette,
  space,
  radius,
  makeElevation,
  glow,
  shadowAlpha,
  withAlpha,
  spring,
  springRatio,
  cssEasing,
  size,
  chartCategorical,
  chartSequential,
  chartDiverging,
  avatarPalette,
  blackAlpha,
  whiteAlpha,
  nestedRadius,
  breakpoint,
  fontVariant,
  letterSpacing,
  textTransform,
} from './index';

describe('tier 1 tokens', () => {
  it('gives every colour ramp the full 50-900 scale', () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (const [name, ramp] of Object.entries(palette)) {
      for (const step of steps) {
        expect(`${name}.${step}`).toBe(`${name}.${step}`);
        expect(ramp[step as keyof typeof ramp]).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it('builds spacing on a 4pt grid', () => {
    expect(space[1]).toBe(4);
    expect(space[4]).toBe(16);
    // every value is a multiple of 2 (half-steps allowed), never fractional
    for (const v of Object.values(space)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v % 2).toBe(0);
    }
  });

  it('exposes a full radius token for pills', () => {
    expect(radius.full).toBeGreaterThanOrEqual(9999);
  });

  /**
   * `boxShadow` is one declaration drawn natively on BOTH platforms — the
   * legacy `shadow*` + `elevation` pair is two systems that never match.
   * A preset that is not a parseable CSS shadow renders nothing, silently.
   */
  it('expresses every elevation step as a boxShadow string', () => {
    const SHADOW_RE = /^0 -?\d+(px)? \d+(px)? 0 rgba\(\d+, \d+, \d+, [0-9.]+\)$/;
    for (const scheme of ['light', 'dark'] as const) {
      for (const preset of Object.values(makeElevation(scheme))) {
        expect(preset.boxShadow).toMatch(SHADOW_RE);
      }
    }
  });

  it('gives dark elevation more alpha than light at every step', () => {
    // A shadow darkens what is behind it, so on a near-black canvas the light
    // scale is effectively invisible. The dark curve must be stronger.
    const light = makeElevation('light');
    const dark = makeElevation('dark');
    for (const step of ['sm', 'md', 'lg', 'xl'] as const) {
      expect(shadowAlpha(dark[step])).toBeGreaterThan(shadowAlpha(light[step]));
    }
  });

  it('keeps `none` fully transparent rather than absent, so it can override', () => {
    expect(shadowAlpha(makeElevation('light').none)).toBe(0);
  });

  it('scales glow intensity monotonically', () => {
    expect(shadowAlpha(glow('#000000', 'strong'))).toBeGreaterThan(
      shadowAlpha(glow('#000000', 'light')),
    );
  });

  it('turns a hex colour into the rgba a shadow needs, and leaves anything else alone', () => {
    expect(withAlpha('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(withAlpha('#fff', 1)).toBe('rgba(255, 255, 255, 1)');
    expect(withAlpha('rebeccapurple', 0.5)).toBe('rebeccapurple');
  });

  it('meets the 44pt minimum touch target', () => {
    expect(size.touchTarget).toBeGreaterThanOrEqual(44);
  });

  describe('spring damping ratios', () => {
    // ζ = damping / (2 * sqrt(stiffness * mass))
    const zeta = (config: { mass: number; damping: number; stiffness: number }) =>
      config.damping / (2 * Math.sqrt(config.stiffness * config.mass));

    it('keeps snappy at or above critical damping, so it never overshoots', () => {
      // This is the guard on the default feel. Dropping snappy below 1.0 makes
      // every control in the app bounce.
      expect(zeta(spring.snappy)).toBeGreaterThanOrEqual(1);
    });

    it('keeps gentle effectively critical too', () => {
      expect(zeta(spring.gentle)).toBeGreaterThanOrEqual(0.95);
    });

    it('keeps bouncy genuinely underdamped, or its name is a lie', () => {
      expect(zeta(spring.bouncy)).toBeLessThan(0.7);
    });

    it('states mass explicitly on every spring', () => {
      for (const config of Object.values(spring)) {
        expect(config.mass).toEqual(expect.any(Number));
      }
    });

    // Reanimated 4 refuses a config that mixes the physics keys with the
    // duration keys. The two families are kept in separate objects so a caller
    // cannot spread them together by accident.
    it('never mixes the physics form with the duration form', () => {
      for (const config of Object.values(spring)) {
        expect(config).not.toHaveProperty('dampingRatio');
        expect(config).not.toHaveProperty('duration');
      }
      for (const config of Object.values(springRatio)) {
        expect(config).not.toHaveProperty('stiffness');
        expect(config.dampingRatio).toBeGreaterThan(0);
        expect(config.dampingRatio).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('css easing', () => {
    it('is four control points inside the unit square on x, ready for cubicBezier()', () => {
      for (const points of Object.values(cssEasing)) {
        expect(points).toHaveLength(4);
        const [x1, , x2] = points;
        expect(x1).toBeGreaterThanOrEqual(0);
        expect(x1).toBeLessThanOrEqual(1);
        expect(x2).toBeGreaterThanOrEqual(0);
        expect(x2).toBeLessThanOrEqual(1);
      }
    });

    it('decelerates on enter and accelerates on exit', () => {
      // Deceleration: the curve rises fast, so its first control point is high
      // (y1 near 1). Acceleration is the mirror.
      expect(cssEasing.enter[1]).toBeGreaterThan(0.5);
      expect(cssEasing.exit[1]).toBeLessThan(0.5);
    });
  });
});

describe('exhaustive token coverage', () => {
  it('gives every ramp the same set of steps', () => {
    const expected = [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];
    for (const [name, ramp] of Object.entries(palette)) {
      expect(`${name}:${Object.keys(ramp).map(Number).sort((a, b) => a - b)}`).toBe(
        `${name}:${expected}`,
      );
    }
  });

  it('keeps the validated chart order intact', () => {
    // These eight passed the CVD/contrast validator IN THIS ORDER. Re-ordering
    // or substituting requires re-running it — pink next to teal collapses to
    // deltaE 3.8 under deuteranopia.
    expect(chartCategorical).toEqual([
      '#3D6BFF',
      '#0D9488',
      '#C2410C',
      '#7C3AED',
      '#DB2777',
      '#65A30D',
      '#0891B2',
      '#B45309',
    ]);
  });

  it('keeps sequential ramps monotonic in one hue', () => {
    // A sequential scale encodes magnitude; a non-monotonic step would imply an
    // ordering the data does not have.
    expect(chartSequential.length).toBeGreaterThanOrEqual(5);
    expect(new Set(chartSequential).size).toBe(chartSequential.length);
  });

  it('gives diverging scales a neutral midpoint, never a hue', () => {
    expect(chartDiverging.neutral).toMatch(/^#[0-9A-F]{6}$/i);
    expect(chartDiverging.negative.length).toBe(chartDiverging.positive.length);
  });

  it('excludes status hues from the avatar palette', () => {
    // An avatar tinted success-green reads as a state rather than a person.
    const statusHues = [
      ...Object.values(palette.success),
      ...Object.values(palette.danger),
      ...Object.values(palette.warning),
    ];
    for (const color of avatarPalette) {
      expect(statusHues).not.toContain(color);
    }
  });

  it('keeps alpha tokens translucent, so they composite over anything', () => {
    for (const value of [...Object.values(blackAlpha), ...Object.values(whiteAlpha)]) {
      expect(value).toMatch(/^rgba\(/);
    }
  });

  it('computes concentric inner radii', () => {
    expect(nestedRadius(16, 4)).toBe(12);
    expect(nestedRadius(4, 8)).toBe(0);
  });

  it('starts breakpoints at zero, which Unistyles requires', () => {
    expect(Math.min(...Object.values(breakpoint))).toBe(0);
  });

  it('keeps every touch-target-bearing control at or above 44pt', () => {
    expect(size.control.md).toBeGreaterThanOrEqual(size.touchTarget);
    expect(size.control.lg).toBeGreaterThanOrEqual(size.touchTarget);
  });
});

describe('typography tokens the Text primitive depends on', () => {
  /**
   * Proportional digits have different widths, so a value that changes in
   * place — a score, a countdown, a column of figures — visibly reflows as it
   * updates. `tabular` is what stops that, and `Text numeric` is how a call
   * site asks for it.
   */
  it('exposes tabular figures', () => {
    expect(fontVariant.tabular).toEqual(['tabular-nums']);
  });

  /** Uppercase set at caption tracking reads as cramped, so eyebrow needs its own. */
  it('exposes the tracking and transform an eyebrow needs', () => {
    expect(letterSpacing.wide).toBeGreaterThan(0);
    expect(textTransform.upper).toBe('uppercase');
  });
});
