import type { ReactNode } from 'react';
import { FieldGroup, Switch as NativeSwitch, Text as NativeText, Button as NativeButton } from '@expo/ui';
import { NativeHost } from './native-host';

export type NativeFormProps = {
  children: ReactNode;
};

/**
 * Native grouped form: a real SwiftUI `Form` on iOS, Compose equivalents on
 * Android.
 *
 * What this buys over our own Section + ListItem: system row heights, correct
 * separator insets (which differ per platform and per row content), automatic
 * grouping chrome, and on iOS 26 the current form styling — all of which shift
 * between OS releases and would otherwise need chasing by hand.
 *
 * What it costs: the rows are OS-drawn, so they follow the system look rather
 * than the design tokens. Use this for genuinely system-flavoured surfaces —
 * settings, preferences, permissions. Use Section + ListItem when the rows must
 * carry the product's own visual identity.
 *
 * ── SIZING: `viewport`, NOT `hug` ─────────────────────────────────────────
 * A `Form` is a SCROLL CONTAINER. `hug` asks the host to match the content's
 * height, which SwiftUI resolves as `.fixedSize` on the scroll axis: the form
 * is laid out at its full height, the host grows to fit it, and the form's own
 * scrolling silently stops — every gate green, and a long settings screen
 * that cannot scroll on a small phone. `viewport` proposes the available size
 * instead, which is what a scroll view expects. It needs a bounded parent, so
 * put this inside a non-scrolling `Screen` (or any `flex: 1` container), never
 * inside a `Screen scroll` — two scroll views nested on the same axis is the
 * other way to lose scrolling.
 */
export function NativeForm({ children }: NativeFormProps) {
  return (
    <NativeHost sizing="viewport">
      <FieldGroup>{children}</FieldGroup>
    </NativeHost>
  );
}

export type NativeFormSectionProps = {
  title?: string;
  children: ReactNode;
};

export function NativeFormSection({ title, children }: NativeFormSectionProps) {
  return <FieldGroup.Section title={title}>{children}</FieldGroup.Section>;
}

/** Re-exported so a native form is composed from one import. */
export { NativeSwitch, NativeText, NativeButton };
