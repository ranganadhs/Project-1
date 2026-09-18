import type { ReactNode } from 'react';
import { Host } from '@expo/ui';
import { useUnistyles } from 'react-native-unistyles';
import type { StyleProp, ViewStyle } from 'react-native';

export type NativeHostProps = {
  children: ReactNode;
  /**
   * How the host takes its size.
   *
   *   'hug'      — fill available width, height from the SwiftUI/Compose
   *                content. The right default for a form CONTROL in a column
   *                layout: a switch, a picker, a button.
   *   'inline'   — hug both axes, for a control sitting next to other content.
   *   'viewport' — the host proposes the VIEWPORT size to the native content.
   *                Required for a scroll container (`Form`, `FieldGroup`,
   *                `List`, `ScrollView`, lazy stacks): those have no intrinsic
   *                size, and `matchContents` on their scroll axis resolves to
   *                SwiftUI's `.fixedSize` — the content is laid out at its full
   *                height and scrolling silently stops working. Give it a
   *                bounded parent (`flex: 1`), the same as any scroll view.
   *   'fill'     — size purely from React Native layout. ONLY when an ancestor
   *                gives a concrete height; otherwise the host has no intrinsic
   *                size and collapses to ZERO, rendering nothing.
   *
   * A flexible-WIDTH control — `Slider`, `DatePicker`, a linear progress bar —
   * has no intrinsic width either, so horizontal `matchContents` collapses it
   * to near-zero width. `hug` is vertical-only for exactly that reason; never
   * use `inline` for one of those.
   */
  sizing?: 'hug' | 'inline' | 'viewport' | 'fill';
  style?: StyleProp<ViewStyle>;
};

// `matchContents` can only be set once on mount, so these must be module-level
// constants — deriving one from a changing prop would be silently ignored.
const HUG = { vertical: true, horizontal: false } as const;
const INLINE = { vertical: true, horizontal: true } as const;

/**
 * Every `@expo/ui` tree must be wrapped in `Host`. This wrapper adds the one
 * bridge we can build between the design system and native views, and picks a
 * sizing mode that actually renders.
 *
 * `@expo/ui` renders real SwiftUI / Jetpack Compose, so those views ignore
 * Unistyles entirely — no token reaches inside them. What the Host DOES accept:
 *
 *   colorScheme — forced to the Unistyles theme, so native views follow the
 *                 app's theme rather than the OS setting. Without this, a user
 *                 who overrides the app theme would see native controls stay on
 *                 the system appearance while everything else flipped.
 *   seedColor   — Android Material You derives its tonal palette from this, and
 *                 on iOS it propagates as the SwiftUI tint, so sliders and
 *                 switches pick up the brand colour.
 *
 * Beyond those, individual components take `modifiers` (tint, background,
 * font, foregroundColor) for the properties the platform lets you set. The
 * control's geometry, materials and chrome are the OS's decision, by design.
 */
export function NativeHost({ children, sizing = 'hug', style }: NativeHostProps) {
  const { theme, rt } = useUnistyles();

  return (
    <Host
      matchContents={sizing === 'hug' ? HUG : sizing === 'inline' ? INLINE : false}
      useViewportSizeMeasurement={sizing === 'viewport'}
      colorScheme={rt.themeName === 'dark' ? 'dark' : 'light'}
      seedColor={theme.color.interactive.primary.rest}
      style={sizing === 'viewport' ? [styles.viewport, style] : style}
    >
      {children}
    </Host>
  );
}

// Plain layout values, no tokens involved; kept out of a StyleSheet.create so
// this leaf stays free of a module-scope stylesheet (see tab-bar-clearance.ts).
const styles = { viewport: { flex: 1 } as const };
