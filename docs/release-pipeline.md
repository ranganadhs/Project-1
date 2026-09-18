# Release pipeline

How a commit becomes a build, how a build reaches a tester or a store, and
what has to exist before any of that can happen. Read this before touching
`eas.json`, `.eas/workflows/` or the release parts of `app.config.ts`.

Applies to `eas-cli@22`, Expo SDK 57 and the current EAS Workflows syntax.

`docs/ota-updates.md` is the companion: it owns publishing, rollout, rollback
and the fingerprint model. This document owns everything up to and including
the store.

---

## What is shipped, and what is inert

Everything below ships in the repo and does **nothing** until the placeholders
are filled. `pnpm check:release` lists what is still missing.

| File | What it is | Inert because |
|---|---|---|
| `eas.json` | Four build profiles, two submit profiles (`preview`: iOS only; `production`: both) | Submit ids are `<PLACEHOLDER>`s |
| `.eas/workflows/pr-checks.yml` | The gates, on every PR | Fires only once the repo is linked to an EAS project |
| `.eas/workflows/preview.yml` | Push to `preview` → TestFlight + an Android APK on the EAS install link, or an OTA | First job fails on placeholders, before any build |
| `.eas/workflows/production.yml` | Push to `main` → App Store Connect upload + Play internal-track draft, behind an approval, or an OTA | Same |
| `.eas/workflows/manual.yml` | On-demand build of any profile | Needs the project link |
| `scripts/check-release-config.ts` | The placeholder gate, run as `pnpm check:release` (TypeScript, via `tsx`) | — |
| `scripts/ota-publish.mjs` | Publishes an update and stamps its ordinal | Needs `updates.url` |
| `app.config.ts` → `owner`, `extra.eas.projectId`, `updates.url` | The project identity | `owner` and `projectId` are commented out, `updates.url` is absent; `check:release` reports all three as missing until filled |
| `app.config.ts` → `runtimeVersion`, `fingerprint.config.js` | The OTA compatibility rule | Correct as shipped; see `docs/ota-updates.md` |
| `app.config.ts` → `expo-notifications` plugin | `mode` from `EAS_BUILD_PROFILE`; `enableBackgroundRemoteNotifications: false` | Correct as shipped |

Nothing here creates a build, a project or a bill on its own. The first
billable event is the first push to `preview` after setup.

**Do not run builds or submissions unless the user asks.** Builds are
billable and a submission is outward-facing. Configuring is free; running is
not.

---

## The three accounts, and what each one owns

Three things are usually conflated. They are owned separately and can belong
to different organisations.

| Account | Owns | Permanent once |
|---|---|---|
| **EAS project** (under the org's EAS account) | Builds, credentials store, environment variables, update branches and channels, the OTA endpoint `https://u.expo.dev/<projectId>` | `eas init` has run: the `owner` decides where all of the above live, and moving is a different project, not a setting |
| **Apple Developer team** + App Store Connect | The app record, signing certificates and provisioning profiles, TestFlight, the review queue | An App Store Connect record exists for the bundle id: bundle ids are unique across every team, and App Transfer requires a released version |
| **Google Play developer account** | The listing, the upload key, Play App Signing, the testing tracks | The first AAB has been uploaded under the package name |

Consequences worth knowing before the first command:

- Changing the Apple team later means a **different bundle id** unless the app
  has shipped a release (transfer) — and a different bundle id is a different
  app to iOS. Every TestFlight tester reinstalls.
- The EAS `owner` is the one value that cannot be a prompt answer. The
  signed-in user may be an admin on several accounts; declare `owner` in
  `app.config.ts` **before** `eas init` so the project is created under the
  right one.
- Credentials for both stores live on EAS, not in the repo. `.gitignore`
  excludes `*.p8 *.p12 *.jks *.mobileprovision *.key`,
  `google-services.json` and `GoogleService-Info.plist`. Keep it that way; a
  key in the repo is a key in every clone.

---

## Identifiers

| Identifier | Where | Rule |
|---|---|---|
| Bundle id (iOS) / package (Android) | `app.config.ts` → `ios.bundleIdentifier`, `android.package` | **The same string on both platforms.** Reverse-DNS on a domain the org controls. No persona, role or variant segment on the base id — one app carries every profile; a role suffix such as `.admin` cannot be undone once a store record exists. Suffix variants (`.dev`) only for builds you actually install side by side |
| URL scheme | `app.config.ts` → `scheme` | Short, lower-case, the app's name. It is what a push notification tap and a shared link open |
| EAS slug | `app.config.ts` → `slug` | The project name on EAS; `@<owner>/<slug>` |
| App name | `app.config.ts` → `name` | What appears under the icon |
| Version | `app.config.ts` → `version` | The marketing version, three numeric segments. Bumped by hand at a store release |

`name`, the bundle id, the icons and the whole of `app.config.ts` are
**fingerprint inputs**. Changing any of them moves the runtime version, which
orphans every installed build from OTA until a new binary ships. Batch such
edits and follow them with a build (`docs/ota-updates.md`, trap 1).

An existing local build has the old bundle id **baked in**. After changing it,
`npx expo prebuild --clean && npx expo run:ios` — a Metro reload will not do.

Record the decided values in `docs/app-plan.md` → *Release identifiers* at
plan time. They are the ones that cannot be changed later.

---

## First-run checklist

In this order. Each step exists because skipping it fails later, usually after
a build has been paid for.

### 1. Decide, before any command

- The EAS account that will own the project → `owner` in `app.config.ts`.
- The bundle id / package → `app.config.ts`. Confirm it is free on both
  stores.
- Which Apple team and which Play account will own the app.

### 2. Bind the project

```bash
npm install -g eas-cli          # 22 or newer
eas login
eas whoami                      # lists every account you can act as
eas init                        # creates the project under `owner`
```

`eas init` **cannot write into a dynamic config.** It prints the project id and
stops. Paste it:

```ts
// app.config.ts
owner: '<EAS_OWNER>',                                   // the account, not you
updates: { url: 'https://u.expo.dev/<EAS_PROJECT_ID>' },
extra: { eas: { projectId: '<EAS_PROJECT_ID>' } },
```

`eas update:configure` would write the same url and `runtimeVersion` into an
`app.json`; here it also cannot, and it would try to set the `appVersion`
policy. The fingerprint policy is in place — leave it.

Verify: `eas project:info` reports `@<owner>/<slug>`.

`eas build:configure` is **not** needed. It generates a three-profile
`eas.json`; this repo ships a better one.

### 3. Credentials — iOS

```bash
eas credentials --platform ios
```

Pick the `production` profile. Log in with an Apple account on the owning
team once; EAS generates and stores the distribution certificate and the App
Store provisioning profile. After that no one needs the Apple login to build.

In the same session: **App Store Connect API → Set up your project to use an
API Key for EAS Submit.** EAS creates and stores the key. This is what lets a
workflow submit with nobody at a terminal.

If the org brings its own key instead: App Store Connect → Users and Access →
Integrations → App Store Connect API → **Team Keys** → generate with the
**App Manager** (or Admin) role. The `.p8` downloads **once**. Upload it
through `eas credentials`; do not put it in the repo or paste it into a chat.

Repeat `eas credentials --platform ios` for `development` (an ad hoc profile)
after registering devices:

```bash
eas device:create            # prints a URL / QR; each phone registers itself
```

Only builds made **after** registration include a device. New Apple
memberships can take up to three days before device processing works.

### 4. Credentials — Android

```bash
eas credentials --platform android
```

Let EAS generate the upload keystore. Then **Google Service Account → Upload a
Google Service Account Key**. To create that key: Google Cloud → IAM & Admin →
Service Accounts → create → Keys → JSON; enable the **Google Play Android
Developer API** on the project; Play Console → Users and permissions → invite
the service account's email with release permissions on this app.

Once uploaded, `eas submit` and the workflows use it automatically.
`serviceAccountKeyPath` in `eas.json` is only for a key kept locally, and this
repo does not.

### 5. Store records

- **App Store Connect**: create the app record against the bundle id. Its
  numeric Apple ID (App Information → General) is `<ASC_APP_ID>`. The team's
  ten-character id (developer.apple.com → Membership) is `<APPLE_TEAM_ID>`.
  Both go into `eas.json` → `submit.*.ios`. A workflow submit with either
  missing fails at "Prepare credentials" — it would ask, and a workflow has
  nobody to ask.
- **TestFlight**: create an internal group **without** automatic distribution
  and put its name in `submit.preview.ios.groups`. Groups with automatic
  distribution receive every build regardless; the named group is the one the
  workflow adds builds to explicitly.
- **Play Console**: create the app with the package name. Then upload **one
  AAB by hand** to any track. Google's API refuses uploads to an app that has
  never had a release; every upload after that is automated. Enrol in Play
  App Signing (EAS generated a fresh upload key; there is nothing old to
  preserve). Play only takes AABs, which is why preview's APK never goes
  there — it is handed out from the EAS install link instead.
- Sign every agreement in App Store Connect → Business. An unsigned Paid Apps
  agreement fails a submission with an error that does not name the
  agreement.

### 6. Environment variables

`.env.local` is git-ignored and therefore absent on EAS. Every `EXPO_PUBLIC_*`
the app validates must exist in **each** EAS environment a build uses:

```bash
eas env:set --name EXPO_PUBLIC_API_URL --value https://staging.example.com \
  --environment development --environment preview --visibility plaintext
```

Leave `production` **empty until the production host is known.** This is
deliberate. `src/lib/env` validates at module load, so a production build
without its variables is not a degraded app — it is a launch crash — and that
crash is loud, on the first run, before anyone ships it. A production build
pointed at staging is quiet and wrong.

The same applies to `pnpm ota:production`: an update bakes the variables in
at publish time, so publishing to the production channel before they exist
ships that crash to everyone at once. Nothing in the pipeline stops you.

### 7. Link the repository

expo.dev → the project → **GitHub** → install the Expo GitHub App → link the
repo. **Without this, no `on: push` or `on: pull_request` workflow ever
fires.** Needs Owner or Admin on the EAS account; an organisation repo can be
linked only to an organisation EAS account. This cannot be done from a
terminal.

### 8. Confirm and go

```bash
pnpm check:release                       # nothing left as <PLACEHOLDER>
eas workflow:validate .eas/workflows/preview.yml
eas workflow:validate .eas/workflows/production.yml
```

Then merge to `preview`. The first run builds both platforms, uploads iOS to
TestFlight and leaves the Android APK on the EAS install link (the build page
QR). The first TestFlight build usually needs **export compliance** answered
once in App Store Connect before it becomes installable.

Only after a build exists is an OTA update meaningful. Before the first
publish, `eas fingerprint:compare --build-id <id>` — an update whose
fingerprint matches no build succeeds, is billed, and reaches nobody.

---

## Branch → workflow → artefact → store

| Branch | Trigger | Workflow | iOS | Android | Then |
|---|---|---|---|---|---|
| any → PR into `dev`, `preview`, `main` | `pull_request` | `pr-checks.yml` | — | — | Gates + commit scope |
| `preview` | `push` | `preview.yml` | Store build → **TestFlight**, added to the named internal group | APK, internal distribution → the **EAS install link**; no store | Or, if no native change: OTA to channel `preview` |
| `main` | `push` | `production.yml` | Store build → **App Store Connect**, processed, awaiting review | AAB → Play **internal track, as a draft** | Behind `require-approval`. Or an approved OTA to channel `production` |
| any | `eas workflow:run` | `manual.yml` | Any profile | Any profile | Optional submit |

`dev` has no automatic build. Development builds are made on demand with
`manual.yml` or `eas build --profile development`; a dev client loads any
update branch, so it rarely needs rebuilding.

`submit.production.android` is `track: internal, releaseStatus: draft`, so
a `main` merge lands the AAB on the **internal** track and stops. Promoting
it to production is a click in Play Console, once the listing, content
rating and pricing are complete — Play refuses a production release before
they are. When the app is past that, switching the submit profile to
`track: production` (still `draft`) makes a `main` merge create a
production-track draft instead; the click remains.

**What stays manual, by design:**

| Step | Why |
|---|---|
| Pressing **Submit for Review** in App Store Connect | Apple offers no API for it. The workflow uploads and stops |
| Promoting or releasing the Play **draft** | `releaseStatus: draft`, so nothing reaches users without a person clicking |
| Answering **export compliance** the first time | App Store Connect asks once per app |
| The first Play **AAB upload** | The API refuses a never-released app |
| Bumping `expo.version` | A store release is a product decision |

---

## The workflows, job by job

All four files share a shape: `defaults.image: sdk-57` pins the builder image
to the SDK; `defaults.tools.corepack: true` makes custom jobs honour the
`packageManager` field so pnpm runs at the pinned version rather than the
image's. Build jobs take the same from `eas.json` → `base`.

### `pr-checks.yml`

One `linux-medium` custom job, on every PR into `dev`, `preview` or `main`:
typecheck, lint, test, contrast, deprecated-API scan, then commit scope.

These are the same gates lefthook runs, and the repetition is the point: **the
hook checks the working tree, so it is green on a broken commit** — a staged
file importing an unstaged sibling. This is the first place the gates run
against the commit itself.

The commit-scope step needs its fetch. EAS checks out a **shallow clone of the
head ref alone**, so `origin/<base>` does not exist and the range resolves to
nothing (`fatal: ambiguous argument`). The step unshallows and fetches the base
branch explicitly before running `scripts/check-commit-scope.mjs`.

`check:release` is **not** here. A fresh clone must be green on its first PR.

### `preview.yml` and `production.yml`

Same shape; production adds an approval.

1. **`release_config`** — `pnpm check:release`. Fails on any placeholder, on
   a missing `extra.eas.projectId` or `updates.url`. Cheapest job first, so an
   unconfigured app costs one Linux minute and no build.
2. **`fingerprint`** — computes the native fingerprint for the profile's
   environment. Requires CNG (no committed `ios/`/`android/`), which this repo
   is. Its `environment` must equal the build profile's; a mismatch yields a
   hash no build will ever match and the gate always rebuilds.
3. **`get_ios_build` / `get_android_build`** — asks EAS for an existing build
   of this profile with this fingerprint. `wait_for_in_progress` makes it wait
   for a matching build in progress rather than start a duplicate.
4. **`build_*`** — runs **only if** no matching build exists. A merge that
   touched nothing native (no dependency, no plugin, no config, no icon) skips
   both builds.
5. **`submit_*`** — `needs: [build_*]`. A **separate job**, not a step inside
   the build, so a failed build never reads as a failed submission and nothing
   that did not compile reaches a store. Both workflows use `type: submit`
   with the submit profile of the same name; on preview that adds the iOS
   build to the group named in `submit.preview.ios.groups`. Preview has
   **no `submit_android`**: the profile builds an APK for the install link,
   and Play does not accept APKs. Production submits both.
6. **`update_*`** — runs **only if** a matching build exists: publishes the
   commit as an OTA update to the profile's channel, per platform, with
   `environment` set explicitly.
7. **`approve_release`** (production only) — `require-approval`. A person
   approves or rejects on the EAS dashboard; that becomes the job's success or
   failure. Builds start immediately (they cost minutes but touch no user);
   submits and the production OTA wait on it.

Why the gate matters in numbers: two store builds are roughly forty macOS and
Linux minutes and two of the month's build quota. A JS-only merge under the
gate is one Linux minute.

### `manual.yml`

`workflow_dispatch` with `profile`, `platform` and `submit` inputs:

```bash
eas workflow:run .eas/workflows/manual.yml -F profile=development-device -F platform=ios
```

`eas workflow:run` uploads the **working directory** unless `--ref` is given.
A simulator build installs with `eas build:run -p ios --latest`.

### Rules that apply to every file

- `environment` is set explicitly on every non-build job. Unset, EAS infers
  `production` for `fingerprint`, `update` and custom jobs, and for any store
  build profile that does not say otherwise — so a preview OTA would bake in
  production variables.
- `[skip eas]`, `[eas skip]` or `[no eas]` in a commit message skips push and
  PR triggered runs.
- A workflow file is limited to **16 KiB**; there is no matrix and no shared
  config between files.
- `concurrency.group` is a placeholder — custom groups are not supported.
  `cancel_in_progress: true` is honoured.
- Validate before committing: `eas workflow:validate <file>`. It checks
  profile references against `eas.json`, which a YAML linter cannot.

---

## Versioning

Three numbers, three owners.

| Number | Source | Moves when |
|---|---|---|
| `expo.version` (marketing) | `app.config.ts`, by hand | A store release. It is a fingerprint input, so it rides a build |
| Build number / `versionCode` | **EAS, remotely** (`appVersionSource: remote` + `autoIncrement: true` on `preview` and `production`) | Every store build. TestFlight and Play both reject a number they have seen; remote source is what lets CI increment without committing |
| OTA ordinal | `scripts/ota-publish.mjs` | Every publish to the same runtime; resets by itself on a new binary |

`eas build:version:get` / `eas build:version:set` read and seed the remote
counter. Do not set `ios.buildNumber` or `android.versionCode` in the config;
with remote source they are ignored.

iOS accepts only a three-segment numeric `version`. A hyphenated string
(`1.0.0-beta`) is rejected at upload.

Publishing, rollout, rollback and measurement: `docs/ota-updates.md`.

---

## Environment variables

- `EXPO_PUBLIC_*` values are **inlined into the bundle** by Metro and readable
  by anyone with the binary. They are configuration, never secrets. Server
  credentials belong on a backend.
- Metro inlines only **static member expressions** —
  `process.env.EXPO_PUBLIC_API_URL`, written out. `process.env[name]` is
  `undefined` in a release bundle. `src/lib/env` does this.
- `.env.local` is for the laptop. It is never uploaded.
- EAS environments: `development`, `preview`, `production`. Each build
  profile names the one it compiles against; each workflow job names the one
  it runs under.

```bash
eas env:set --name NAME --value V --environment preview --visibility plaintext
eas env:push --environment development --path .env.local   # bulk, from a file
eas env:pull --environment development                     # writes .env.local
eas env:list --environment preview
```

Visibility: `plaintext` (readable everywhere), `sensitive` (masked in logs),
`secret` (server-only; **not** available while EAS CLI resolves the dynamic
config locally, nor to `eas update` run from a laptop). For an `EXPO_PUBLIC_*`
value `secret` buys nothing — it ends up in the bundle regardless.

- `eas update` **requires `--environment`** on SDK 55 and later, and ignores
  `.env` files when it is given. Without it the bundle carries undefined
  variables and `src/lib/env` throws on launch for everyone who receives the
  update. The `pnpm ota:*` scripts exist so nobody types that command by hand.
- EAS **rejects an empty value**. A variable that is declared but unfilled
  locally must not be pushed; absent and empty are the same thing to the app.
- Files (a Firebase config, a keystore) go in as `--type file` with `secret`
  visibility and are referenced by path at build time.

---

## Costs and limits

Figures from the EAS pricing page; check it before relying on them.

| Free plan | |
|---|---|
| Builds | 15 iOS + 15 Android per month, one at a time, low-priority queue, 45-minute timeout |
| Workflow minutes | 60 per month; Linux medium ≈ $0.018/min and macOS medium ≈ $0.075/min beyond that |
| EAS Update | 1 000 monthly active users |
| Resource class | `large` unavailable; `medium` is the default |
| Environments | The three defaults only |

Paid plans add concurrency; with one concurrency the parallel build jobs above
simply queue.

If workflow minutes matter, the PR gates are the only job that can move
elsewhere: `pr-checks.yml` is plain shell and runs unchanged on any CI. The
build, submit, fingerprint and update jobs need EAS.

---

## Traps

Each one passes typecheck, lint and the bundler.

| Mechanism | Failure mode | Check |
|---|---|---|
| An update's runtime version matches no build | `eas update` **succeeds, is billed, and reaches nobody** | `eas fingerprint:compare --build-id <id>` before publishing |
| `eas.json`, `package.json` scripts, `.gitignore`, icons, `app.config.ts` are fingerprint inputs | Editing any of them orphans every installed build from OTA | Batch such edits; follow with a build |
| `expo-notifications` as a bare plugin name | `mode` defaults to `development` → `aps-environment: development` in **every** build, TestFlight included. Production pushes reach nobody, silently | The plugin here derives `mode` from `EAS_BUILD_PROFILE`; keep it |
| `enableBackgroundRemoteNotifications` | Declares a background mode. Unused, it is a review question with no answer | Off by default; turn on only with a silent-push feature |
| `eas update` without `--environment` | Undefined `EXPO_PUBLIC_*` → `src/lib/env` throws → launch crash for every recipient | Use `pnpm ota:*` |
| `production` environment empty | A production build or update crashes on launch | Deliberate until the host is known; `check:release` does not see env vars — `eas env:list --environment production` does |
| `eas init` / `eas update:configure` on a dynamic config | They print and exit; nothing is written | Paste `projectId`, `updates.url`, `owner` by hand |
| `ascAppId` / `appleTeamId` unset | A workflow submit fails at "Prepare credentials"; interactively it would prompt | `check:release` |
| `uploadSourceMaps` in a build profile | Accepted by the CLI, **rejected by the workflow validator** at job start ("is not allowed") | Omit it; symbolicated traces need a direct `eas build` |
| `expo-dev-client` is a production dependency | It injects `NSLocalNetworkUsageDescription` and strips it on non-Debug configurations by substring match | Confirm on the **archive**, not on the generated `ios/`; never rewrite that string |
| A declared permission the app never requests | Appears in the store privacy listing; invites a review question | Prune code, plugin and package before release |
| `npx expo run:ios` with an existing `ios/` | Compiles the existing native project; **does not re-sync `app.config.ts`** | `npx expo prebuild -p ios` first, `--clean` if anything was removed |
| Bundle id changed | Every existing local build still carries the old one | Rebuild, do not reload |
| Play sees a `versionCode` it has seen before | Rejects forever | Remote `autoIncrement`; never hand-set it |
| Hyphen in `expo.version` | App Store Connect rejects the upload | Three numeric segments only |
| The repo is not linked on expo.dev | No push or PR workflow ever fires, with no error anywhere | Step 7 |
| `environment` unset on a workflow job | Defaults to `production` | Set it on every non-build job |
| Splash plugin without `image` | Breaks the Android build (`splashscreen_logo not found`); iOS is fine | Keep `image` |

---

## Pre-submission checklist

- [ ] Every permission usage string rewritten to say what **this** app does
      with the data. Plugin defaults are generic and App Store review rejects
      generic.
- [ ] Every permission the app does not request removed in all three places:
      the adapter and key in `src/lib/permissions`, the plugin in
      `app.config.ts`, the package. Then `npx expo prebuild --clean`.
- [ ] `pnpm check:icons` passes; `icon.png` is full-bleed and un-rounded;
      all three iOS variants present.
- [ ] `pnpm check:commits` over the release range — the hook cannot run it.
- [ ] `pnpm check:release` clean; `eas env:list --environment production`
      shows every required variable.
- [ ] `eas fingerprint:compare` against the last store build if this is an
      OTA rather than a binary.
- [ ] Export compliance answered; privacy nutrition labels filled for the
      data the app actually collects.
- [ ] The Paid Apps agreement and every other agreement signed in App Store
      Connect → Business.
- [ ] On Android: the app is past its first manual AAB; Play App Signing
      enrolled; internal testers listed.

---

## Sources

- eas.json reference — https://docs.expo.dev/eas/json/
- Build configuration — https://docs.expo.dev/build/eas-json/
- App versions, remote source, autoIncrement — https://docs.expo.dev/build-reference/app-versions/
- Builder images — https://docs.expo.dev/build-reference/infrastructure/
- Workflows syntax — https://docs.expo.dev/eas/workflows/syntax/
- Pre-packaged jobs (`fingerprint`, `get-build`, `submit`, `require-approval`, `update`) — https://docs.expo.dev/eas/workflows/pre-packaged-jobs/
- Workflow examples (deploy to production) — https://docs.expo.dev/eas/workflows/examples/deploy-to-production/
- Workflow limitations — https://docs.expo.dev/eas/workflows/limitations/
- Linking a GitHub repo — https://docs.expo.dev/build/building-from-github/
- Managed credentials — https://docs.expo.dev/app-signing/managed-credentials/
- Internal distribution and device registration — https://docs.expo.dev/build/internal-distribution/
- Submit to the App Store — https://docs.expo.dev/submit/ios/
- Submit to Google Play — https://docs.expo.dev/submit/android/
- Automating submissions — https://docs.expo.dev/build/automate-submissions/
- Environment variables — https://docs.expo.dev/eas/environment-variables/
- Environment variables in builds and workflows — https://docs.expo.dev/eas/environment-variables/usage/
- EAS Update: getting started — https://docs.expo.dev/eas-update/getting-started/
- EAS Update: deployment patterns — https://docs.expo.dev/eas-update/deployment/
- `expo-updates` (runtime version policies) — https://docs.expo.dev/versions/v57.0.0/sdk/updates/
- `expo-notifications` plugin (`mode`) — https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- Pricing — https://expo.dev/pricing
