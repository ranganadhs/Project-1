/**
 * Opacity by MEANING, not by number. `opacity.disabled` survives a redesign;
 * `opacity[40]` does not tell the next person whether 0.4 was a disabled state
 * or a decorative wash, so changing it is guesswork.
 */
export const opacity = {
  /** Fully hidden but still laid out and focusable — prefer `display` if not. */
  hidden: 0,
  /** Disabled controls. Paired with pointer-events off, never on its own. */
  disabled: 0.4,
  /** Non-essential supporting content. */
  muted: 0.6,
  /** Press feedback on surfaces that do not scale. */
  pressed: 0.7,
  /** Backdrop behind a modal. */
  scrim: 0.5,
  /** Heavier backdrop for content that must not be readable behind a sheet. */
  scrimHeavy: 0.7,
  /** Watermarks and decorative art. */
  decorative: 0.08,
  /** Ghost/skeleton at rest, before the shimmer lifts it. */
  skeleton: 0.4,
  full: 1,
} as const;
