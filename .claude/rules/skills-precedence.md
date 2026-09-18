---
description: How the vendored agent skills in .claude/skills relate to this repo's own rules, and which wins when they disagree.
alwaysApply: true
---

# Vendored skills and this repo's rules

`.claude/skills/` carries three sets of third-party skills, pinned by
`skills-lock.json`:

| Set | Source | Update with |
|---|---|---|
| `expo-*`, `eas-*` (26) | `expo/skills`, MIT | `npx skills update` |
| `react-native-best-practices` | `software-mansion-labs/skills`, MIT | `npx skills update` |
| `argent-*` (18) | `@swmansion/argent`, Apache-2.0 | `pnpm exec argent update --local` |

They are general advice for any Expo app. **CLAUDE.md is the rulebook for
this one, and it wins whenever the two disagree.** The known disagreements:

| A skill says | This repo does | Why |
|---|---|---|
| Inline styles, no `StyleSheet.create` (`expo-native-ui`) | `StyleSheet.create((theme) => …)` from Unistyles, every value a token | The token rule is a lint gate; inline literals are exactly what it exists to stop |
| A `theme/colors.ts` palette or expo-router `Color` as the design system (`expo-native-ui`, `expo-design-system`) | The three-tier token system in `src/theme` | `expo-design-system` itself says an existing system is the source of truth; never add a second one beside it |
| Default to `@expo/ui` for buttons, toggles, chips (`expo-ui`) | `@expo/ui` for menus, pickers, sliders, date/time, sheets, grouped forms; branded controls stay React Native | OS-drawn views ignore tokens; the brand has to survive a rebrand |
| `@expo/ui` universal exports include `Menu` (`expo-ui`) | It does not on SDK 57 (the installed types show this); `Menu` comes from `@expo/ui/community/menu` | The docs index is authoritative over the skill's list |
| `Gesture.*` builders are legacy; use the v3 hooks (SWM skill) | Gesture Handler `~2.32` is what SDK 57 pins; `Gesture.*` is current here | Version-gated advice; revisit at the SDK upgrade that pins v3 |
| `expo-linear-gradient` → `experimental_backgroundImage` (`expo-native-ui`) | `Gradient` on `expo-linear-gradient` with `theme.color.gradient` stops | Token-driven stops; the experimental prop has no token path |
| "Try Expo Go first" (`expo-overview`) | Expo Go cannot run this app (Unistyles needs Nitro); dev client only | See README quick start |
| `screens/` folder (`expo-project-structure`) | `src/features/<domain>/`; `src/app` holds thin route files | Repo convention, enforced by review |
| Never `runOnJS` (SWM skill) | Same, spelled `scheduleOnRN` | No conflict, stated so nobody softens it |

Everything else in those skills applies as written: the animation decision
order, the four-state screen rule, the native-feel checklist, the EAS
Workflows syntax rule ("fetch the schema, then `eas workflow:validate`"), the
Argent tapping and device-selection rules.

Two shared rules from `expo-overview` that this repo adopts outright:

- **Read the docs for THIS SDK, not `latest`:**
  `https://docs.expo.dev/versions/v57.0.0/…`.
- **Native packages install with `npx expo install`**, never `pnpm add`
  (also CLAUDE.md hard rule 3).

Where the repo's own docs go deeper than a skill, read the repo's doc first:
`docs/release-pipeline.md`, `docs/ota-updates.md`, `docs/testing-with-argent.md`,
`docs/animation-and-native-ui.md`, `docs/software-mansion.md`.
