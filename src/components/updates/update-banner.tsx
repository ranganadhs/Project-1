import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Leaf imports, not the barrel — see build-info.tsx for why.
import { Text } from '@/components/ui/text';
import { HStack, VStack } from '@/components/ui/stack';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { haptics } from '@/lib/haptics';
import { useOTAUpdates } from '@/lib/updates';

/**
 * What a `forced` over-the-air update looks like to a user.
 *
 * Shown only when an update published with `APP_UPDATE_POLICY=forced` has
 * finished downloading. A `silent` update — the default, and almost every
 * update — never renders anything: it is already on the device and runs at the
 * next cold start.
 *
 * ── WHY IT IS PINNED TO THE TOP AND NOT THE BOTTOM ────────────────────────
 * The bottom is where a snackbar belongs, and it is unavailable: the native tab
 * bar is a real `UITabBarController`, an OS window, and it draws above every
 * React Native view regardless of `zIndex` (see theme/tokens/z-index.ts). A
 * bottom-anchored banner would sit UNDER the tab bar on every tabbed route.
 * Top anchoring is the correct placement, not a compromise.
 *
 * It does cover the pinned `<Screen header>` while it is up. That is intended:
 * the whole point of `forced` is that this is the thing to deal with first.
 *
 * ── WHY THE WHOLE ROW IS THE CONTROL ──────────────────────────────────────
 * A `Button` inside a `bg.brand` fill has no good variant — `solid` is
 * brand-on-brand and vanishes, `soft` is a brandSubtle wash that barely reads
 * against it. Making the row itself pressable sidesteps a contrast problem
 * instead of inventing a token to paper over it, and gives a much larger touch
 * target than someone fumbling for a small button on a moving bus.
 *
 * `fg.onBrand` throughout, never `fg.primary`: this sits on a brand fill in
 * BOTH themes, so the label must not follow the scheme.
 *
 * Deliberately NOT `<Banner>` from components/ui. That one is an inline,
 * in-flow, non-interactive tinted notice built on `status.*.bg`. Bending it to
 * float, press, and carry a brand fill would leave one component doing two
 * unrelated jobs — and this is not a status: nothing has gone wrong.
 */
export function UpdateBanner() {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { isRestartRequired, restart } = useOTAUpdates();

  if (!isRestartRequired) return null;

  return (
    /*
      NO ENTRANCE ANIMATION, deliberately.

      This component returns null until the moment it should appear, so mount is
      exactly the right trigger for one — but the boilerplate ships no entrance
      primitive, and a banner that animates on its own terms is how an app ends
      up with five different fades. If you add one, add it as a primitive first
      and drive it from `theme.motion.easeTransition.enter` through
      react-native-ease, which is the engine this repo designates for a
      declarative mount transition. Do not hand-roll it here.
    */
    <View style={[styles.anchor, { top: insets.top + theme.space[2] }]}>
      <PressableScale
        style={styles.banner}
        accessibilityRole="button"
        accessibilityLabel="Update ready. Restart the app to continue."
        accessibilityHint="Restarts the app to finish updating"
        /*
          A primary, COMMITTING control — `medium`. Not `heavy`, which is for
          destructive actions, and restarting into a fixed build is the
          opposite of destructive.

          Fired at the moment the restart is COMMITTED, not on press-in.
          Haptics confirm a result; a buzz on touch-down announces an action
          the user may still cancel by dragging off, and it fires on every
          tap regardless of outcome. Here the press IS the commit, so the two
          happen in the same frame as the reload begins.
        */
        onPress={() => {
          haptics.medium();
          // Reload screen colours are read here and passed as props, which
          // normally trails a theme change by a render (trap 12). Harmless in
          // this one case: it is a single shot at the moment of the tap, and
          // the runtime is gone a frame later.
          void restart({
            backgroundColor: theme.color.bg.canvas,
            fade: true,
            spinner: { enabled: true, color: theme.color.fg.brand, size: 'small' },
          });
        }}
      >
        <HStack gap={3} align="center">
          <Icon name="arrow-down-circle" size="md" color={theme.color.fg.onBrand} />
          <VStack gap={0} style={styles.copy}>
            <Text variant="label" weight="medium" tone="onBrand">
              Update ready
            </Text>
            <Text variant="caption" tone="onBrand" style={styles.subtitle}>
              Tap to restart and finish updating
            </Text>
          </VStack>
          <Icon name="chevron-forward" size="sm" color={theme.color.fg.onBrand} />
        </HStack>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  anchor: {
    position: 'absolute',
    left: theme.layout.gutter,
    right: theme.layout.gutter,
    // Above modals so a forced restart is never hidden behind a dialog the
    // user cannot resolve without restarting anyway.
    zIndex: theme.zIndex.toast,
  },
  banner: {
    ...theme.shape.notice,
    backgroundColor: theme.color.bg.brand,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    // Elevation is per-scheme (tokens/elevation.ts) — a shadow works by
    // darkening what is behind it, so this reads on both canvases.
    ...theme.elevation.md,
  },
  copy: { flex: 1 },
  // The supporting line is the same pairing colour, held back with opacity
  // rather than a second token — there is no "secondary on brand" in the ramp,
  // and inventing one for a single banner would be a token nobody else needs.
  subtitle: { opacity: theme.opacity.muted },
}));
