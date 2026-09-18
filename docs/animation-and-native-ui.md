# Animation and native UI on Expo SDK 57

How motion and platform chrome are done in this repo, and why. Written for
the agent about to animate something, wrap an `@expo/ui` view, or decide
whether a screen "feels native". The rules are the current Expo and
Reanimated guidance, applied to what this codebase ships. Where the two
disagree, the resolution is stated, not left to the reader.

`CLAUDE.md` has the hard rules. This is the reference behind them.

---

## 1. Two runtimes, one decision table

Reanimated 4 makes the architecture explicit: there is the React Native
runtime, where React renders, and the UI runtime, where worklets run every
frame. Every animation question is really "which runtime carries this, and
does it ever have to cross?" The craft is keeping motion on the UI runtime and
crossing only at the edges.

Walk down. Stop at the first row that fits.

| Need | Tool | In this repo |
|---|---|---|
| A state-driven change with no gesture — press, toggle, colour, a value flipping | **Reanimated CSS transition** (`transitionProperty` in the style) or `react-native-ease` | `PressableScale`, `SegmentedControl` indicator, `UpdateBanner` |
| A loop, a multi-stage sequence, or motion that plays on mount without a state change | **Reanimated CSS animation** (`animationName` keyframes), or `withRepeat` for an existing shared-value loop | `Skeleton` shimmer (`withRepeat`; degrades under `ReduceMotion.System`) |
| An element mounting or unmounting, a list reflowing | **Layout animations** (`entering` / `exiting` / `itemLayoutAnimation`) — never `entering` on a virtualized row | — |
| Anything a finger touches, or anything derived from scroll | **`useSharedValue` + `Gesture` + `useAnimatedStyle`** | — |
| Screen to screen | **Native stack options** in Expo Router. Never hand-roll this | `src/app/(app)/_layout.tsx` |
| A bottom sheet that is its own destination | **`presentation: 'formSheet'`** | `sheet` route |
| Tab bar | **`NativeTabs`** | `AppTabs` |
| Context menu, press-and-hold preview | **`Link.Menu` / `Link.Preview`** (iOS only) | — |
| A header that collapses into a large title | **`headerLargeTitleEnabled`** (iOS only) | — |
| Pull to refresh | **`RefreshControl`** | `Screen`, `List` |
| UI tracking the keyboard | **`react-native-keyboard-controller`** | `Screen keyboardAware` |
| Vector illustration, celebration, empty-state art | **Lottie** — never for UI state | `Lottie` |
| A large animated scene, freeform drawing | **`@shopify/react-native-skia`** | `AreaChart` (via victory) |

**Reach for a shared value only when the value is continuous or
interruptible.** A press scale is a CSS transition; a drag is a shared value.
Using a worklet for a two-state toggle is the mobile equivalent of installing
a motion library for a fade.

**Core `Animated` is not on the table.** It cannot be driven by a gesture
without crossing the bridge, and `useNativeDriver` refuses anything but
`transform` and `opacity`.

### Where `react-native-ease` sits

`react-native-ease` (AppAndFlow — *not* a Software Mansion package, despite
sitting beside Reanimated in most lists) runs declarative transitions on Core
Animation / `ObjectAnimator` with no JS loop and no worklets. Expo's animation
benchmark (under Sources) measures it as the fastest declarative engine by a
wide margin:

| Device · views | Ease | Reanimated CSS | RN `Animated` | Reanimated shared values |
|---|---|---|---|---|
| iPhone 15 Pro · 100 | 0.01 ms | 2.48 ms | 3.32 ms | 3.33 ms |
| Moto G8 · 50 | 3.43 ms | 9.06 ms | 8.82 ms | 10.57 ms |

Its own README states the limits: no gestures, no layout animation, no
shared-element. Expo's summary is the rule: "Ease for declarative animations;
Reanimated for gesture-driven or layout-changing animations."

It is installed (`package.json`) and used by `UpdateBanner`. The repo's rule:

- **State-driven transition → ease OR a Reanimated CSS transition.** Both are
  acceptable. Do not mix the two engines inside one component; pick per
  component and read timing from `theme.motion` either way.
- **Continuous or interruptible input → shared values.** Never ease.
- **Loops → Reanimated CSS animation.** Ease has no keyframe loop.

The Expo animation skill never mentions ease and defaults everything
state-driven to Reanimated CSS. That is a fine default too. What is not fine
is a shared value for a press.

---

## 2. Performance rules

Each of these has a measurable tell. None is a matter of taste.

- **`transform` and `opacity` are free. Everything else is a layout pass.**
  The exception is an absolutely positioned element with no children — a tab
  pill, a progress fill — where `width`/`left` are cheap because nothing
  reflows around them.
- **Never `scale(0)`.** Start from `scale(0.9–0.97)` + `opacity: 0`. A
  zero-scale start divides by nothing meaningful and reads as a pop.
- **Never `setState` from a gesture or scroll handler.** Every render is a
  bridge crossing in the middle of a 16 ms frame.
- **`scheduleOnRN` belongs in `onEnd` or a `useAnimatedReaction`, never in
  `onUpdate`.** `runOnJS` is deprecated in Worklets; write
  `scheduleOnRN(fn, arg)` — the argument is passed directly, not as a second
  invocation.
- **Use `.get()` / `.set()`, not `.value`.** Reanimated's docs call it the
  compiler-safe form; React Compiler treats `.value` mutation as an escape.
- **Never animate `BlurView` intensity.** It re-rasterises every frame.
- **Never animate `elevation`.** Android re-renders the shadow per frame.
  Shadows here are `boxShadow` strings from `theme.elevation`; animate
  `opacity` on a shadow layer if a shadow must move.
- **Easing has two spellings.** CSS transitions and animations take
  `cubicBezier(...)`; `withTiming` and layout builders take
  `Easing.bezier(...)`. Reanimated 4.1.1 and 4.5.1 reject a raw
  `'cubic-bezier(...)'` string. `theme.motion` exports both forms.
- **Layout builders are built once.** `FadeIn.duration(200)` inside render
  allocates a builder per render; define it at module scope or `useMemo`.
- **`itemLayoutAnimation` works only on a single-column `Animated.FlatList`.**
  FlashList rows recycle; animate the container instead.
- **Judge feel in a release build.** A dev build's JS thread is slow enough to
  hide exactly the problems you are looking for. Expo's benchmark headline:
  "Debug builds lie."
- **120 fps is on.** The SDK 57 prebuild template sets
  `CADisableMinimumFrameDurationOnPhone: true`. Do not add it again.
- **A missing worklets plugin does not fall back silently.** It throws
  `Failed to create a worklet` at runtime. `babel-preset-expo` configures it;
  `babel.config.js` lists it explicitly only to force ordering after the
  Unistyles plugin.

---

## 3. Timing and springs

### Durations (from the Expo animation skill, matched to `theme.motion.duration`)

| Motion | Duration | Token |
|---|---|---|
| Press down | 100–150 ms | `duration.fast` |
| Toggle, chip, colour change | 150–200 ms | `duration.normal` |
| Sheet settle | ~300 ms spring | `spring.gentle` |
| Enter | 300–350 ms | `duration.slow` |
| Screen transition | **platform default — do not override** | — |
| Tab switch | **never slides** — `animation: 'none'` | — |

`duration.slowest` (640 ms) exists for full-screen custom surfaces, not for
stack transitions. If a screen transition needs tuning, the answer is a
different `animation` value on `Stack.Screen`, not a duration.

**Never `ease-in` on UI.** Things arrive decelerating (`ease-out`) and leave
accelerating (`ease-in`) only when the user has stopped caring about them.

### Springs in Reanimated 4

`withSpring` takes Apple's two designer parameters directly:

```ts
withSpring(target, { duration: 400, dampingRatio: 1 });
```

- `duration` is **perceptual** since 4.0 — divide any 3.x value by 1.5.
- `dampingRatio` 1 is critically damped: fastest settle, no overshoot.
  0.8 for a drag snap or a sheet, with `velocity` from the gesture.
- The physics form (`mass` / `damping` / `stiffness`) and the duration form
  **cannot be mixed** in one config.
- `restDisplacementThreshold` / `restSpeedThreshold` are gone; use
  `energyThreshold`.

`theme.motion.spring` carries both forms with the damping ratio stated in the
comment (`snappy` ζ = 1.00, `gentle` ζ ≈ 0.99, `heavy` ζ ≈ 1.06, `bouncy`
ζ = 0.42). Default to `snappy`. `bouncy` is opt-in for a celebratory pop and
never for a control changing state; a test asserts its ratio, so do not tune
it by eye.

"Springs when a finger is involved" is the whole heuristic. A toggle is a
timing curve; a drag release is a spring with the release velocity.

---

## 4. Reduced motion and reduced transparency

Reduced motion means **fewer and gentler, not zero**. Keep opacity and colour
changes; drop translation, scale, parallax and overshoot.

- `useReducedMotion()` reads the setting once at app start. `(app)/_layout.tsx`
  switches the stack to `animation: 'fade'` when it is on.
- Every `withTiming` / `withSpring` / `withDelay` / `withRepeat` defaults to
  `ReduceMotion.System`, so `Skeleton`'s repeat degrades on its own. Layout
  builders take `.reduceMotion(ReduceMotion.System)`.
- `Lottie` honours it through `AccessibilityInfo`. Any new loop must too.
- CSS transitions have no reduce-motion switch of their own; gate the
  `transitionDuration` on the hook.

Reduce **transparency** is a separate setting. When it is on, skip Liquid
Glass *and* blur and render a solid `bg.raised` surface. `Glass` reads it;
anything new that samples what is behind it must as well.

---

## 5. Native-feel checklist (iOS 26 / Android 16)

One rule per row. The API is what the platform provides; the last column is
where this repo does it, or where it belongs.

| Rule | API | Here |
|---|---|---|
| The tab bar is the OS tab bar. Liquid Glass is automatic on iOS 26. | `NativeTabs` from `expo-router/unstable-native-tabs` (SDK 54–57), `minimizeBehavior="onScrollDown"`, `role="search"` for a trailing search tab, `NativeTabs.Trigger.Badge`, `tabBarRespectsIMEInsets` (Android 11+, needs `softwareKeyboardLayoutMode: "resize"`). Max 5 tabs on Android. `backgroundColor`/`blurEffect` affect iOS ≤ 18 only. Wrap in `ThemeProvider` or the glass flashes white. | `AppTabs`; `TabConfig` carries `badge`, `role`, `minimizeBehavior` |
| Headers are configured, never rebuilt. | `headerLargeTitleEnabled` (iOS) needs a Stack *inside* the tab and a scroll view as the *first child* with `contentInsetAdjustmentBehavior="automatic"` (wrapper → `collapsable={false}`). `headerTransparent` + `headerBlurEffect`; on iOS 26 do not combine with `scrollEdgeEffects`. | `Screen`, `List` set the inset behaviour |
| Search lives in the header. | `<Stack.SearchBar placeholder onChangeText />`; on iOS 26 `Stack.Toolbar.SearchBarSlot` for the bottom bar; a search tab uses `headerSearchBarOptions` inside its own Stack. | — |
| Toolbars are native. | `Stack.Toolbar placement="left\|right\|bottom"` with `.Button` (`plain\|done\|prominent`), `.Menu`, `.Badge`, `.Spacer` (explicit `width` on Android). iOS takes SF Symbol names; Android takes image sources (`@expo/material-symbols/*.xml`). Alpha. | — |
| Sheets are `formSheet` routes. | `sheetAllowedDetents: number[] \| 'fitToContents'`, `sheetInitialDetentIndex`, `sheetLargestUndimmedDetentIndex`, `sheetGrabberVisible` (iOS), `sheetCornerRadius` (**iOS only** — `@platform ios` in react-native-screens types). Android: max 3 detents, no native header or nested stack inside a sheet, `unstable_sheetFooter`. `contentStyle: { backgroundColor: 'transparent' }` makes the sheet Liquid Glass on iOS 26. `flex: 1` works with numeric detents, not with `fitToContents`. | `sheet` route |
| Menus and previews are native. | `Link.Trigger` + `Link.Preview` + `Link.Menu` (iOS only, `replace` unsupported). SwiftUI `ContextMenu` (long press) / `Menu` (tap); Compose `DropdownMenu`; cross-platform `@expo/ui/community/menu`. | `Menu`, `ContextMenu` |
| Zoom transitions for thumbnail → detail only. | `Link.AppleZoom` / `Link.AppleZoomTarget` / `withAppleZoom`. iOS 18+, Stack only, alpha. Avoid on full-width list rows; always provide a close button. | — |
| Liquid Glass obeys four rules. | `GlassView` never with `overflow: 'hidden'` (it clips itself via `borderRadius` + `borderCurve`; outside clipping cuts the rim highlight). `opacity: 0` on it or any ancestor kills the effect — animate `glassEffectStyle.animate` instead. `isInteractive` only on controls. Check `isLiquidGlassAvailable() && isGlassEffectAPIAvailable()` at runtime, never `Platform.OS`. Solid surface under Reduce Transparency. | `Glass` (`isInteractive` prop) |
| Haptics confirm, never announce. | `selectionAsync` for a value ticking past a step, `impactAsync(Light)` for a snap or detent, `Medium` for a heavy landing, `notificationAsync` for outcomes. Same frame as the visual. One per user action. Never the only feedback. From a worklet: `scheduleOnRN(haptics.select)`. Silent in Low Power Mode. | `haptics.*` intents in `@/lib/haptics` |
| Safe areas come from the chrome. | Headers and tab bars inset themselves; otherwise `contentInsetAdjustmentBehavior="automatic"` on the first scroll view, or `useSafeAreaInsets`. RN 0.86 is edge-to-edge on Android 15+; a bottom inset is always needed there. | `Screen` applies the bottom inset once |
| Keyboard is frame-accurate. | `KeyboardProvider` at root; `KeyboardAwareScrollView bottomOffset`; `KeyboardToolbar`; `useReanimatedKeyboardAnimation` for a sticky footer. Never build this from `Keyboard.addListener` plus a timing. `keyboardShouldPersistTaps="handled"` on forms. `@expo/ui` `Host ignoreSafeArea="keyboard"` when RN already avoids it. | `Screen keyboardAware` |
| Dynamic Type stays on. | Never `allowFontScaling={false}` app-wide. Let labels wrap or reflow first; cap a single element with `maxFontSizeMultiplier` only when wrapping fails. Rows use `minHeight`, never a fixed height; never animate to a hard-coded height (measure with `onLayout` or animate a transform). `@expo/ui`: `dynamicTypeSize({ max: 'accessibility3' })` on the Host. | `size.control.*` minHeights |
| Dark mode is the theme's, not the OS's. | `userInterfaceStyle: 'automatic'`, one `SystemBars` driven from the resolved theme, pairing tokens on every fill (`fg.onBrand`, `status.*.onSolid`). Native controls follow through `NativeHost colorScheme`. | `src/theme/system-bars.ts`, `NativeHost` |
| Everything interactive has a label and a target. | Custom primitives expose role and disabled/busy/selected state; icon-only controls and buttons that swap text for a spinner keep an explicit label while loading. Targets ≥ 44 pt (48 dp), grown with `hitSlop` from `theme.hitSlop`, never by enlarging the visual. `<Text selectable>` on copyable data. | `PressableScale` applies `theme.hitSlop` |
| Every screen has four states. | Loading, error, empty, content. Loading ≠ empty. Empty is designed (`ListEmptyComponent`). Skeleton for a slow first load with a known layout; `RefreshControl` for user refresh; refetches keep stale content (`isPending` first fetch, `isFetching` background — never branch on `!data`). Disable repeat submission while a mutation is pending; on failure keep the draft and show an inline error; restore or mark unsynced after a failed optimistic update. | `EmptyState`, `ErrorState`, `Skeleton`, `List` |
| One icon family per platform. | SF Symbols on iOS, Material Symbols on Android. `expo-symbols` on SDK 57 takes `name={{ ios, android, web }}` (`SymbolViewProps.name` is `SFSymbol \| { ios?, android?: AndroidSymbol, web? }`); a bare string renders nothing on Android without `fallback`. Never emoji, never one FontAwesome set for both. | `Icon`: `sf` for iOS, `md` for Android (Material Symbols, no extra package); the Ionicons `name` is the fallback when a platform glyph is not given |
| Press feedback matches the role. | Buttons scale 0.96–0.97 or dim, as a CSS transition (`duration.press`); full-width rows highlight their background instead of scaling; never `TouchableOpacity`; Android ripple only in a Material-styled app. | `PressableScale`, `ListItem` |
| Corners are continuous, shadows are low. | `borderCurve: 'continuous'` on every non-capsule radius through the `shape` roles; `boxShadow` strings from `theme.elevation`, never legacy `shadow*` props or `elevation`. iOS is a low-shadow platform. | `theme.shape`, `theme.elevation` |
| Permissions are asked in context. | An explanation screen with a Grant button; never a prompt on mount; media library lazily at first save. Every usage string rewritten — the store rejects generic ones. | `usePermission`, `useRequestOrSettings` |
| The splash is tested on a release build. | `SplashScreen.setOptions({ fade: true })`; held until hydration and fonts. Expo Go shows the icon instead of the splash, so it proves nothing there. | `src/app/_layout.tsx` |
| No platform costume. | No FAB or ripple in iOS layouts; no hand-drawn iOS chrome (back chevrons, large-title text, iOS-styled switches) on Android. Native controls carry their platform's look; branded controls carry the brand on both. | `src/components/native` vs `src/components/ui` |

---

## 6. `@expo/ui` on SDK 57

### Three entry points and the crash rule

| Import | Platforms | Contents |
|---|---|---|
| `@expo/ui` | Android, iOS, web | Universal: `Host, Column, Row, Text, Button, ScrollView, Switch, Slider, Checkbox, BottomSheet, Collapsible, FieldGroup, Icon, List, ListItem, Picker, RNHostView, Spacer, TextInput, useNativeState` (from the installed types) |
| `@expo/ui/swift-ui` | iOS, tvOS | SwiftUI tree: `Form, Section, ContextMenu, Menu, DatePicker, Gauge, Popover, SwipeActions, TabView, …` plus `modifiers` |
| `@expo/ui/jetpack-compose` | Android | Compose tree: `Card, Chip, DropdownMenu, SegmentedButton, Snackbar, PullToRefreshBox, …` plus `modifiers` |
| `@expo/ui/community/<name>` | Android, iOS | Drop-ins: `BottomSheet, DateTimePicker, MaskedView, Menu, PagerView, Picker, SegmentedControl, Slider` |

Importing `swift-ui` or `jetpack-compose` in a file that runs on the other
platform crashes at runtime with `Unable to get view config`. Split by
`.ios.tsx` / `.android.tsx` **outside** `src/app` (the router throws
"no fallback sibling" for platform files inside it). `Host` always comes from
the root package.

The docs' universal list has no `Menu`; the Expo `expo-ui` skill claims it
does. The docs index and the installed types agree — there is no universal
`Menu`. Use the community drop-in.

### `Host` — the sizing contract

`Host` props on SDK 57 (from the installed `Host` types): `colorScheme`, `seedColor`, `matchContents`,
`ignoreSafeArea`, `layoutDirection`, `onLayoutContent`,
`useViewportSizeMeasurement`, `pointerEvents` (SwiftUI only). **There is no
`accentColor` on `Host`**; that prop belongs to the community `DateTimePicker`
alone. `seedColor` is the SwiftUI tint on iOS and generates a full Material 3
palette on Android.

`matchContents` is where hosts go wrong, and the failure is a view sized to
zero or a scroll that silently stops:

- It resolves to SwiftUI `.fixedSize`, so it only works for content with an
  **intrinsic size** or an explicit `frame`.
- **Never on the same axis as a scroll container** — `Form`, `List`,
  `ScrollView`, `LazyVStack`, `LazyHStack`, Compose `LazyColumn` /
  `Carousel`. Vertical `matchContents` on a `Form` stops it scrolling; on
  Compose it crashes. Use `style={{ flex: 1 }}` (the docs' own `Form`
  examples) or `useViewportSizeMeasurement`.
- **Flexible-width controls collapse under horizontal `matchContents`.**
  `Slider`, `DatePicker`, linear `ProgressView` have no intrinsic width and
  resolve to near zero. Match vertically only, with `width: '100%'`.
- **It can only be set once, on mount.** Deriving it from a prop is silently
  ignored, which is why `NativeHost` maps `sizing` to module-level constants.

`NativeHost sizing`: `'hug'` (vertical match, full width — form controls in a
column), `'inline'` (both axes — a control beside text), `'viewport'`
(`useViewportSizeMeasurement` + `flex: 1` — the host proposes the viewport
size, which is what `Form`, `List` and any scrollable content need),
`'fill'` (size purely from RN layout, only inside a parent with a concrete
height). `NativeForm` uses `'viewport'` for exactly this reason.

### Modifiers

Every component takes `modifiers={[...]}`, applied in array order:

```tsx
import { background, cornerRadius, padding, foregroundColor } from '@expo/ui/swift-ui/modifiers';

<Text modifiers={[background('#FF6B6B'), cornerRadius(12), padding({ all: 16 }), foregroundColor('#FFFFFF')]}>
  Hello
</Text>
```

Universal components also accept a `style` limited to
`padding*`, `backgroundColor`, `borderRadius`, `borderWidth`, `borderColor`,
`opacity`, `width`, `height`, translated to native modifiers. A modifier
supplied explicitly replaces the one derived from `style` for the same
property.

### What can and cannot be themed

**Can:** `Host.colorScheme`, `Host.seedColor`, and per-component `tint`,
`background`, `foregroundColor`, `font`, `buttonStyle`, `listRowBackground`,
`presentationBackground`, `Text textStyle`, the universal `style` pick.
`NativeHost` pushes the theme through the first two; pass tokens into
the rest at the call site.

**Cannot:** control geometry, materials and glass, list/form chrome,
separators, header case (`titleUppercase` is ignored on iOS — SwiftUI `Form`
decides), sheet detent physics, menu chrome. That is the point: a menu should
look like the OS's menu. It is also why `Button` in this repo is React
Native — a branded control cannot be styled inside a host beyond a tint.

`BottomSheet` background: prefer `presentationBackground` over `background`;
with a `Form` or `List` inside, add `scrollContentBackground('hidden')`.

### Two more contracts

- **`List` is not virtualized.** React creates every row up front. For more
  than a screen of rows, use `List` from `@/components/ui` (FlashList).
- **`TextInput` + `useNativeState`** runs `onChangeText` as a worklet on the
  UI thread and writes straight to the native value with no React render.
  Requires `react-native-worklets` (present).

### When to prefer `@expo/ui`, and the override

The Expo skill's default: `@expo/ui` for in-screen sheets, pickers, sliders,
toggles, menus, date/time, and grouped-form sections; RN built-ins only when
the component is missing.

This repo's override, in `CLAUDE.md`: **branded controls stay React Native
and token-driven.** `Button`, `Chip`, `Badge`, `TextField`, `Switch` carry the
brand on both platforms. Native wins where the OS does something JS cannot
(menu chrome, detent physics, locale-correct dates) or where feel belongs to
the platform (touch slop, drag momentum, a11y increments). A sheet that is a
destination is a `formSheet` route; an `@expo/ui` `BottomSheet` is for a sheet
that must live inside an existing screen.

### Snippets (SDK 57 docs, verbatim)

Host + Button, universal:

```tsx
import { Host, Button } from '@expo/ui';
export default function MatchContentsExample() {
  return (
    <Host matchContents>
      <Button label="Sized to content" onPress={() => {}} />
    </Host>
  );
}
```

ContextMenu, SwiftUI:

```tsx
import { Host, ContextMenu, Button, Text } from '@expo/ui/swift-ui';

export default function ContextMenuWithImagesExample() {
  return (
    <Host style={{ flex: 1 }}>
      <ContextMenu>
        <ContextMenu.Items>
          <Button label="Share" systemImage="square.and.arrow.up" onPress={() => console.log('Share')} />
          <Button label="Favorite" systemImage="heart" onPress={() => console.log('Favorite')} />
          <Button label="Delete" systemImage="trash" role="destructive" onPress={() => console.log('Delete')} />
        </ContextMenu.Items>
        <ContextMenu.Trigger>
          <Text>Long press me</Text>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}
```

BottomSheet, universal (`isPresented` / `onDismiss` — not `isOpened` or
`onChange`; `snapPoints` takes `'half'`, `'full'`, `{ fraction }`, `{ height }`):

```tsx
import { useState } from 'react';
import { Host, Column, Button, BottomSheet, Text } from '@expo/ui';

export default function BottomSheetExample() {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <>
      <Host matchContents>
        <Button label="Open sheet" onPress={() => setIsPresented(true)} />
      </Host>
      <BottomSheet isPresented={isPresented} onDismiss={() => setIsPresented(false)}>
        <Column spacing={12}>
          <Text>Sheet contents</Text>
          <Button label="Close" onPress={() => setIsPresented(false)} />
        </Column>
      </BottomSheet>
    </>
  );
}
```

Form with sections, SwiftUI — note `flex: 1`, not `matchContents`:

```tsx
import { Host, Form, Section, TextField, Toggle, Button } from '@expo/ui/swift-ui';

<Host style={{ flex: 1 }}>
  <Form>
    <Section title="Profile">
      <TextField placeholder="Name" />
    </Section>
    <Section title="Preferences">
      <Toggle label="Enable notifications" isOn={notifications} onIsOnChange={setNotifications} />
    </Section>
    <Section>
      <Button label="Save changes" onPress={() => console.log('Saved!')} />
    </Section>
  </Form>
</Host>
```

DateTimePicker, cross-platform drop-in (no `DateTimePickerAndroid.open()`;
use `presentation="dialog"`):

```tsx
import DateTimePicker from '@expo/ui/community/datetime-picker';

<DateTimePicker
  value={date}
  onValueChange={(event, selectedDate) => setDate(selectedDate)}
  mode="date"
/>
```

---

## 7. Review checklist before calling a screen done

Run these against the diff. Most are a grep; the rest are one look at a
device.

1. `grep -rn "TouchableOpacity\|TouchableHighlight" src` → none.
2. `grep -rn "shadowColor\|shadowOffset\|shadowOpacity\|shadowRadius\|elevation:" src` → none outside `theme/tokens/elevation.ts`.
3. `grep -rn "\.value" src/components` → none on shared values (`.get()`/`.set()`).
4. `grep -rn "runOnJS" src` → none (`scheduleOnRN`).
5. `grep -rn "allowFontScaling={false}" src` → none.
6. `grep -rn "Keyboard.addListener" src` → none.
7. `grep -rn "overflow: 'hidden'" src/components/ui/media.tsx` → none on the glass view.
8. `grep -rn "from '@expo/ui/swift-ui'" src` → only in `.ios.tsx` files or files never run on Android.
9. `grep -rn "Ionicons\|FontAwesome" src` → only `icon.tsx` (the fallback) and the native-tab `ion` path. New screens pass `sf` and `md`.
10. Any `useSharedValue` in the diff: is the input continuous? If it is a press, toggle or colour, it is a CSS transition.
11. Any `entering=` on a list row: move it to the container.
12. A screen with `headerShown: false` and a `<Text variant="display">` title: that is a hand-rolled header. Configure the native one.
13. Every fetching screen renders loading, error, empty and content, and branches on `isPending`, never `!data`.
14. Every filled surface pairs its foreground (`fg.onBrand`, `status.*.onSolid`), never `fg.primary`.
15. On device: toggle Reduce Motion and Reduce Transparency in Settings once, dark mode once, and the largest Dynamic Type size once. Read the screen, do not trust the gates.

---

## 8. Sources

Expo (SDK-versioned where the page exists):

- https://docs.expo.dev/versions/v57.0.0/sdk/ui/ (index, universal, swift-ui, jetpack-compose, community)
- https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/host/ · `/modifiers/` · `/contextmenu/` · `/bottomsheet/` · `/form/` · `/datepicker/`
- https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/modifiers/
- https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/
- https://docs.expo.dev/versions/v57.0.0/sdk/symbols/
- https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/
- https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
- https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/ · `/stack/`
- https://docs.expo.dev/router/advanced/native-tabs/ · `/stack/` · `/stack-toolbar/` · `/modals/` · `/zoom-transition/`
- https://docs.expo.dev/router/reference/link-preview/
- https://docs.expo.dev/develop/user-interface/animation/ · `/safe-areas/` · `/system-bars/` · `/color-themes/`
- https://docs.expo.dev/guides/keyboard-handling/ · `/permissions/` · `/expo-ui-swift-ui/extending/`
- https://expo.dev/blog/the-real-cost-of-react-native-animations-benchmarking-every-approach
- https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui
- https://expo.dev/changelog/sdk-57
- https://reactnative.dev/blog/2026/06/11/react-native-0.86

Reanimated / Worklets:

- https://docs.swmansion.com/react-native-reanimated/docs/css-transitions/overview/
- https://docs.swmansion.com/react-native-reanimated/docs/css-animations/overview/
- https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/
- https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/ · `/list-layout-animations/`
- https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/ · `/migration-from-3.x/`
- https://docs.swmansion.com/react-native-worklets/docs/threading/runOnJS

Expo skills (vendored under `.claude/skills/`):

- `expo-animation/SKILL.md`, `expo-animation/RECIPES.md`
- `expo-ui/SKILL.md`, `expo-ui/references/{universal,swift-ui,jetpack-compose,drop-in-replacements}.md`
- `expo-native-ui/SKILL.md`, `expo-native-ui/references/{visual-effects,icons,controls}.md`
- `expo-design-system/SKILL.md`, `expo-design-system/references/{native-slop,audit}.md`
- `expo-router/references/{tabs,toolbar-and-headers,form-sheet,search,zoom-transitions}.md`
- `expo-data-fetching/SKILL.md` (four-state screens, saves)

The installed types confirm: `@expo/ui` `Host` props (no
`accentColor`); `NativeTabs.Trigger` accepts `testID` and `accessibilityLabel`
(`expo-router/build/native-tabs/types.d.ts`, forwarded by
`convertTabPropsToOptions`); `sheetCornerRadius` is `@platform ios`
(`react-native-screens/lib/typescript/types.d.ts`); `expo-symbols`
`SymbolViewProps.name` accepts `{ ios, android, web }`;
`CADisableMinimumFrameDurationOnPhone` is `true` in the SDK 57 prebuild
template.
