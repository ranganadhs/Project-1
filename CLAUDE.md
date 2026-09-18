# Working in this codebase

This is a React Native template on Expo SDK 57 / React Native 0.86 / React
19.2, TypeScript strict, pnpm. It ships a token-driven design system, a native
`@expo/ui` layer, file-based navigation with declarative auth guards, typed
infrastructure (storage, query, API client, auth adapter, env, permissions),
over-the-air updates, an EAS build and release pipeline, and agent tooling.
Everything is wired and inert: every app-specific value is a placeholder, and
nothing builds, submits or bills until it is filled in.

The job is to build a product on it without dismantling the parts that make it
work. Read this file before writing code. The **Traps** section lists failures
that pass typecheck, lint and the bundler and break on device.

---

## Setting up an app from this template

1. **Clone it.** Either with fresh history (`git clone`, delete `.git`,
   `git init`) or keeping history so template improvements merge later:
   ```bash
   git remote add upstream <template-repo-url>
   git remote set-url --push upstream DISABLED_the_template_is_fetch_only
   ```
   The push URL is nonsense on purpose: a push to the template must fail. It
   is local config; every clone re-adds it.
2. **`cp .env.example .env.local`** and set `EXPO_PUBLIC_API_URL`.
   `src/lib/env` throws at module load without it.
3. **`pnpm install`.** The `prepare` script installs the git hooks and
   `@swmansion/argent` arrives as a devDependency. Claude Code asks once to
   enable the `.mcp.json` server.
4. **`npx expo prebuild --clean && npx expo run:ios`** (or `run:android`).
   Expo Go cannot run this app; it is a dev-client build.
5. **Decide the identity** in `docs/app-plan.md` → *Release identifiers*,
   then set it in `app.config.ts`. `pnpm check:release` lists everything
   that is a placeholder; it is red until a release is wanted, and that is
   correct.
6. **Branches.** `feat/* → dev → preview → main`. PRs into any of the three
   run the gates; a merge to `preview` produces a TestFlight build and an
   Android install link; a merge to `main` uploads to the stores behind an
   approval. `docs/release-pipeline.md` is the mechanism.

| Read | When |
|---|---|
| `docs/app-plan.md` | Before creating a route or choosing an identifier |
| `docs/release-pipeline.md` | Before touching `eas.json`, `.eas/workflows/`, credentials or store accounts |
| `docs/ota-updates.md` | Before publishing an update or changing anything that moves the fingerprint |
| `docs/testing-with-argent.md` | Before verifying anything on a simulator, emulator or device |
| `docs/animation-and-native-ui.md` | Before animating, wrapping an `@expo/ui` view, or judging whether a screen feels native |
| `docs/software-mansion.md` | Before bumping Reanimated, Worklets, Gesture Handler, Screens or SVG |
| `docs/maintaining.md` | Before upgrading anything: `pnpm doctor`, `npx expo install --check`, SDK upgrades, skill and Argent updates |
| `.claude/rules/skills-precedence.md` | When a vendored skill and this file disagree |

---

## Hard rules

Each is enforced by a gate.

1. **Every style value resolves to a token.** No hex, `rgb()`, or bare numbers
   for spacing, radius, font size, z-index, or border width inside
   `StyleSheet.create`. If no token fits, **add one**. Enforced by
   `local/no-raw-style-values`.
2. **Never import from `@react-navigation/*`.** The same API is re-exported
   through `expo-router/react-navigation`. Enforced by ESLint.
3. **Native packages install with `npx expo install`**, never `pnpm add`. Only
   `expo install` resolves the version the SDK pins.
4. **Never add `node-linker=hoisted` to `.npmrc`.** Isolated `node_modules` is
   deliberate. A package that appears unresolvable is a missing peer; add it
   explicitly.
5. **Filenames are kebab-case; exports are PascalCase.** `button.tsx` exports
   `Button`. macOS is case-insensitive and CI is not.
6. **Route files stay thin.** A file in `src/app` imports a screen and returns
   it. Business logic belongs in `src/features` or `src/lib`.
7. **`StyleSheet.configure()` runs before any `StyleSheet.create()`.** That is
   why `src/app/_layout.tsx` imports `@/theme/unistyles` first. Do not reorder
   that import.

---

## Verification

Before claiming anything works:

```bash
pnpm typecheck          # strict, zero errors
pnpm lint               # includes the token rule
pnpm test               # deprecation guard + icon check + jest
pnpm theme:contrast     # WCAG AA on every semantic colour pair
pnpm check:deprecated   # Expo APIs that throw at runtime
pnpm verify:autolinking # native modules resolve under the isolated store
```

After committing — it inspects commits, which do not exist while the hook runs:

```bash
pnpm check:commits      # is each commit self-contained? trap 17
```

Before a release — red on the template by design:

```bash
pnpm check:release      # every identifier and credential id filled in
```

Before upgrading anything:

```bash
pnpm doctor             # expo-doctor + expo install --check; see docs/maintaining.md
```

Full module graph without a device:

```bash
npx expo export --platform ios --no-minify --output-dir /tmp/check
```

**Green gates prove compilation, not behaviour.** They cannot see a route that
resolves to nothing, a native view sized to zero, or a permission call that
throws. A change to navigation, native components or theming needs a device
check; say so rather than implying it is verified. A new native module needs
`npx expo run:ios` — a Metro reload does not pick it up. Say so explicitly.

---

## Testing on the simulator

This is a **dev-client** build. Expo Go cannot run it (Unistyles needs Nitro),
and that changes how automation behaves at every step.

### Argent is the instrument

`@swmansion/argent` is a devDependency and an MCP server (`.mcp.json`), with
its 18 skills under `.claude/skills/argent-*` and its rules in
`.claude/rules/argent.md`. It reads the running app as a **React component
tree** with testIDs and tap coordinates (`debugger-component-tree`), reads the
accessibility tree (`describe`), evaluates JS in Hermes, waits for the screen
to settle (`await-screen-idle`, `await-ui-element`), captures native network
logs, records replayable flows and profiles React and native. In a shell it
is `pnpm exec argent …`; the bare command is not on PATH.

**`docs/testing-with-argent.md` is the procedure.** The session shape:
availability check once → `list-devices` (prefer a booted one) → Metro on
8081 → `launch-app` by bundle id, never a home-screen tap → past the
dev-launcher → sign in once by hand (the session persists in MMKV) →
discover with the tree, tap the centre of an element's frame, never a
screenshot pixel → settle with an `await`, never a screenshot loop → deep
links through `open-url` for buried screens → `stop-all-simulator-servers`
scoped to the devices you used.

On iOS the app's own **rendered text is not in the accessibility tree**, so a
text assertion fails while the text is on screen. The component tree has no
such gap. Assert on `testID`s; ask for one when it is missing — a missing
testID usually marks a real accessibility gap.

### How an instrument lies

| Kind | The tell | The guard |
|---|---|---|
| Pointing — reading another device | The tree's header line names a different device | `debugger-*` tools take Metro's `logicalDeviceId`, not the UDID, once two devices share one Metro; check the header every time |
| Timing — stale coordinates | The control moved between capture and tap | Re-discover after any navigation |
| Mapping — a presented sheet | `debugger-component-tree` shows the screen *underneath* a `formSheet`/`modal`, unchanged | Confirm the presentation with `screenshot`, then read the tree |
| Precision — a real change reads `0.0%` | One glyph is under the summary's resolution | Print decimals and raw pixel counts |
| Never ran — the call was rejected | stderr or the exit code thrown away; `timeout` does not exist on macOS | `if ! pnpm exec argent run …; then`, never `>/dev/null 2>&1` |
| Occlusion — the gesture started on the keyboard | A swipe from the bottom with the keyboard up | Dismiss overlays; start inside the target's frame |

`gesture-tap` reports `"tapped": true` on a device it cannot drive. **Prove
the driver with a positive control** — one tap on a control known to respond —
before trusting any negative. Never `xcrun simctl clone` a booted simulator to
hand over a signed-in device: the session survives, XCUITest does not.

### Native modules and the file picker

- A new native dependency needs `npx expo run:ios`. The reinstall may clear the
  app container and the MMKV session with it; check the app's state afterward.
- `expo-document-picker` opens the iOS **Files** picker, and a fresh sim's
  Files is empty. Nothing scripts a file into it: `simctl addmedia` reaches
  only Photos, there is no `addfile`, and the app's Documents are hidden from
  Files unless it declares `LSSupportsOpeningDocumentsInPlace` — a production
  behaviour change, never a test convenience. A human drags a file onto the
  Simulator window; the automatable path is a Safari download (`openurl` to a
  small file URL). Label the pick a manual step.

### The test environment is not the device

**Anything asserted through a web polyfill of a native API asserts the
polyfill.** React Native's `FormData` file part is `{ uri, name, type }` and
reads the file off disk; jsdom's `FormData` coerces that object to
`"[object Object]"`, so a Jest test that reads `form.get('file')` back is green
and checks nothing. Assert the value you construct in a pure function; verify
the transport on a device.

### Maestro, where it fits

Maestro drives the simulator through XCUITest, runs on the EAS build workers
and installs to `~/.maestro/bin`. Use it for flows written in it. Its
constraints are the ones the component tree removes: assert on `testID`s, not
text; integer percentages only in `point:`; `launchApp` lands on the
dev-launcher (coordinate-tap the server row); `clearState` logs out;
`inputText` into a custom field can report done against an empty field, so
assert the value before submitting; a hierarchy dump can crash the app it is
inspecting.

### Housekeeping

Metro serves on 8081. Stay off ports 3000-3008, tear down anything you start,
and keep screenshots in a scratch directory, not the repo. When a result
depends on the device, say which findings were machine-checked and which were
read off a screenshot.

---

## Agent tooling

`.claude/skills/` carries three vendored skill sets, pinned by
`skills-lock.json`: Expo's official `expo-*` / `eas-*` skills (26), Software
Mansion's `react-native-best-practices`, and Argent's `argent-*` (18). They
are general advice; **this file wins when they disagree**, and
`.claude/rules/skills-precedence.md` lists every known disagreement. Update
with `npx skills update` and `pnpm exec argent update --local`. Read the docs
for **this** SDK: `https://docs.expo.dev/versions/v57.0.0/…`, never `latest`.

---

## Recommended build order

Advisory. Check in with the user whenever a decision is ambiguous.

1. **Brand the design system.** Edit tier 1 ramps in
   `src/theme/tokens/palette.ts`; map meaning in `src/theme/themes/color-light.ts`
   **and** `color-dark.ts`; run `pnpm theme:contrast` and fix by moving a ramp
   step, never by lowering the threshold; check the **Components** tab on
   device. Design-system-level components (a signature card, a branded header)
   belong here; screen-specific components wait for step 4.
2. **Map the routes before creating any.** Fill in `docs/app-plan.md`: every
   screen, its auth state, presentation and path. Do not create files under
   `src/app` yet. Auth gating is structural in Expo Router; moving screens
   between `(auth)` and `(app)` later means rewriting imports, guards and
   every `router.push` target. Present the map and get agreement.
3. **Scaffold routes and delete the demo.** Stub the route files, wire the
   guards, delete the demo (manifest below). Navigate the whole app with empty
   screens before building any of them.
4. **Build screens, one flow at a time.** Add a component only when a screen
   needs it; check `src/components/ui/index.ts` first. A value with no token
   gets a token before the component.
5. **Swap the data layer.** Implement `AuthAdapter`, point the API client at
   the real backend.

---

## Design system

Three tiers. **Components read tier 2 only.**

```
src/theme/tokens/    tier 1 — raw scales, no meaning
src/theme/themes/    tier 2 — semantic (color.bg.canvas, color.fg.primary)
                     tier 3 — component variant maps, colocated
```

### Pairing tokens

Light and dark flip text colour, so `fg.primary` is the reflex. **On a filled
surface that reflex is wrong.** A brand-blue button needs legible text in
*both* themes; the fill is blue either way, so the label must not follow the
theme.

```tsx
color: isDark ? '#FFF' : '#000'   // ✗ conditional — every button re-derives it
color: '#FFFFFF'                  // ✗ hardcoded — wrong when the brand changes
color: theme.color.fg.primary     // ✗ flips with theme, vanishes on the fill
color: theme.color.fg.onBrand     // ✓
```

`fg.onBrand` is a **pairing token**: a foreground bound to a background, not
to the theme. Its value per theme is whatever stays legible on that fill.

| Background | Foreground |
|---|---|
| `bg.brand`, `interactive.primary.*`, `interactive.danger.*` | `fg.onBrand` |
| `bg.accent` | `fg.onAccent` |
| `status.<tone>.solid` | `status.<tone>.onSolid` |
| `bg.inverse` | `fg.inverse` |
| `bg.canvas` / `surface` / `raised` / `sunken` | `fg.primary` / `secondary` / `tertiary` |

**A conditional or a literal for a colour means a pairing token is missing.**
Add it rather than branching.

### Colour tokens

#### `bg.*` — surfaces

An elevation ladder, not a colour list. Pick by where the surface sits.

| Token | Means | Use for |
|---|---|---|
| `canvas` | The page itself | Screen roots |
| `surface` | A grouped region on the canvas | Section backgrounds, grouped lists |
| `raised` | Sits **above** the surface | Cards, sheets, menus, rows in a group |
| `sunken` | Sits **below** the surface | Input wells, tracks, progress bars |
| `inverse` | Opposite-scheme block | Tooltips, snackbars |
| `brand` / `accent` | Solid identity fill | Hero areas, filled chips |
| `brandSubtle` / `accentSubtle` | Tinted wash | Highlighted rows, soft badges |
| `selected` | Current selection | Selected list row |
| `disabled` | Filled but inert | Disabled field backgrounds |
| `scrim` / `scrimHeavy` | **Alpha** backdrop | Behind modals, over imagery |
| `overlay` | Translucent chrome fill | Behind a blur |

Scrims are alpha on purpose: they darken a photo or a map, which a solid hex
cannot.

#### `fg.*` — content

| Token | Means | Use for |
|---|---|---|
| `primary` | Default reading colour | Body text, primary icons |
| `secondary` | Supporting, still comfortable | Subtitles, descriptions |
| `tertiary` | De-emphasised (AA large only) | Timestamps, counts |
| `disabled` | Inert control text | Disabled labels |
| `placeholder` | Empty-field hint | `placeholderTextColor` — **not** `disabled`; the field is editable |
| `link` / `linkPressed` | Navigational text | Inline links |
| `brand` / `accent` | Identity-tinted text | Emphasis on a plain surface |
| `onBrand` / `onAccent` / `onSolid` / `inverse` | **Pairing** | Text on a fill |

#### `border.*`

| Token | Means | Contrast-gated |
|---|---|---|
| `subtle` | Row dividers, decorative rules | No |
| `default` | Standard container edge | No |
| `strong` | Delineates a **control** | **Yes, 3:1** |
| `focus` | Focus ring | **Yes, 3:1** |
| `brand` / `selected` | Identity / selection edge | Yes |
| `inverse` / `disabled` | On inverse surfaces / inert | No |

#### `interactive.<role>.<state>`

Roles: `primary` · `secondary` · `ghost` · `danger`.
States: `rest` · `hover` · `pressed` · `disabled`.

Take the fill from a state; never lighten or darken by hand.

> **The ladders run in opposite directions.** Light presses **darker**
> (600→700→800). Dark presses **brighter** (400→300→200), because dark fills
> carry dark text and darkening would swallow the label. A new role follows the
> direction of the theme it is added to.

`hover` is a no-op on touch and real on web and with a pointer. Wire it.

#### `status.<tone>.*`

Tones: `success` · `warning` · `danger` · `info` · `neutral`. Each carries
`fg` · `bg` · `border` · `solid` · `onSolid`: a banner, a badge and a filled
button without a component mixing its own tint.

- Tinted treatment → `fg` on `bg` with `border`
- Filled treatment → `onSolid` on `solid`

**Status colours are reserved.** Never decorative, never a chart series.

#### `chart.*`, `avatar`, `gradient`

`chart.categorical` is a **validated, fixed order**. Assign by index and never
cycle; a ninth series folds into "Other". Reordering or substituting requires
re-running the validator (see `tokens/palette.ts`). `chart.grid` /
`chart.axis` are deliberately low-contrast so they recede behind the data.
`avatar` is hash-indexed by a stable id.

### Scale tokens

| Family | Means | Reach for it when |
|---|---|---|
| `space` | Distance **between two things** | Gaps, padding, margins |
| `layout` | How a **page** is built | Screen gutters, section rhythm, measure, max-widths |
| `radius` | Corner rounding, as a number | Tier 1. Components read `shape` instead. `nestedRadius(outer, inset)` for concentric corners |
| `size` | Control geometry | `touchTarget` is a floor, never go under |
| `typography` | Type ramp + `fontVariant`, `textTransform` | `fontVariant.tabular` for any changing number |
| `elevation` | Depth | Per-scheme `boxShadow` strings |
| `motion` | Timing | `duration`, `spring`, `springRatio`, `cssEasing`, `easeTransition`, `delay.stagger` |
| `opacity` | Named states | `disabled`, `muted`, `scrim` — never a bare number |
| `zIndex` | Stacking | Native modals ignore it; use a route presentation |
| `border` / `stroke` | Rule weight / icon weight | `hairline` is the default rule |
| `blur` / `focus` / `gradient` / `aspectRatio` | Effects | Named by job, not by number |

`space` is local; `layout` is page-level. `layout.gutter` is what keeps one
screen's side padding from being `space[5]` and the next screen's `space[4]`.

### Overriding vs adding

**Changing a token changes it everywhere. That is the point, and the risk.**

- Rebranding → edit the **tier 1 ramp**. It is meant to cascade.
- One component needs a different value → that is **not** an override. Either
  an existing semantic token means what you want, or you are describing a new
  meaning: add a token.
- A raw value passed as a style prop "just this once" is the same thing the
  lint rule blocks inside `StyleSheet.create`, and equally wrong outside it.

The test: can you name what the value *means*, independent of where it is
used? Then it is a token. If the only answer is "the colour this button
needs", the meaning is missing — find it and name it.

### Adding a colour

1. Add or adjust the ramp in `tokens/palette.ts`
2. Map it in **both** `themes/color-light.ts` and `color-dark.ts`
3. If it is a fill, add its **pairing** foreground at the same time
4. `pnpm theme:contrast` — fix by moving a ramp step, never by lowering a threshold

`color-light.ts` / `color-dark.ts` import **only** `tokens/palette`, never the
tokens barrel. That keeps colour free of any react-native import so the
contrast script loads real values in plain Node. Do not add other imports to
those two files.

### Tokens that differ per theme

Most scales are shared. **Elevation is not** (`tokens/elevation.ts`): a shadow
darkens what is behind it, so the light scale is invisible on a dark canvas. A
token whose correct value depends on the scheme follows that pattern; never
average the two.

### Corner shape

**Components read `shape`, never `radius`.** `radius` is the tier 1 numeric
scale; `shape` is the tier 2 role layer, and its values are **styles**, not
numbers:

```ts
card: { ...theme.shape.card, padding: theme.space[4] }
```

A corner has a radius and a curve. React Native defaults the curve to
`circular`, so a plain `borderRadius` never gets the continuous corner.
Carrying both on one token means using the role always gets the curve.

Asymmetric corners spread the role and override the odd one:

```ts
bubble: { ...theme.shape.card, borderBottomLeftRadius: theme.radius.xs }
sheet:  { ...theme.shape.card, borderBottomLeftRadius: theme.radius.none,
                               borderBottomRightRadius: theme.radius.none }
```

> **Not on a `Gradient`.** Asymmetric radii flatten a gradient fill to
> `stops[0]` with no error (trap 16). Clip with a parent `View` that carries
> the radii and `overflow: 'hidden'`, and leave the `Gradient` square.

**`shape.smooth` is for the corners a role cannot name** — a radius arriving
as a prop (`Skeleton`, `Image`), or one computed by `nestedRadius()`:

```ts
{ ...theme.shape.smooth, borderRadius: theme.radius[size] }
```

Three caveats, all deliberate:

- **iOS only.** Android ignores `borderCurve`.
- **Invisible below ~12pt.** It changes `button`, `card`, `overlay` and
  `notice`; smaller radii do not show it.
- **A true circle keeps a bare `radius.full`.** Equal width and height leaves
  no corner to smooth.

### Fonts

Default is the system font (no bundled assets), which is why `Text` selects
weight with numeric `fontWeight`.

**A custom family changes that.** Register **one family per weight**, and
switch `Text`'s `variant` and `weight` variants to set `fontFamily` rather than
`fontWeight`: Android renders a custom family at regular when asked for a
numeric weight, and nothing in typecheck, lint or the bundler catches it. A
`TextInput` needs the family set explicitly too; it is a raw RN node, so the
typed value otherwise renders in the system font beside a label that does not.

Use `<Text numeric>` for any number that changes in place — a timer, a
counter, a column of prices; proportional digits jitter as values update. Its
variant is declared **last** in `text.tsx`: Unistyles merges variants in
declaration order, and above `weight` a bold numeric would fall back to
proportional figures.

### Motion

`snappy` is the default and is critically damped (ζ = 1.0, no overshoot).
`bouncy` is for when a bounce is the point. Do not tune these by eye; the
damping ratio is asserted by tests. `theme.motion` carries durations, CSS
easing curves (`cssEasing`, the `cubicBezier` form for Reanimated CSS and the
`Easing.bezier` form for `withTiming`) and springs in both the physics form
(`spring`) and the `dampingRatio` form (`springRatio`).

Walk down; stop at the first row that fits. `docs/animation-and-native-ui.md`
is the full reference.

| Need | Engine |
|---|---|
| State-driven change, no gesture — press, toggle, colour | **Reanimated CSS transition** (`transitionProperty`) *or* `react-native-ease`. Either; never both in one component. A press is never a shared value |
| Loop, or motion that plays on mount | **Reanimated CSS animation** (`animationName`) |
| Mount / unmount / list reflow | **Layout animations** (`entering`, `exiting`, `itemLayoutAnimation`) — never `entering` on a virtualized row |
| Anything a finger or scroll drives | **Shared values** + `Gesture` + `useAnimatedStyle`; `.get()`/`.set()`, `scheduleOnRN` in `onEnd` |
| Screen to screen, sheets, tabs | **Native**: stack options, `formSheet` routes, `NativeTabs`. Never hand-rolled |

`react-native-ease` (an AppAndFlow package, not Software Mansion's) drives
`UpdateBanner`. Reduced motion is fewer and gentler, not zero:
`(app)/_layout.tsx` switches the stack to `fade`, every Reanimated animation
defaults to `ReduceMotion.System`, and anything that samples what is behind it
renders solid under Reduce Transparency.

---

## Components

`src/components/ui` — React Native, token-driven, fully themeable.
`src/components/native` — `@expo/ui`, real SwiftUI / Jetpack Compose.

### Which layer

| Go native | Stay React Native |
|---|---|
| The OS does something JS cannot reproduce (menu blur-and-lift, submenu chrome) | The component carries the brand |
| Feel belongs to the platform (touch slop, drag momentum, a11y increments) | Every value must come from a token |
| Correctness is locale/OS dependent (dates, calendars, 12/24h) | The design must be identical across platforms |

Native: `Menu` / `ContextMenu`, `NativePicker`, `NativeSlider`,
`NativeDatePicker`, `NativeForm`, `AppTabs`, and every sheet/modal
presentation.

**`@expo/ui` views are drawn by the OS and ignore tokens.** `NativeHost`
bridges the two things `Host` exposes: `colorScheme` and `seedColor` (the
SwiftUI tint; a full Material You palette on Android). `Host` has no
`accentColor`; that prop belongs to the community `DateTimePicker` that
`NativeDatePicker` wraps. Per component, `modifiers` (`tint`, `background`,
`font`, `presentationBackground`) and the universal `style` pick carry a
token in; geometry, materials, chrome and detent physics cannot be touched.
That is correct for a menu and wrong for a branded button, which is why
`Button` is React Native.

**`Host` sizing is a contract.** `matchContents` (`NativeHost sizing="hug"` /
`"inline"`) only works for content with an intrinsic size, and **never on the
axis of a scroll container**: a `Form`, `List` or `ScrollView` under a
vertical match stops scrolling with no error, which is why `NativeForm` uses
`sizing="viewport"` (`useViewportSizeMeasurement`; the host proposes the
viewport size). Flexible-width controls (`Slider`, `DatePicker`) collapse to
nothing under a horizontal match. Trap 2.

---

## Navigation

### Auth gating

Declarative guards, never imperative redirects:

```tsx
<Stack.Protected guard={!isAuthenticated}>
  <Stack.Screen name="(auth)/sign-in" />
</Stack.Protected>
<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(app)" />
</Stack.Protected>
```

Flipping a guard navigates **and** wipes protected history. There is no
`router.replace` in this codebase and there must not be. Signing out clears
the session, which flips the guard; that is the whole mechanism.

Guards are **reactive store subscriptions**. A plain variable does not
re-render the layout, and navigation does not happen.

### Presentations

Set on `Stack.Screen` in `src/app/(app)/_layout.tsx`.

| Presentation | iOS | Android |
|---|---|---|
| `push` (default) | Interactive edge-swipe back | Hardware back |
| `formSheet` | Any number of detents, grabber, corner radius, undimmed peek | **Max 3 detents**; grabber and `sheetCornerRadius` are iOS-only; no native header or nested stack inside a sheet |
| `modal` | Card revealing the parent | **No card modal** — full screen, no drag-dismiss |
| `fullScreenModal` | Covers all, supply your own close | Same, but hardware back exits |
| `transparentModal` | Draw your own scrim | Back button dismisses free |

Bottom sheets need **no library**; `formSheet` is the OS control.

Dialogs are **routes**, not `visible` state. They get a URL, back-button
dismissal and deep-link survival for free.

#### Safe areas: what `Screen` does

`Screen` applies the **bottom** inset, plus the tab-bar clearance inside the
tabs. Nothing else applies either.

It does **not** apply the top inset by default: native stack headers and
native tab bars inset their own content, and adding it there doubles the gap.
Pass **`topInset`** for a `headerShown: false` route that fills the display —
a `fullScreenModal` draws from the very top, so without it the first row lands
under the clock. A `formSheet` does not need it; the sheet is presented below
the status bar.

#### Status-bar ink per screen

There is exactly **one `<SystemBars>` in the app**, in the root layout. System
chrome is global state; a screen-level instance mounts and unmounts with
navigation, so two of them race and the screen you navigate BACK to keeps the
wrong ink. Screens **declare** instead, and the root resolves
`override ?? theme`:

```tsx
useSystemBarsOverride('light');   // a dark full-bleed hero behind the status bar
useSystemBarsOverride(null);      // no opinion — the theme decides
```

`null` is not `'dark'`: hardcoding dark is right on a light canvas and wrong
the moment the user switches themes. It uses `useFocusEffect`, not
`useEffect`, because a stack keeps screens mounted underneath and an
unmount-based clear leaves the override in place. See
`src/theme/system-bars.ts`.

### Native tabs, and their icons

`AppTabs` (`src/components/native/app-tabs`) wraps
`expo-router/unstable-native-tabs`: a real `UITabBarController` on iOS, which
is where the iOS 26 Liquid Glass bar comes from, and Material tabs on Android.
`TabConfig` carries `badge`, `role` (`'search'`) and the layout takes
`minimizeBehavior`.

**`NativeTabs.Trigger` never renders its children.** It reads them as data and
keeps only elements whose type is exactly `Icon`, `Label` or `Badge`:

```js
Children.toArray(children).filter(c => isValidElement(c) && allowed.includes(c.type))
```

Everything else is discarded with no warning:

```tsx
<NativeTabs.Trigger name="index">
  <TabGlyph tab={tab} />                  {/* ✗ type is TabGlyph — icon vanishes  */}
  <>{someIcon}</>                         {/* ✗ toArray does not flatten fragments */}
  {cond && <NativeTabs.Trigger.Icon …/>}  {/* ✓ falsy is filtered, element survives */}
  {tabGlyph(tab)}                         {/* ✓ a CALL returns the Icon itself      */}
  <NativeTabs.Trigger.Icon sf="house" />  {/* ✓ direct child                        */}
</NativeTabs.Trigger>
```

Factor icon logic into a plain function you **call**, never a component you
render. The failure is a tab bar of labels with no icons, and only a device or
a test that applies the same filter catches it.

#### OS symbols — the default

`sf` + `md` costs no bundled asset and gives each platform its idiomatic glyph.
Pass `{ default, selected }` to change shape on selection; colour alone cannot
convey it.

```tsx
<NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
```

#### A custom icon set

For glyphs that carry the product's identity and must look identical on both
platforms. `src` feeds the same `UITabBarItem` that `sf` would, so Liquid Glass
is unaffected.

```tsx
import Ionicons from '@react-native-vector-icons/ionicons';

const vectorIcon = (name: IconName) => (
  <NativeTabs.Trigger.VectorIcon family={Ionicons} name={name} />
);

<NativeTabs.Trigger.Icon
  src={{ default: vectorIcon('home-outline'), selected: vectorIcon('home') }}
  renderingMode="template"
/>
```

`TabIcon` in `types.ts` carries these through `TabConfig` as `{ ion }`.

**Always set `renderingMode="template"`.** `VectorIcon` rasterises the glyph as
a **white** bitmap (expo-router calls `getImageSource(name, 24, 'white')`), so
it is visible only because iOS re-tints it as a template image. expo-router
infers `template` when `iconColor` is set on `<NativeTabs>`, which `AppTabs`
does; say it outright anyway. Template tinting flattens colour, so these must
be single-path glyphs.

#### Two things Android does differently

Both are Material 3 behaving correctly.

**The active-indicator pill and the selected icon colour.** Android fills a
pill behind the selected glyph with `indicatorColor`; iOS draws no indicator,
so its selected glyph must BE the accent. Set both to the accent and Android
renders a solid lozenge with nothing visible in it. `AppTabs` takes the paired
ink on Android — the pairing-token rule, where the fill is an indicator:

```tsx
selected: Platform.OS === 'android' ? theme.color.fg.onBrand
                                    : theme.color.interactive.primary.rest
```

**Only the selected tab is labelled.** `labelVisibilityMode` defaults to
`auto`, which labels the selected destination only. Pass
`labelVisibilityMode="labeled"` on `<NativeTabs>` when the glyphs are custom
enough that a user cannot recognise a standard symbol; Material recommends
labels for three to five destinations.

#### Clearance underneath

The iOS 26 bar is a floating pill and content passes BENEATH it, while
`useSafeAreaInsets().bottom` describes only the home indicator. `AppTabs`
publishes the bar's height through `TabBarClearanceContext` and `Screen` adds
it to the bottom padding: a screen inside the tabs scrolls clear of the bar and
a screen outside them pays nothing.

That context lives in its own file that imports **only `react`**. It is
reached from a route module, so anything else it imported would run before
`StyleSheet.configure()`. Trap 18.

#### A multi-colour or pre-tinted icon

A tab that is never selected (a centre "+") cannot use the selected tint, so
bake the colour into the image and opt out of re-tinting:

```tsx
const [plus, setPlus] = useState<ImageSourcePropType>();
useEffect(() => {
  let active = true;
  Ionicons.getImageSource('add-circle', 34, theme.color.bg.brand).then(
    (src) => active && src && setPlus(src),
  );
  return () => { active = false; };
}, [theme.color.bg.brand]);

<NativeTabs.Trigger.Icon src={plus} renderingMode="original" />
```

Re-resolve it when the token changes; a raster does not follow the theme. Pair
it with `disabled` on the trigger, which suppresses navigation but still emits
`tabPress`.

---

## Data layer

**Server state → TanStack Query. Client/UI state → Zustand. Never both.**

| Module | Swap point |
|---|---|
| `src/lib/auth` | Implement `AuthAdapter`, call `configureAuth(yours)`. Do not edit `mock-adapter.ts`. |
| `src/lib/api` | `createApiClient({ baseUrl, getAuthToken, getHeaders, onUnauthorized })`, bound to the session. `getHeaders` is for backends whose auth is not a bearer token (cookies, tenant ids); it is called per request because those derive from the live session. |
| `src/lib/storage` | Encrypted MMKV. **Web is unencrypted** — see `storage.web.ts`. |
| `src/lib/permissions` | `usePermission(key)` / `useRequestOrSettings(key)`. Add a permission = add an adapter. |
| `src/lib/env` | Zod-validated `EXPO_PUBLIC_*`. Public — never a secret. |

Persist deliberately. The permission store persists **only** the ask-history,
never live status: a cached "granted" survives a revocation in Settings and
becomes a lie. Apply the same reasoning to anything you persist.

### Biometric login

`src/lib/auth/biometric.ts` — opt-in, off until a screen offers the toggle.

**It is not a lock screen.** A lock screen drawn in React leaves the token in
storage for anything that can read it. This moves the session into the OS
keychain behind `requireAuthentication`, so the OS enforces the gate. **The
token lives in exactly one place:** with biometric on it is in the keychain
and `persistedSlice` omits it from MMKV; with it off, the reverse. Persisting
it in both makes the feature decorative, which is why `persistedSlice` is
exported and tested directly.

With it on, a cold start finds no session, `Stack.Protected` shows sign-in,
and sign-in offers "Unlock with Face ID". There is no lock route: the session
flipping IS the navigation.

- **Check hardware and enrolment separately.** A sensor with no enrolled face
  needs a *disabled* toggle, not a failing one; `authenticateAsync` returns an
  error rather than prompting.
- **Enrolling or removing a face or fingerprint invalidates the entry**, by
  design, on both platforms. `unlock()` reports `expired`; the user signs in
  normally.
- **`biometric.ts` must not be imported by anything that mounts at startup.**
  It pulls in a native module that crashes a binary built without it.
  `session-store` imports `biometric-vault` instead, which uses only
  `expo-secure-store`, and the auth barrel does not re-export it.

---

## Package guide

Every dependency, what it is for, and the thing to get right. The Software
Mansion packages and the version policy that keeps them together are in
`docs/software-mansion.md`.

This is a **wide baseline on purpose**: deleting a package you do not ship is
easier than retrofitting one after twenty screens exist. Do not prune during
development; prune once, before release. See *Removing what you do not ship*.

### UI and rendering

| Package | Use it for | Get it right |
|---|---|---|
| `react-native-unistyles` | **All** styling | `StyleSheet.create((theme) => …)`. Variants over conditionals. Never `StyleSheet` from react-native |
| `@expo/ui` | Menus, pickers, sliders, date/time, native forms | Wrap in `NativeHost`. OS-drawn: ignores tokens |
| `expo-image` | **Every** image | Not RN's `Image`. Set `recyclingKey` inside lists or rows flash the previous picture. `placeholder` takes a blurhash |
| `@shopify/flash-list` | **Every** list over ~20 rows | Rows must be cheap — recycling re-runs their render. `getItemType` for mixed rows |
| `expo-linear-gradient` | Gradients | Use the `Gradient` primitive; stops come from `theme.color.gradient` |
| `victory-native` + `@shopify/react-native-skia` | Charts — lines, areas, bars, scatter | Compositional: it resolves the points and you draw, so marks read `theme.color.chart.*`. Skia is a native module (rebuild, not reload) and raises the binary-size floor. Never fade a gradient to `transparent` (trap 15); end on the surface colour |
| `lottie-react-native` | Vector animations | Use the `Lottie` primitive. Colours are baked into the JSON and do not follow the theme. Its published web entry imports an uninstalled peer; `lottie.web.tsx` keeps the web bundle building |
| `expo-blur` / `expo-glass-effect` | Translucent chrome | Use `Glass`. Check `isLiquidGlassAvailable()` at RUNTIME, not `Platform.OS` |
| `expo-symbols` | SF Symbols on iOS, Material Symbols on Android | Via `Icon`'s `sf` and `md` props; Material Symbols ship inside `expo-symbols`. One icon family per platform |
| `@react-native-vector-icons/ionicons` | The `Icon` fallback when no platform glyph is given, and native-tab icons | Native tabs need this, **not** `@expo/vector-icons`. New screens pass `sf` + `md` |
| `react-native-svg` | Vector art, wordmarks, illustration | The SDK pin. Reanimated can animate its props. Not for icons |
| `react-native-safe-area-context` | Insets | `Screen` applies the bottom inset. Do not double-apply the top; native headers inset themselves |
| `react-native-edge-to-edge` | Status + Android nav bar | Drive `style` from the theme, never `"auto"` (trap 11) |

### Motion and interaction

| Package | Use it for | Get it right |
|---|---|---|
| `react-native-reanimated` | CSS transitions and animations for state and loops; layout animations; shared values for gestures and scroll | 4.5 with worklets 0.10, the SDK pin. `.get()`/`.set()` not `.value`; `scheduleOnRN` not `runOnJS`; `cubicBezier()` for CSS, `Easing.bezier()` for `withTiming`. Worklets plugin stays **last** in babel config |
| `react-native-ease` | Declarative state transitions — opacity, scale, translate, colour | Core Animation / ObjectAnimator, no JS loop. No gestures, no layout animation, no loops. Either this or a Reanimated CSS transition per component |
| `react-native-gesture-handler` | Swipe, pan, pinch, long-press | `~2.32` is the SDK pin; the `Gesture.*` builders are the API here. `GestureHandlerRootView` is at the root |
| `expo-haptics` | Tactile confirmation | `haptics.*` from `@/lib/haptics`. Fire on **results**, never every tap. Never load-bearing |
| `react-native-keyboard-controller` | Keyboard-aware forms | `<Screen keyboardAware>` on **any** screen with an input. `KeyboardToolbar` for prev/next/done |

### Navigation

| Package | Use it for | Get it right |
|---|---|---|
| `expo-router` | All routing | File-based. `Stack.Protected` guards. Import react-navigation APIs from `expo-router/react-navigation` |
| `react-native-screens` | Native presentations | Not imported directly; configured through `Stack.Screen` options |
| `expo-linking` | Deep links | The router handles URL → route. Use this only for `openURL`, `createURL`, and parsing incoming links |

### Data and state

| Package | Use it for | Get it right |
|---|---|---|
| `@tanstack/react-query` | **Server** state | Never mirror server data into Zustand. Focus/online managers are wired in `QueryProvider` |
| `zustand` | **Client/UI** state only | Persist deliberately; see the permission store on what NOT to cache |
| `react-native-mmkv` | Key-value storage | Synchronous. Encrypted on native, **not** on web |
| `expo-secure-store` | Secrets — tokens, keys | Values are small; use MMKV for bulk data keyed by a secret stored here |
| `expo-local-authentication` | Face ID / Touch ID / device credential | Only for the PROMPT. The protection comes from writing the secret with `requireAuthentication` (`biometric-vault.ts`). Never import `biometric.ts` from startup code |
| `zod` | Runtime validation | Env schema, API responses, form schemas. Types flow from the schema; never declare both |
| `react-hook-form` + `@hookform/resolvers` | Forms | Uncontrolled by default, so typing does not re-render the form. Pair with `zodResolver` |

### Device and platform

| Package | Use it for | Get it right |
|---|---|---|
| `expo-notifications` | Push + local notifications | Permission via `usePermission('notifications')`. Ask in context, never at launch. Plugin `mode` follows the build profile (trap 21) |
| `expo-location` | Location | Foreground and background are **separate** permissions and prompts |
| `expo-camera` · `expo-media-library` · `expo-contacts` · `expo-calendar` · `expo-audio` | Device data | All behind `usePermission`. Calendar uses the object-oriented API; the `*Async` calls throw |
| `expo-tracking-transparency` | iOS ATT | iOS-only; the layer reports `unavailable` on Android |
| `expo-localization` | Locale, timezone, RTL | Read `getLocales()` for the user's real preferences. Never infer locale from country |
| `expo-constants` | Build metadata | `expoConfig.version`, not a hardcoded string |
| `expo-crypto` | Random bytes, hashing | Used for the MMKV key. Not a general crypto library |
| `@react-native-community/netinfo` | Connectivity | Drives Query's online manager. `isInternetReachable` can be `null`; treat as online |

### App lifecycle

| Package | Use it for | Get it right |
|---|---|---|
| `expo-splash-screen` | Launch experience | Held until the session resolves. Add conditions to that gate; do not hide it earlier |
| `expo-updates` | OTA updates | `useOTAUpdates()`. Inert until EAS Update is configured. **Never** auto-reload mid-task; it restarts the runtime |
| `expo-system-ui` | Native root background | Prevents the white frame behind translucent chrome (trap 5) |
| `expo-font` | Custom fonts | Only with a custom family. One family **per weight** |
| `expo-status-bar` | Per-screen bar overrides | The root uses `SystemBars` instead, which also covers the Android nav bar |
| `expo-dev-client` | Development builds | Build-time only. Expo Go cannot run this app |

### Infrastructure — never imported directly

`react-native-nitro-modules` (Unistyles' C++ core) · `react-native-worklets`
(Reanimated's runtime, driven by the babel plugin) · `react-dom` /
`react-native-web` (web bundle peers) · `babel-preset-expo` ·
`@expo/metro-runtime` (expo-router's peer) · `expo-asset` (expo-audio's peer).
Removing any of these breaks something that does not import it; `pnpm doctor`
reports a missing one.

---

## Traps

Every one passes typecheck, lint and the bundler.

1. **A route group contributes no path segment.** `(app)/(tabs)/home.tsx` is
   `/home`, not `/`. Without a file named `index`, nothing resolves the launch
   URL and the app opens on "Unmatched Route". Check the generated
   `.expo/types/router.d.ts` after restructuring routes.

2. **`@expo/ui` `Host` sizing fails silently in both directions.** With no
   intrinsic size it collapses to zero (`NativeHost sizing="hug"`). With
   `matchContents` on the axis of a scroll container (`Form`, `List`,
   `ScrollView`) scrolling stops with no error (`sizing="viewport"`).
   Flexible-width controls (`Slider`, `DatePicker`) collapse under a horizontal
   match. `matchContents` can only be set once on mount; never derive it from
   a prop.

3. **`adaptiveThemes` must be disabled *before* `setTheme`.** In the other
   order the manual theme choice does nothing. See `theme/theme-mode.ts`.

4. **Some Expo APIs are deprecated at runtime, not in types.** They export
   valid signatures, tsc passes, and the call throws on device.
   `pnpm check:deprecated` catches it; run it after touching any Expo module.

5. **Translucent chrome samples what is behind it.** The iOS 26 glass tab bar
   samples react-native-screens' default white container for a frame and reads
   as light mode. `expo-system-ui` paints the native root. Flickering chrome
   means the layer behind it is wrong.

6. **React Query's focus/online managers are inert in React Native.**
   `refetchOnWindowFocus` and `refetchOnReconnect` do nothing until wired to
   AppState and NetInfo, which `QueryProvider` does. Wire such listeners in an
   effect, never at module scope; eager subscriptions break under Jest.

7. **MMKV rehydrates synchronously**, inside the `create()` call. An
   `onFinishHydration` listener attached afterwards never fires. Check
   `hasHydrated()` first.

8. **Metro inlines `EXPO_PUBLIC_*` only for static member expressions.**
   `process.env[name]` is `undefined` in a release bundle.

9. **pnpm's isolated store breaks tooling that assumes flat `node_modules`.**
   Packages live at `node_modules/.pnpm/<pkg>/node_modules/<pkg>`.
   `jest.config.js` and `tsconfig.json` handle it; expect it in anything new.

10. **iOS rejects a permission request with no usage string,** and review
    rejects generic ones. Config plugins inject generic defaults;
    `app.config.ts` overrides three. Rewrite all of them per product.

11. **`SystemBars style="auto"` follows the OS, not the theme.** It resolves
    from `Appearance.getColorScheme()`, so forcing Light or Dark in-app while
    the phone is on the opposite scheme gives dark icons on a dark background.
    Drive it from the resolved theme: `<SystemBars style={isDark ? 'light' :
    'dark'} />`. The names are the **content** colour; a dark canvas needs
    `'light'`. Same for any `auto` / `inverted` system-chrome prop.

12. **A theme value read through `useUnistyles()` changes a render LATE.**
    Unistyles rewrites `StyleSheet.create` values on the native shadow tree in
    the commit that flips the theme. A value pulled off `useUnistyles()` and
    passed as a **prop** waits for a React render, so styled surfaces flip on
    time while the prop-driven one trails. `Screen` paints `bg.canvas` from
    `StyleSheet.create` for this reason. A background the style layer cannot
    express (an SVG gradient, a native tint) goes inside a Unistyles-styled
    layer that hides the stale value natively.

13. **Returning a different element TREE per theme remounts everything under
    it.** React reconciles by position; swapping a gradient for a `<View>`
    when the stops match changes the children's positions, and a theme toggle
    tears down the screen, losing scroll position and local state. Branch on
    what a component **draws**, never on which elements exist; keep every
    slot, `null` for the empty one.

14. **`NativeTabs.Trigger` reads its children as data and drops what it does
    not recognise.** Only elements whose type is literally `Icon`, `Label` or
    `Badge` survive; a wrapper component or a Fragment is discarded silently,
    giving a tab bar of labels with no icons. A `VectorIcon` glyph is
    rasterised WHITE and visible only as a template image. See *Native tabs*.

15. **`transparent` is transparent BLACK, and Skia interpolates premultiplied.**
    A gradient fading to `transparent` fades through GREY. Both stops are
    legitimate tokens, so every gate is green and the wash renders dirty. Fade
    to the colour you sit on (`bg.raised`), never to `transparent`. Hardest in
    `victory-native` area fills.

16. **Asymmetric corner radii flatten a `Gradient`.** iOS masks the view and
    the gradient layer with it, leaving the opaque floor: `stops[0]` as a flat
    fill, no error. Clip with a parent `View` carrying the radii and
    `overflow: 'hidden'`; leave the `Gradient` square. `Gradient` warns in
    development.

17. **A commit is not what the pre-commit hook checked.** `lefthook.yml` runs
    typecheck against the WORKING TREE and lints the staged file *list* read
    from that tree, so a green hook says nothing about whether the commit
    builds standalone. A file imported but never staged, or commits landed out
    of dependency order, break HEAD for a fresh clone, a bisect, a reviewer.
    `pnpm check:commits` catches it and can only run AFTER the commit.
    `git commit` with no paths takes everything *staged*; on a shared branch
    use `git commit -- <paths>`, and `git add` new files first.

18. **A value import from `@/components/ui` inside a ROUTE module white-screens
    the app.** Route modules evaluate before the root layout, and every styled
    component calls `StyleSheet.create((theme) => …)` at module scope;
    reaching one before `StyleSheet.configure()` throws "no theme has been
    selected yet". A **type-only** import is erased and free, and adding one
    value to that import statement drags the whole barrel in. Import the leaf
    module directly, as `app-tabs.tsx` does for `tab-bar-clearance.ts`.

19. **An OTA update published to the wrong runtime version reaches NOBODY and
    reports success.** With `runtimeVersion: { policy: 'fingerprint' }`, a
    publish whose fingerprint matches no build succeeds and is billed; it is an
    update for a different app than the one installed. Nothing under `src/` is
    a fingerprint input; **`eas.json`, `package.json` scripts, `.gitignore`,
    the app icons and all of `app.config.ts` including `extra` are.** See
    *OTA updates*.

20. **`render` from @testing-library/react-native returns a PROMISE under
    React 19.** Calling `render(...)` without awaiting and then touching the
    `screen` API fails with "`render` function has not been called"; the
    render occurred, `screen` is not populated yet. Use `await render(<X />)`
    in an `async` test. Tests that read the returned result are unaffected.

21. **A bare `'expo-notifications'` plugin entitles every build for the APNs
    SANDBOX.** Its `mode` option defaults to `development` and writes
    `aps-environment` from it, store builds included. A production push to
    that binary reaches nobody, with no error: a push for a different
    environment than the one installed, the same shape as trap 19.
    `app.config.ts` derives `mode` from `EAS_BUILD_PROFILE`; keep
    `enableBackgroundRemoteNotifications` off until code handles a silent push.

---

## Deleting the demo

Phase 3, once real routes exist.

**Delete:**

```
src/app/(app)/(tabs)/index.tsx        showcase
src/app/(app)/(tabs)/native.tsx       @expo/ui demos
src/app/(app)/(tabs)/patterns.tsx     navigation demos
src/app/(app)/detail.tsx
src/app/(app)/dialog.tsx
src/app/(app)/fullscreen.tsx
src/app/(app)/modal.tsx
src/app/(app)/sheet.tsx
assets/animations/sample.json         the Lottie primitive's demo asset
```

Deleting `sample.json` means deleting its entry in `src/lib/assets.ts`. Keep
that file: Metro resolves `require` only from a literal path, which is why a
keyed asset registry exists.

Then rewrite `src/app/(app)/(tabs)/_layout.tsx` with the real tabs and prune
the demo `Stack.Screen` entries from `src/app/(app)/_layout.tsx`.

**Keep and adapt:** `src/app/(app)/permissions.tsx`,
`src/app/(app)/(tabs)/settings.tsx` (including the theme switcher),
`src/app/(auth)/sign-in.tsx` (wire it to your adapter).

**Never delete:** anything in `src/components`, `src/theme`, `src/lib`,
`eslint-rules`, or `scripts`.

One tab must be named `index` (trap 1).

---

## App icons

Five assets, wired in `app.config.ts`. `pnpm icons` derives
`ios-icon-dark.png` and `ios-icon-tinted.png` from `assets/icon.png`.
`pnpm test` fails if any is the wrong size or carries the wrong alpha.

**Never pre-round an app icon.** Both platforms apply their own corner mask;
rounding the artwork nests corners inside corners. `icon.png` is a full-bleed
1024x1024 square.

### The three iOS variants

iOS 18+ shows a light, a dark and a tinted icon. **Given only `light`, the
system derives the other two**, and it derives `tinted` from LUMINANCE, so
artwork on a light plate becomes a pale tile with the mark barely visible.

Expo treats them asymmetrically (`@expo/prebuild-config`,
`plugins/icons/withIosIcons.js`), which dictates the artwork:

```js
removeTransparency: appearance !== 'dark',
backgroundColor:    appearance !== 'dark' ? '#ffffff' : undefined
```

| Variant | Expo does | So the artwork must be |
|---|---|---|
| `light` | flattens onto white | Opaque, full-bleed |
| `dark` | preserves alpha | **Transparent** background — iOS supplies the backdrop |
| `tinted` | flattens onto white | **Opaque**, dark plate with a light glyph, or the forced white becomes the icon |

`scripts/generate-icon-variants.py` (needs Python 3 with Pillow) assumes
artwork on a SOLID plate. A photographic or gradient background needs its
variants drawn by hand. Open the output before trusting it.

### Android

`android-icon-foreground.png` is masked by the launcher to an arbitrary shape;
only the **centre 61.1%** of the canvas is guaranteed visible.
`monochromeImage` is what Android 13+ uses for themed icons; without it the
launcher auto-derives a flat one.

---

## Removing what you do not ship

The counterpart to the wide baseline. Do it **once, before release**; during
development "unused" means "not built yet".

### The order matters

1. Delete the **code** that imports it
2. Remove its **config plugin** from `app.config.ts`
3. `pnpm remove` the **package**

Then `npx expo prebuild --clean` and rebuild: a stale native project keeps the
old entitlements and permission strings until regenerated.

### Permissions cost the most

**A declared permission appears in the store's privacy listing whether or not
any code reaches for it,** and invites a review question with no answer.
Background location on an app that never asks for it is the worst case, and it
is one line in `app.config.ts`.

For every permission the app does not request, remove all three: the adapter
in `src/lib/permissions/adapters.ts` and its key in `types.ts`, the config
plugin, and the package. Rewrite the usage strings for the ones you keep; the
plugin defaults are generic and review rejects generic.

### Safe to remove if unused

| Package | Also remove |
|---|---|
| `expo-local-authentication` | `src/lib/auth/biometric.ts` + `biometric-vault.ts`, the `biometricEnabled` branch in `persistedSlice`, the plugin |
| `victory-native` + `@shopify/react-native-skia` | `src/components/ui/area-chart.tsx`. Skia raises the binary-size floor, so this is the biggest single win |
| `lottie-react-native` | `lottie.tsx` / `.web.tsx`, `assets/animations/`, the `ANIMATION` entry in `lib/assets.ts` |
| `@expo/ui` | `src/components/native/*` except `app-tabs` |
| `expo-notifications` · `expo-location` · `expo-camera` · `expo-media-library` · `expo-contacts` · `expo-calendar` · `expo-audio` · `expo-tracking-transparency` | Their adapters, keys and plugins |
| `react-hook-form` + `@hookform/resolvers` | Only if no screen has a form |
| `expo-updates` | `src/lib/updates`, `src/components/updates`, the `ota:*` scripts, if OTA is never shipped |

### Never remove

`react-native-nitro-modules` · `react-native-worklets` · `react-dom` /
`react-native-web` · `babel-preset-expo`. **Nothing imports these**, which is
why they get removed by mistake; each breaks something that does not name it,
at runtime. Also keep `src/components`, `src/theme`, `src/lib`,
`eslint-rules` and `scripts`.

### Afterwards

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm verify:autolinking
npx expo export --platform ios --no-minify --output-dir /tmp/check
```

`verify:autolinking` catches a native module removed from `package.json` but
still linked in a stale native project.

---

## Release and EAS

**Do not run builds or submissions unless the user explicitly asks.** Builds
are billable and a submission is outward-facing. Configuring is free; running
is not.

The pipeline ships **configured and inert**: `eas.json` (four build profiles,
two submit profiles), `.eas/workflows/` (`pr-checks`, `preview`, `production`,
`manual`), `scripts/check-release-config.ts`, and the OTA wiring below. Every
app-specific value is a placeholder; `pnpm check:release` lists what is
missing, and the release workflows run it as their first job so an
unconfigured app costs one Linux minute and no build.

**`docs/release-pipeline.md` is the reference**: the three accounts and what
each owns, identifier permanence, the first-run checklist in order, the branch
→ workflow → store table, every workflow job by job, versioning, environment
variables, traps. The short version:

- `feat/* → dev → preview → main`. PRs into any of the three run the gates.
  `preview` produces a TestFlight build and an Android APK on the EAS install
  link; `main` uploads to App Store Connect and Play's internal track behind
  an approval. Both are **fingerprint-gated**: a merge with no native change
  publishes an OTA update instead of building.
- Manual by design: pressing *Submit for Review*, releasing the Play draft,
  the first Play AAB upload, bumping `expo.version`.
- `eas init` cannot write a dynamic config: `owner`, `extra.eas.projectId` and
  `updates.url` are pasted by hand, and `owner` is decided **before** init.
- `.env.local` is never uploaded. `EXPO_PUBLIC_*` values live in EAS
  environments; `production` stays empty until the production host is known,
  because a launch crash is louder than a build pointed at staging.
- Rewrite every permission usage string and prune what you do not ship.

---

## OTA updates

**Fully wired, inert until `extra.eas.projectId` and `updates.url` exist.**
`src/lib/updates`, `UpdateBanner`, `BuildInfo`, the `ota:*` scripts,
`fingerprint.config.js` and the per-publish policy all ship. Every call bails
on `Updates.isEnabled`, which is false in development, in Expo Go, and in any
build without EAS Update. Do not delete any of it as unused.

**`docs/ota-updates.md` is the full reference.** The rules:

- **Pull, not push.** A device asks on cold start (`checkAutomatically:
  'ON_LOAD'`, native) and when the foreground listener in `src/lib/updates`
  calls `checkForUpdateAsync()`. There is no way to push a bundle. Adoption
  tails over days; never assume everyone is on the newest bundle. A silent
  push notification waking the app to check is a different mechanism.
- **The fingerprint decides who receives an update** (trap 19). Nothing under
  `src/` moves it; `eas.json`, `package.json` scripts, `.gitignore`, icons,
  all of `app.config.ts` including `extra`, the dependency set and the
  autolinking config do. Batch such edits and follow them with a build. Verify
  with `eas fingerprint:compare --build-id <id>` before publishing; on a CNG
  project `new directory: ios` in that output is cosmetic (null hash).
- **Per-update policy.** `checkForUpdateAsync()` returns the incoming manifest
  before download, carrying the publishing config under `extra.expoClient`.
  `app.config.ts` sets `extra.updatePolicy` per publish and `src/lib/updates`
  reads it back: `pnpm ota:production -m "…"` is silent (next cold start);
  `pnpm ota:forced:production -m "…"` shows the banner and restarts.
  **`fingerprint.config.js` is load-bearing:** it skips `extra` from the
  fingerprint, otherwise each policy value is its own runtime version and the
  update reaches nobody. `src/lib/updates/updates.test.ts` guards it.
  `readUpdatePolicy` resolves anything unrecognised to silent. A third tier
  touches exactly `UpdatePolicy`, `POLICIES` and `update-banner.tsx`.
- **`UpdateBanner` is a sibling of `<Stack>`** in the root layout, anchored to
  the TOP: a forced update is a property of the app, and the native tab bar
  draws above every React Native view regardless of `zIndex`.
- **Versioning.** `Settings` shows the binary version (`expo-application`) and
  the bundle ordinal (`Constants.expoConfig.extra.otaBuild`, stamped by
  `scripts/ota-publish.mjs`). The ordinal resets by itself on a new binary.
  Never read the app version from `Constants.expoConfig.version`; it describes
  the running bundle, and `version` is a fingerprint input so it cannot move
  over the air.
- **`--environment` is required** on `eas update`; it loads the
  `EXPO_PUBLIC_*` values into the bundle. Without it `src/lib/env` throws on
  launch for every recipient. The `ota:*` scripts set it; set the EAS
  environment variables before the first publish to a channel.
- **Rollback is itself an update** and propagates at the same pull-based
  pace. `eas channel:pause` stops new devices; `eas update:republish` restores
  a known-good group; `eas update:roll-back-to-embedded` returns to the
  binary's bundle; `eas update:revert-update-rollout` abandons a rollout;
  `pnpm ota:rollback` is the interactive front end. Automatic protection covers
  only a crash before the first frame. Never set `disableAntiBrickingMeasures`.
- **Rollouts:** `eas update --rollout-percentage 10`, widen with
  `eas update:edit`, one rollout per branch. Worth it for new data paths and
  the first update after a native build; wrong for a fix to something already
  broken in production.
- **Measure** with `pnpm ota:health` (`eas update:insights`) and
  `eas channel:insights`; load the `eas-update-insights` skill for the schemas
  and caveats. Installs flat at zero is a fingerprint mismatch, not a code
  problem.
- **Ship a binary instead** when the change needs a version number a user can
  report, when the store's staged rollout and crash reporting are wanted, or
  when a previous OTA fix for the same problem was rolled back. Store policy
  permits JS updates; an update must not change what the app is for.

---

## Maintaining the template

`docs/maintaining.md` covers keeping this template and its dependencies
current: `pnpm doctor` (expo-doctor plus `expo install --check`) before any
upgrade, SDK upgrades with the `expo-upgrade` skill, the Software Mansion
version policy, `npx skills update` and `pnpm exec argent update --local` for
the vendored agent tooling, and the gates to run after each. Dependency
changes go in one commit, deliberately, followed by a build.
