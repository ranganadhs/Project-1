import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { LottieProps } from './lottie';

/**
 * Web stub — renders the animation's space and nothing in it.
 *
 * ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
 * `lottie-react-native` ships `LottieView/index.web.js`, which imports
 * `@lottiefiles/dotlottie-react`. That peer is NOT a dependency of this project,
 * and Metro selects the `.web.js` variant on web — so importing Lottie anywhere
 * would break `expo export --platform web` with a resolution error, in a build
 * nobody runs until they try to ship the web target.
 *
 * A platform variant costs nothing and keeps the web bundle resolvable. It is
 * the same approach as `storage.web.ts` and `app-tabs.web.tsx`.
 *
 * It renders a `View` carrying the same `style` rather than `null`, so the
 * layout around it is identical on both platforms — a missing element would
 * collapse whatever space the animation was holding.
 *
 * ── IF YOU ACTUALLY WANT ANIMATION ON WEB ─────────────────────────────────
 *   pnpm add @lottiefiles/dotlottie-react
 * then delete this file. `lottie-react-native` will resolve its own web
 * implementation from there.
 */
export function Lottie({ style, testID }: LottieProps) {
  return <View style={style as StyleProp<ViewStyle>} testID={testID} />;
}
