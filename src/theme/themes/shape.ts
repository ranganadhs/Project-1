import type { ViewStyle } from 'react-native';
import { radius } from '../tokens/radius';

/**
 * Tier 2 — ROLE tokens for corner treatment.
 *
 * Tier 1 `radius` is a scale: ten steps, no meaning. This maps meaning onto
 * it, the same way the colour themes map meaning onto the palette ramps.
 *
 * ── WHY THESE ARE STYLES AND NOT NUMBERS ──────────────────────────────────
 * A corner has two properties, not one: how far it is rounded, and whether the
 * curve is circular or continuous. React Native defaults the second to
 * `circular` — `enum class BorderCurve : uint8_t { Circular, Continuous }`, and
 * the first enumerator is the zero value — so a plain `borderRadius` gives the
 * CSS-style arc, never Apple's smoothed corner.
 *
 * Carrying both on one token means the curve cannot be forgotten: there is no
 * way to use the role and not get it.
 *
 *   card: { ...theme.shape.card, padding: theme.space[4] }
 *
 * Asymmetric corners spread the role and override the odd one, which is
 * shorter than listing four and keeps the role name at the call site:
 *
 *   bubble: { ...theme.shape.card, borderBottomLeftRadius: theme.radius.xs }
 *
 * ── WHY A ROLE AND NOT A SCALE STEP ───────────────────────────────────────
 * A button is 12 and a card is 16 because that is what a button and a card
 * are, not because they happen to sit on those steps. Reading the step at the
 * call site loses that: the next person cannot tell whether `radius.lg` on a
 * button means "buttons are 12" or "this one needed 12", so the value drifts.
 * With a role token, a rebrand is one line here.
 *
 * ── SCOPE ─────────────────────────────────────────────────────────────────
 * `borderCurve` is iOS 13+ and Android ignores it, so this is a deliberate,
 * one-way platform divergence. It is also imperceptible below roughly 12pt —
 * on this ladder it changes `button`, `card`, `overlay` and `notice`, and does
 * nothing visible at smaller radii. A refinement, not an overhaul.
 *
 * MODE-INDEPENDENT: shape does not change between light and dark, so both
 * themes share this one object. Elevation is the counter-example — see
 * `tokens/elevation.ts` for a scale that genuinely must differ per scheme.
 */
const smooth = { borderCurve: 'continuous' } as const satisfies Pick<ViewStyle, 'borderCurve'>;

/** A corner: how far it rounds, and how the curve is drawn. */
export type CornerStyle = Required<Pick<ViewStyle, 'borderRadius' | 'borderCurve'>>;

const corner = (borderRadius: number): CornerStyle => ({ borderRadius, ...smooth });

export const shape = {
  /**
   * Curve WITHOUT a radius, for the cases a role cannot name: a radius that
   * arrives as a prop (`Skeleton`, `Image`), or one computed by
   * `nestedRadius()`. Spread alongside the radius you already have.
   *
   *   { ...theme.shape.smooth, borderRadius: theme.radius[size] }
   *
   * Without this, "smoothed everywhere" is unreachable — those call sites have
   * no role to read.
   */
  smooth,
  /** Every pressable that reads as a button. */
  button: corner(radius.lg),
  /** Cards and grouped sections. */
  card: corner(radius.xl),
  /** Text fields and other input wells. */
  field: corner(radius.lg),
  /** Sheets, menus, popovers, dialogs. */
  overlay: corner(radius['2xl']),
  /**
   * Fully rounded — chips, badges, progress tracks, anything reading as a pill.
   *
   * Continuous curvature is a NO-OP at a capsule radius: there is no corner
   * left to smooth. Kept uniform rather than special-cased, so nobody has to
   * remember which one role is different.
   *
   * A true CIRCLE — equal width and height — is different again: it has no
   * corner at all, so it keeps a bare `radius.full` rather than reading this.
   */
  chip: corner(radius.full),
  /** Banners and inline notices — a surface, but flatter than a card. */
  notice: corner(radius.lg),
} as const;

export type ShapeKey = Exclude<keyof typeof shape, 'smooth'>;
