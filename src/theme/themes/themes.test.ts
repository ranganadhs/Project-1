import { themes } from './index';

describe('tier 2 semantic themes', () => {
  const names = Object.keys(themes) as (keyof typeof themes)[];

  it('registers exactly the light and dark themes adaptiveThemes requires', () => {
    expect(names.sort()).toEqual(['dark', 'light']);
  });

  it('gives every theme an identical key shape', () => {
    const shape = (o: object): string[] =>
      Object.entries(o)
        .flatMap(([k, v]) =>
          v && typeof v === 'object' && !Array.isArray(v) ? shape(v).map((s) => `${k}.${s}`) : [k],
        )
        .sort();
    expect(shape(themes.dark.color)).toEqual(shape(themes.light.color));
  });

  it('resolves every colour token to a concrete colour string', () => {
    for (const name of names) {
      const walk = (o: object, path: string): void => {
        for (const [k, v] of Object.entries(o)) {
          if (typeof v === 'string') {
            expect(`${name}.${path}${k}=${v}`).toMatch(/=(#[0-9A-F]{6}|transparent|rgba?\()/i);
          } else if (v && typeof v === 'object') {
            walk(v, `${path}${k}.`);
          }
        }
      };
      walk(themes[name].color, '');
    }
  });

  it('inverts canvas between light and dark', () => {
    expect(themes.light.color.bg.canvas).not.toBe(themes.dark.color.bg.canvas);
  });

  it('re-exports tier 1 scales so components never import tokens directly', () => {
    expect(themes.light.space[4]).toBe(16);
    expect(themes.light.radius.full).toBe(9999);
    expect(themes.light.motion.duration.normal).toBe(200);
  });

  /**
   * If `Button` filled its soft BRAND variant with `bg.sunken` — the neutral
   * well — a soft brand button would be indistinguishable from a soft neutral
   * one and the `tone` prop would have no visible effect. Nothing else catches
   * that: both are colour strings, and both render.
   *
   * A brand tint that equals the neutral well makes the token meaningless, so
   * this is a real invariant rather than a coincidence of the current ramps.
   */
  it('keeps the brand tint distinct from the neutral well', () => {
    for (const name of names) {
      expect(themes[name].color.bg.brandSubtle).not.toBe(themes[name].color.bg.sunken);
    }
  });

  /**
   * The other half of the same bug: `Button` filled its solid DANGER variant
   * from `status.danger.fg`, a TEXT colour, which left the button with no
   * pressed and no disabled state. Only `interactive.*` carries a state ladder,
   * and that is the actual reason a fill must come from it.
   *
   * Note there is deliberately NO assertion that the two tokens hold different
   * values. In dark they legitimately coincide — a fill carrying dark text and
   * a text colour sitting on a dark tint both land on the same light red. The
   * rule is about which token owns a ladder, not about the hex.
   */
  it('gives every interactive role a full state ladder', () => {
    for (const name of names) {
      for (const role of ['primary', 'secondary', 'ghost', 'danger'] as const) {
        const states = themes[name].color.interactive[role];
        expect(Object.keys(states).sort()).toEqual(['disabled', 'hover', 'pressed', 'rest']);
      }
    }
  });

  /** And the token a fill must never come from has no ladder to offer. */
  it('gives status tones no state ladder, which is why they cannot be fills', () => {
    for (const name of names) {
      expect(themes[name].color.status.danger).not.toHaveProperty('pressed');
      expect(themes[name].color.status.danger).not.toHaveProperty('disabled');
    }
  });
});
