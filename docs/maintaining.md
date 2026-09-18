# Maintaining the template

How to keep this template and its dependencies current without breaking the
things that make it work. Applies equally to an app built on it.

---

## What "current" means

Every native package is pinned to the version the installed Expo SDK expects.
That pin is the compatibility contract: Expo, React Native, Reanimated,
Worklets, Gesture Handler, Screens and every `expo-*` module are tested
together at those versions. "Latest on npm" is not the target; "what the SDK
pins" is.

Two commands say whether the project is current:

```bash
pnpm doctor                 # expo-doctor, then expo install --check
```

- **`expo-doctor`** runs twenty-odd checks: package versions against the SDK,
  missing peer dependencies of native modules, config-plugin validity,
  duplicate or conflicting native packages, generated native directories that
  should not be committed, and app-config schema errors. Read every failure;
  each names its fix.
- **`expo install --check`** lists every package whose installed version
  differs from the SDK's expected range.

Run it before any dependency change, after any SDK upgrade, and on a regular
cadence (monthly is enough between SDK releases).

---

## Routine updates

```bash
npx expo install --fix      # every SDK-pinned package to its expected version
pnpm outdated               # everything else, against its semver range
pnpm update                 # non-native packages, within their ranges
pnpm install                # refresh the lockfile
```

Rules that keep this safe:

- **Native packages go through `npx expo install <pkg>`**, never `pnpm add`.
  Only `expo install` resolves the SDK pin. `pnpm update` is for pure-JS
  packages.
- **Any change to the dependency set is a native change.** It moves the OTA
  fingerprint and needs a rebuild (`npx expo prebuild --clean && npx expo
  run:ios`); a Metro reload does not see it. Batch dependency updates and
  follow them with a build. See `docs/ota-updates.md`.
- **One version of `react-native-worklets`, app-wide.** Reanimated, Gesture
  Handler and any other worklet library peer on it; two versions are two
  incompatible native runtimes. `pnpm doctor` reports a mismatch.
- **Do not bump Reanimated, Gesture Handler or Screens across a major**
  outside an SDK upgrade. `docs/software-mansion.md` has the policy.
- **A deliberate pin** goes in `package.json` → `expo.install.exclude` so
  `expo-doctor` stops reporting it, with a comment on why in the commit.
- **`pnpm-lock.yaml` is committed and installed frozen on EAS.** A dependency
  change without a lockfile change fails the build.

After updating:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm theme:contrast && pnpm verify:autolinking
npx expo export --platform ios --no-minify --output-dir /tmp/check
npx expo prebuild --clean && npx expo run:ios      # then a device check
```

Commit dependency updates as one commit, separate from feature work.

---

## Upgrading the Expo SDK

An SDK upgrade is the one time everything moves together. In order:

1. **Read the SDK release notes and changelog** for breaking changes to the
   packages this template uses (`expo-router`, `@expo/ui`, `expo-updates`,
   `expo-notifications`, Reanimated, Gesture Handler, Screens, Unistyles,
   Nitro). Load the vendored `expo-upgrade` skill; it walks the mechanics.
2. **Upgrade in one step:**
   ```bash
   npx expo install expo@^<next>     # the SDK package
   npx expo install --fix            # every pinned package to the new SDK
   pnpm doctor
   ```
3. **Third-party native packages** that are not SDK-pinned (Unistyles, Nitro,
   MMKV, keyboard-controller, ease, FlashList): check each one's compatibility
   note for the new React Native version before bumping; bump with
   `npx expo install`.
4. **Regenerate and rebuild** on both platforms: `npx expo prebuild --clean`,
   `npx expo run:ios`, `npx expo run:android`. The generated directories are
   not committed; they are the output of this step.
5. **Update the pins that live outside `package.json`:**
   - `eas.json` → `build.base.ios.image` / `android.image` → `sdk-<next>`
   - `.eas/workflows/*.yml` → `defaults.image: sdk-<next>`
   - `.claude/rules/skills-precedence.md` and `CLAUDE.md` → the versioned docs
     URL `https://docs.expo.dev/versions/v<next>.0.0/`
   - `scripts/check-deprecated-apis.mjs` → the list of modules whose runtime
     deprecations it guards; add any the changelog names
6. **Run every gate**, then the demo app on a device: tabs, every sheet and
   modal presentation, the native components tab, the theme switch, sign-in.
7. **Vendored skills** ship SDK-specific advice; update them (below) in the
   same change.

Commit the upgrade as one commit. It moves the fingerprint; the next store
build establishes the new runtime version.

---

## Keeping the agent tooling current

```bash
npx skills update                     # Expo and Software Mansion skills, per skills-lock.json
pnpm exec argent update --local       # Argent package, its skills, rules and agent
```

After an Argent update, read the diff of `.claude/rules/argent.md` and the
`argent-*` skills; the rule file is managed by the tool and is what every
agent session loads. After a skills update, re-read
`.claude/rules/skills-precedence.md` against the changed skills: a new rule in
a skill that contradicts `CLAUDE.md` is added to that table.

Other tooling, and where its version is pinned:

| Tool | Pinned by | Update with |
|---|---|---|
| pnpm | `packageManager` in `package.json` (corepack honours it locally and on EAS) | Edit the field, `corepack use pnpm@<version>` |
| Node | The Expo SDK's supported range | Match the SDK; EAS images carry a compatible Node |
| eas-cli | `cli.version` in `eas.json` (a minimum) | `npm install -g eas-cli`; raise the minimum only for a feature the workflows need |
| lefthook | devDependency; installed by `prepare` | `pnpm update lefthook` |

---

## The gates are part of the template

Each script under `scripts/` encodes a rule. When the rule's inputs change,
the script changes with them:

| Script | Keeps true | Update when |
|---|---|---|
| `check-contrast.mjs` | Every semantic colour pair meets WCAG AA | A new pairing token is added |
| `check-deprecated-apis.mjs` | No Expo API that throws at runtime is called | An SDK changelog deprecates a module at runtime |
| `check-icons.mjs` | Icon assets are the right size and alpha | An asset is added to `app.config.ts` |
| `check-release-config.ts` | No placeholder reaches a release build | A new app-specific value is introduced |
| `check-commit-scope.mjs` | Every commit resolves its own imports | A new vendored directory needs excluding |
| `ota-publish.mjs` | Updates carry a policy and an ordinal | The `eas update` CLI flags change |

---

## Do not

- Add `node-linker=hoisted` to `.npmrc`. Isolated `node_modules` is the
  design; a package that fails to resolve is missing a declared peer.
- Commit `ios/` or `android/`. They are generated; changes belong in
  `app.config.ts` or a config plugin.
- Move `react-native-worklets/plugin` from the last position in
  `babel.config.js`.
- Change a token value to fix one component. Add a token.
- Bump a native package by editing `package.json` by hand.
