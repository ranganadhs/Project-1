# React Native Boilerplate

Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript strict · pnpm

A complete starting point for a production mobile app. The design system,
infrastructure, navigation, release pipeline and agent tooling are wired and
inert: you swap adapters and fill in identifiers rather than delete
scaffolding. Everything visual is a token, every gate is CI-blocking, and every
app-specific value is a placeholder that a script reports until it is filled.

**Start with [CLAUDE.md](CLAUDE.md).** It is the rulebook: the hard rules, the
build order, and the traps that pass every gate and still break on device. It
is written for coding agents and is the fastest orientation for a human too.

## Quick start

```bash
cp .env.example .env.local     # set EXPO_PUBLIC_API_URL; the app does not start without it
pnpm install                   # also installs the git hooks and Argent
npx expo prebuild --clean      # generates ios/ and android/
npx expo run:ios               # or: npx expo run:android
```

This is a dev-client app. Expo Go cannot run it: Unistyles needs Nitro and
`@expo/ui` needs native views.

Building a real app on it: CLAUDE.md → *Setting up an app from this template*
is the checklist — cloning, the identity values to decide first, and the
branch model `feat/* → dev → preview → main`.

## The documents

| Read | Before |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Writing any code |
| [docs/app-plan.md](docs/app-plan.md) | Creating a route or choosing an identifier |
| [docs/release-pipeline.md](docs/release-pipeline.md) | Touching `eas.json`, `.eas/workflows/`, credentials or store accounts |
| [docs/ota-updates.md](docs/ota-updates.md) | Publishing an update, or changing anything that moves the fingerprint |
| [docs/testing-with-argent.md](docs/testing-with-argent.md) | Verifying anything on a simulator, emulator or device |
| [docs/animation-and-native-ui.md](docs/animation-and-native-ui.md) | Animating, wrapping an `@expo/ui` view, judging native feel |
| [docs/software-mansion.md](docs/software-mansion.md) | Bumping Reanimated, Worklets, Gesture Handler, Screens or SVG |
| [docs/maintaining.md](docs/maintaining.md) | Updating dependencies, upgrading the SDK, refreshing the agent tooling |

## Scripts

| Command | Purpose |
|---|---|
| `pnpm typecheck` | `tsc --noEmit`, strict |
| `pnpm lint` | ESLint, including the token-discipline rule |
| `pnpm test` | Deprecated-API scan, icon check, Jest |
| `pnpm theme:contrast` | Every semantic colour pair meets WCAG AA |
| `pnpm verify:autolinking` | Native modules resolve under pnpm's isolated store |
| `pnpm doctor` | `expo-doctor` and `expo install --check`: is every package at the SDK's version |
| `pnpm check:commits` | After committing: does each commit resolve its own imports |
| `pnpm check:release` | Every release identifier and credential id filled in; red on the template by design |
| `pnpm ota:preview` / `ota:production` | Publish a numbered OTA update with `--environment` set |
| `pnpm icons` | Regenerate the iOS dark and tinted icon variants from `assets/icon.png` |

Typecheck, lint, contrast and the deprecated-API scan run on pre-commit
through lefthook, installed by `pnpm install`.

## What is inside

### Design system

Three tiers. **Components read tier 2 only.**

```
src/theme/tokens/    tier 1 — raw scales (palette, space, radius, motion, elevation, …)
src/theme/themes/    tier 2 — semantic meaning (color.bg.canvas, color.fg.primary, shape.card, …)
                     tier 3 — component variant maps, colocated with components
```

Rebranding is a tier 1 edit; no component changes. Three mechanisms keep it
honest: the `local/no-raw-style-values` lint rule bans colour and design
literals inside `StyleSheet.create`; `pnpm theme:contrast` fails any fg/bg
pair below WCAG AA; TypeScript fails an unknown token key. If a value has no
token, add the token.

Typography defaults to the system font. A custom family registers one family
per weight in `tokens/typography.ts` and loads through `useFonts`.

### Motion

| Need | Engine |
|---|---|
| State-driven change — press, toggle, colour | Reanimated CSS transition *or* `react-native-ease`; one per component |
| Loop or mount motion | Reanimated CSS animation |
| Mount / unmount / list reflow | Reanimated layout animations |
| Anything a finger or scroll drives | Reanimated shared values + Gesture Handler |
| Screen to screen, sheets, tabs | Native: stack options, `formSheet` routes, `NativeTabs` |

Timing comes from `tokens/motion.ts`. Reduced motion and reduced transparency
are honoured.

### Infrastructure — `src/lib`

| Module | Notes |
|---|---|
| `storage` | Encrypted MMKV, key in the OS keychain. Web is unencrypted (`storage.web.ts`) |
| `query` | TanStack Query; focus and online managers wired to AppState and NetInfo |
| `api` | Typed fetch client factory, write guard, error copy. No endpoints baked in |
| `auth` | `AuthAdapter` seam, persisted session, biometric unlock |
| `env` | Zod-validated `EXPO_PUBLIC_*`; fails at startup with a readable message |
| `permissions` | One hook per permission, adapters per module; persists ask-history only |
| `updates` | OTA delivery with a per-update silent / forced policy |
| `haptics` | Intent API (`select`, `light`, `success`, …) over `expo-haptics` |

Connect a backend by implementing `AuthAdapter` and registering it once with
`configureAuth`. The API client reads the session token; a 401 signs out,
which flips the route guard.

### Components

`src/components/ui` is React Native, token-driven, themeable: Text, stacks,
Screen, Icon, PressableScale, Button, Card, ListItem, Badge, Chip, Banner,
Spinner, ProgressBar, Skeleton, Switch, TextField, SegmentedControl, Image,
List (FlashList), Gradient, Glass, Lottie, AreaChart, EmptyState, ErrorState.

`src/components/native` is `@expo/ui`, real SwiftUI and Jetpack Compose:
Menu, ContextMenu, NativePicker, NativeSlider, NativeDatePicker, NativeForm,
and AppTabs over the native tab bar. The rule for which layer: native where
the OS does something JS cannot or where feel belongs to the platform; React
Native where the component carries the brand.

### Navigation

Expo Router with declarative `Stack.Protected` guards; no imperative redirects.
Every presentation is native through react-native-screens: push, `formSheet`
with detents, `modal`, `fullScreenModal`, `transparentModal`. Dialogs and
sheets are routes, so they get a URL, back-button dismissal and deep-link
survival. Tabs are the OS tab bar through `AppTabs`.

### Release

`eas.json` (development, development-device, preview, production), four EAS
workflows (PR gates; `preview` → TestFlight and an Android install link;
`main` → store upload behind an approval; manual dispatch) and OTA delivery
with a forced-restart policy. Both release workflows are fingerprint-gated: a
merge with no native change publishes an update instead of building. Nothing
builds, submits or bills until the placeholders are filled and the repo is
linked to an EAS project.

### Testing with agents

`@swmansion/argent` is a devDependency and an MCP server (`.mcp.json`). An
agent on a fresh clone can boot a simulator, launch the app, read it as a
React component tree, tap, wait for the screen to settle, record flows and
profile. Its skills, Expo's official skills and Software Mansion's
best-practices skill live in `.claude/skills/`, pinned by `skills-lock.json`.

## Conventions

- kebab-case filenames, PascalCase exports. macOS is case-insensitive and CI is
  not.
- Route files stay thin: `src/app` imports a screen and returns it. Feature
  code lives in `src/features/<domain>/`; `src/lib` is cross-cutting only.
- Tests colocate: `foo.ts` beside `foo.test.ts`.
- Native packages install with `npx expo install`, never `pnpm add`.
- pnpm with an isolated `node_modules`. Expo resolves autolinking from the
  dependency graph, so hoisting is unnecessary and a phantom dependency fails
  here rather than in production.

## Not included

- Crash reporting. `EXPO_PUBLIC_SENTRY_DSN` is accepted by the env schema and
  read by nothing; add a reporter when the app has users.
- i18n message catalogues. `expo-localization` provides locale, timezone and
  RTL; pick a translation library when needed.
