# Software Mansion packages

What Software Mansion maintains that this app uses or may use, the version
policy that keeps them working together, and which lookalikes are not theirs.
Read before bumping any of the first five rows.

## The table

| Package | SDK 57 pin | In this repo | What for | Rule |
|---|---|---|---|---|
| `react-native-reanimated` | 4.5.1 | yes | CSS transitions/animations, layout animations, shared values | New Architecture only. 4.5.x pairs with worklets 0.10.x and RN 0.83–0.86 (`compatibility.json` in the package). See `docs/animation-and-native-ui.md` for which API to reach for. |
| `react-native-worklets` | 0.10.1 | yes | The UI runtime every worklet library shares | **Exactly one version app-wide.** Reanimated, Gesture Handler on the UI thread, ExecuTorch, Audio API and Pulsar all peer on it; two versions means two incompatible native runtimes. Its Babel plugin stays **last** in `babel.config.js`; it is the same plugin `babel-preset-expo` would inject, listed explicitly only to order it after the Unistyles plugin. |
| `react-native-gesture-handler` | ~2.32.0 | yes | Touch and gesture system, `GestureHandlerRootView` at the root | Use the `Gesture.*` builder API (v2). v3 (hooks, `Touchable`) is on npm but SDK 57 pins v2; see the migration note below. Never mix RN touch handlers with a `GestureDetector` on the same view. |
| `react-native-screens` | ~4.26.2 | yes | Native navigation containers behind expo-router | Never imported directly; every option is set through `Stack.Screen`. v5 alpha moves the new Stack/Tabs out of `experimental`; wait for expo-router to adopt it. Depends on `react-freeze` (SWM) transitively — nothing to configure. |
| `react-native-svg` | 15.15.4 | yes | Vector art, wordmarks, icon sources; Reanimated can animate its props | Installed with `npx expo install`, no config plugin. A new native module, so a rebuild, not a reload. |
| `react-native-pulsar` | — | documented only | Rich haptics: presets, pattern and realtime composers, worklet-callable | The upgrade path behind `@/lib/haptics`. The intent API (`haptics.select()` etc.) stays; only the engine underneath would change. Peers on the existing worklets. |
| `react-native-audio-api` | — | documented only | Web-Audio-shaped engine: synthesis, effects, analysis, recording | Overlaps `expo-audio`, which handles play and record. Add only for synthesis, effects or visualisation. Ships an optional config plugin for permissions and background audio. |
| `react-native-executorch` | — | documented only | On-device AI (LLM, vision, OCR, speech) via PyTorch ExecuTorch | Dev build only, SDK 55+, plus `react-native-blob-util` and a background downloader. Worklets 0.10.1 is in its range. Models download at runtime; budget the binary and the first launch. |
| `react-native-enriched-html` | — | documented only | Native rich-text input and display (HTML) | Dev build, New Architecture. Feature-specific. Install this name, not `react-native-enriched`. |
| `@swmansion/argent` | 0.25.x | devDependency | Agent toolkit that drives simulators, emulators and devices over MCP | A dev tool, not an app dependency. See `docs/testing-with-argent.md`. |

All rows marked "documented only" need a dev-client rebuild when added and do
not run in Expo Go, which this app cannot use anyway.

## Version policy

**Stay on the SDK's pinned versions.** `npx expo install <pkg>` resolves them;
`pnpm add` does not. The pins above are the SDK 57 list, and the boilerplate
matches every one.

Newer releases exist upstream: Reanimated 4.6 (peers worklets 0.12),
worklets 0.12, Gesture Handler 3.x, Screens 4.28 and a 5.0 alpha; the next
Expo SDK bundles them. **None of that is for SDK 57.** A bump moves the native
fingerprint, invalidates every OTA-reachable build, and lands a worklets
version the other peers are not tested against. Take them with the SDK
upgrade that pins them.

Reanimated and worklets are pinned to each other three ways (a
`compatibility.json`, a `WORKLETS_STABLE_API_VERSION` static assert, and the
npm peer range), so a mismatch fails at native build time rather than at
runtime. That is the intended failure; do not work around it.

## Gesture Handler 3

The v3 API replaces `Gesture.Pan()` builders with `usePanGesture({ ... })`
hooks, renames `onStart → onActivate` and `onEnd → onDeactivate` (with
`event.canceled` instead of a `success` argument), moves relations to
`useSimultaneousGestures` / `useCompetingGestures` / `useExclusiveGestures`,
adds `InterceptingGestureDetector` / `VirtualGestureDetector` for views that
depend on hierarchy (SVG), and replaces every button and touchable with one
`Touchable` whose feedback is chosen by props. Hook and builder gestures cannot
be mixed in one `GestureDetector`.

A migration skill exists upstream (`skills/gesture-handler-3-migration/` in the
Gesture Handler repo) and the vendored Software Mansion skill carries the same
material under `references/gestures/v2-to-v3-migration.md`. Vendor the upstream
skill with the SDK upgrade that pins v3, not before: on v2 it steers agents to
an API that is not installed.

## Not Software Mansion, despite the company they keep

These sit next to the SWM packages in every list and are routinely
misattributed. The maintainer matters when reading a changelog or filing an
issue.

| Package | Maintainer |
|---|---|
| `react-native-ease` | AppAndFlow (Janic Duplessis). Used here for declarative transitions; see `docs/animation-and-native-ui.md`. |
| `react-native-safe-area-context` | AppAndFlow |
| `react-native-keyboard-controller` | Kirill Zyusko |
| `react-native-unistyles` | Jacek Pudysz |
| `react-native-nitro-modules`, `react-native-mmkv` | Marc Rousavy |
| `@shopify/react-native-skia`, `@shopify/flash-list` | Shopify |
| `@expensify/react-native-live-markdown` | Expensify (peers on worklets, not SWM) |

## Docs endpoints for agents

Each of these returns plain text an agent can fetch in one request:

- https://docs.swmansion.com/react-native-reanimated/llms.txt (index) and `/llms-full.txt`
- https://docs.swmansion.com/react-native-gesture-handler/llms.txt and `/llms-full.txt`
- https://docs.swmansion.com/react-native-executorch/llms.txt
- https://docs.swmansion.com/react-native-audio-api/llms.txt
- https://docs.swmansion.com/argent/llms.txt

Screens publishes only a stub; Pulsar, Enriched and ease have none.

## The vendored skill

`.claude/skills/react-native-best-practices/` is Software Mansion's own
guidance for app authors (MIT per its frontmatter), installed from
`software-mansion-labs/skills`. Its `SKILL.md` is a routing table; the
subtrees that apply here are `references/animations` (the CSS-vs-shared-value
decision, `scheduleOnRN`, version gating), `references/gestures` (v2 builder
vs v3 hooks, keyed on the installed version — correct for 2.32) and
`references/svg`. The `jsi`, `on-device-ai`, `audio` and `rich-text` subtrees
apply only once those packages are added.

Two of its rules are stricter than the libraries: it forbids `runOnJS`
outright (Worklets only deprecates it) and forbids mixing RN touch handlers
with Gesture Handler on one view. Both are kept as rules here. Where it and
`CLAUDE.md` disagree on anything else, `CLAUDE.md` wins.
