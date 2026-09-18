# Over-the-air updates

Shipping JavaScript to installed apps without going through the store — how it
is wired here, what it costs to get wrong, and how to get back out. Applies to
`expo-updates@57` and `eas-cli@22`.

---

## What is wired, and what you must do

Wired and inert:

| File | What it does |
|---|---|
| `app.config.ts` → `updates` | `ON_LOAD`, zero timeout, embedded fallback |
| `app.config.ts` → `runtimeVersion` | `{ policy: 'fingerprint' }` |
| `app.config.ts` → `extra` | `updatePolicy`, `otaBuild` — the per-publish channel |
| `fingerprint.config.js` | What is allowed to move the runtime version |
| `src/lib/updates/` | The hook, the policy read, the foreground catch-up |
| `src/components/updates/` | The forced-restart banner, the version display |
| `scripts/ota-publish.mjs` | Publishes, and stamps the OTA ordinal |
| `package.json` → `ota:*` | The commands you actually run |

Every call bails on `Updates.isEnabled`, which is false in development, in Expo
Go, and in any build without EAS Update configured. **So none of it does
anything until you finish the setup below.**

To turn it on:

1. `eas init` — it prints a `projectId` and cannot write it into a dynamic
   config. Paste it into `extra.eas.projectId` in `app.config.ts`.
2. `eas update:configure` — same story. Paste the url it prints into
   `updates.url`: `https://u.expo.dev/<projectId>`.
3. Create `eas.json` with build profiles, each pinned to a `channel` and an
   `environment`. The `ota:*` scripts assume channels named `preview` and
   `production`.
4. Set your `EXPO_PUBLIC_*` values as **EAS environment variables** per
   environment. `.env.local` is not uploaded, and `src/lib/env` throws at module
   load when a required key is missing. See the warning under *Publishing*.
5. Build. The first build after all of this is the first one that can receive an
   update.

---

## The model, in the order it bites

**Channel** — a name a *build* is pinned to, baked in at build time and
unchangeable afterwards. `preview`, `production`.

**Branch** — a line of updates. Channels point at branches, which is what lets
you promote a tested branch to production without rebuilding.

**Runtime version** — which binaries an update may land on. Here it is a
**fingerprint** of the native project, so adding a native module automatically
stops old binaries receiving JavaScript they cannot run.

That last one is the whole safety mechanism, and it is also the single most
likely reason an update reaches nobody.

---

## Trap 1 — an update to the wrong runtime version reaches nobody, and succeeds

There is no error, because nothing is wrong. The update is simply *for a
different app* than the one installed. It publishes, it is billed, and it sits
there.

### What moves the fingerprint

The fingerprint's sources (iOS):

```
.gitignore · eas.json · the app icons · node_modules (the dependency set)
contents: expoConfig · packageJson:scripts · package:react-native
          expoAutolinkingConfig:ios · rncoreAutolinkingConfig:ios
```

Two things follow.

**Nothing under `src/` is on that list.** That is precisely why OTA works: no
amount of screen, feature or theme work changes the runtime version.

**Several innocuous-looking files are.** Editing `eas.json`, adding a
`package.json` **script**, changing `.gitignore`, or replacing an app icon each
orphans every already-installed build. Batch such edits and follow them with a
build, rather than discovering it after a failed publish.

### The `extra` trap specifically

`app.config.ts` `extra` is a fingerprint input by default — and `extra` is where
the per-publish policy lives. Without intervention, each policy value yields its
own runtime version, and the update reaches nobody.

`fingerprint.config.js` sets `sourceSkips: ['ExpoConfigExtraSection']`, which
makes every policy value hash the same. **Deleting that file silently breaks
every forced update and every OTA ordinal.** Typecheck, lint, the bundler and
`expo export` are identically green either way; `src/lib/updates/updates.test.ts`
is the only thing in the repo that can see it.

### Checking before you publish

```bash
eas fingerprint:compare --build-id <the build you expect to update>
```

**Read its output carefully.** It prints `new directory: ios` on any machine
that has run `expo run:ios`, compared against a build that has not. That line is
**cosmetic**: this is a CNG project, so `@expo/fingerprint` resolves the workflow
as `managed` and the entry carries `hash: null` — it contributes nothing. Look
further up the diff for the real cause.

Fingerprints also differ between iOS and Android. That is normal.

---

## Trap 2 — updates are pull, never push

A device learns an update exists only when it asks, and it asks on exactly two
occasions:

1. **Cold start** — `checkAutomatically: 'ON_LOAD'`. Native, before any
   JavaScript runs.
2. **Foreground** — the `AppState` listener in `src/lib/updates`, throttled to
   one check a minute.

**There is no way to push a bundle at a device.** Adoption tracks how often
people open the app, and the tail runs to days. Never design a feature, or a
fix, on the assumption that everyone is on the newest bundle.

If you genuinely need to push, that is a silent push notification waking the app
to check — a different mechanism, built on `expo-notifications`.

A practical consequence when testing: a **silent** update needs **two cold
starts**. The first downloads it; the second runs it. One relaunch showing the
old code is correct behaviour, not a failure.

---

## Choosing how an update lands

| | `silent` (default) | `forced` |
|---|---|---|
| User sees | nothing | a banner they must act on |
| Runs at | next cold start | as soon as they tap Restart |
| Use for | everything | crash loops, broken submit, bad data being written |

```bash
pnpm ota:production        -m "message"
pnpm ota:forced:production -m "message"
```

### How the running app learns the policy

This is the mechanism worth understanding before extending any of it.

`checkForUpdateAsync()` returns the incoming update's **manifest before
downloading it**, and that manifest carries the publishing app config under
`extra.expoClient` — `expo-manifests` types the field as a full `ExpoConfig`. So
a per-publish value in `extra` is readable by the bundle that is *already
running*. It is the only channel through which a shipped binary can learn
anything about an update it has not installed.

`readUpdatePolicy` resolves anything unrecognised to `silent`, deliberately and
asymmetrically. A wrong answer that way shows nothing to a user who did not need
interrupting; a wrong answer the other way puts an undismissable banner in front
of everyone, and the only way back is another update.

Adding a third tier means touching exactly three places: the `UpdatePolicy`
union, `POLICIES`, and `update-banner.tsx`. Nothing else should know those
strings.

### `forced` has a real cost

It restarts the JS runtime immediately, discarding whatever the user was doing —
unsaved input, an in-flight recording, an open flow. Use it when the thing being
fixed is worse than that.

---

## Versioning: what increments, what resets

Three numbers. Confusing them is how a support conversation goes wrong.

| Number | Example | Changes when | Lives in |
|---|---|---|---|
| App version | `1.0.0` | you decide to call it a new release | the binary |
| Build number | `(12)` | every EAS build (`autoIncrement`) | the binary |
| OTA ordinal | `OTA 3` | every OTA publish | the bundle |

Settings shows all three.

**It increments on every publish to the same binary.** `scripts/ota-publish.mjs`
counts the update groups already published to the current runtime version and
adds one. There is no counter to maintain — no file to bump, nothing to forget.

**It resets on every new binary, by itself.** This is the part worth
understanding, because it takes no discipline at all: `runtimeVersion` is a
fingerprint of the native project, so a new build *is* a new runtime version and
the count starts at zero on its own. Ship to the store, and the next publish is
`OTA 1` again. **The same mechanism that decides which binaries an update may
reach also partitions the numbering.**

A consequence, and it is correct: a rebuild that changes the fingerprint
*without* a store release — a new dependency, an `eas.json` edit — also resets
the count. The ordinal means "how many updates has *this binary* received".

**So the ordinal is not unique on its own.** `OTA 3` on build 12 is a different
bundle from `OTA 3` on build 13, which is why Settings prints the app version
beside it and the channel with it.

**It will not invent a number.** If the count cannot be established — expired
token, network blip, CLI schema change — the script publishes anyway with **no
ordinal**, and the app falls back to the update id. A branch that verifiably does
not exist is the one real zero; everything else is *unknown*. A hotfix must never
be blocked by bookkeeping, and two updates both calling themselves `OTA 4` is
worse than neither having a name.

### The app version is deliberately not OTA-updatable

It is tempting to read `Constants.expoConfig.version`, which comes from the
manifest and would appear to follow a publish. Two reasons not to:

1. **It cannot move.** `version` is part of `expoConfig`, a fingerprint input, so
   bumping it changes the runtime version and the update reaches no existing
   build.
2. **If you defeated that** — `sourceSkips: ['ExpoConfigVersions']` would — the
   number would then **lie**. The binary on the phone is still 1.0.0 whatever the
   manifest says, and a version that disagrees with the store is worse than no
   version, because support will trust it.

So `describeBuild()` reads the version from `expo-application` (the installed
binary) and the ordinal from `Constants.expoConfig` (the running bundle). Same
screen, two sources, because they are facts about two different things.

### Viewing

```bash
eas update:list --branch production                          # all, newest first
eas update:list --branch production --runtime-version <rtv>  # one binary's sequence
eas build:list --limit 5                                     # a build's runtime version
```

The `runtimeVersion` column is the grouping. A change in it is where a reset
happened.

---

## Publishing

```bash
pnpm ota:preview            -m "message"
pnpm ota:production         -m "message"
pnpm ota:forced:preview     -m "message"
pnpm ota:forced:production  -m "message"
```

> **`--environment` is not optional.** SDK 55+ requires it on `eas update`, and
> it is what loads the EAS environment variables into the bundle. Publish
> without it and `EXPO_PUBLIC_*` values are undefined, `src/lib/env` throws at
> module load, and the app **hard-crashes on launch** for everyone who receives
> it. The scripts exist so nobody types it by hand. Check with
> `eas env:list --environment production` before the first production publish.

---

## Rolling out gradually

```bash
eas update --channel production --environment production --rollout-percentage 10 -m "..."
eas update:edit --rollout-percentage 50
eas update:revert-update-rollout          # abandon; users return to the previous update
```

One rollout per branch at a time.

**Worth it for:** new or rewritten data paths, a dependency behaving differently
at runtime than in tests, and the first update after a native build where the
fingerprint pairing is unproven.

**Not worth it for:** copy and layout fixes — a 10% rollout of a typo fix costs a
day of attention and tells you nothing. And **actively wrong** for a fix to
something already broken in production: gradual means 90% of users stay broken
while you watch.

### Promoting a whole branch

```bash
eas channel:rollout production --action create --branch release-1.1 --percent 10
eas channel:rollout production --action edit   --percent 50
eas channel:rollout production --action end    --outcome republish-and-revert
```

`republish-and-revert` keeps the new branch's updates by republishing them onto
the old branch; `revert` discards them. While a branch rollout is active,
publish with `--branch`, not `--channel`.

---

## Measuring

Needs `eas-cli >= 18.8.0`; pin `cli.version` in `eas.json` accordingly.

```bash
GROUP=$(eas update:list --branch production --json --non-interactive | jq -r '.currentPage[0].group')

eas update:insights "$GROUP" --json --non-interactive \
  | jq '.platforms[] | {platform, installs: .totals.installs, crashRate: .totals.crashRatePercent}'

eas channel:insights --channel production --runtime-version <rtv>   # embedded vs OTA
```

| Signal | Read it as |
|---|---|
| Crash rate at or below the previous update's | Widen the rollout |
| Crash rate up, both platforms | Revert the rollout, then investigate |
| Crash rate up, one platform only | Almost always a native pairing problem — check the fingerprint before blaming the JavaScript |
| Installs flat at zero after hours | Not a code problem. A fingerprint mismatch — it is reaching nobody |

**What the numbers are not.** "Installs" are downloads, not runs — a confirmed
launch registers on the device's *next* check, up to 24h later. Crashes are
self-reported on that same next check, so a crash that stops the app from ever
checking again never appears: the figure is a **floor**. Fresh publishes read
zero while the pipeline catches up, and unique users can double-count across
platforms.

So judge a rollout on **shape** — a spike, one platform diverging — never on an
absolute number in the first hour. A clean crash rate ten minutes after
publishing is not a green light; there is barely any data in it.

The **`expo:eas-update-insights` skill** carries the full JSON schemas, the `jq`
filters and these caveats. Load it rather than reconstructing them.

---

## Rolling back

Four tools, not interchangeable.

```bash
eas channel:pause production        # 1. stop new devices receiving anything
eas channel:resume production

eas update:rollback                 # 2. interactive: pick a known-good update
eas update:republish --branch production --group <good-id>

eas update:roll-back-to-embedded --channel production   # 3. back to the binary's own JS

eas update:revert-update-rollout    # 4. abandon a percentage rollout
```

**A rollback is itself an update.** It propagates at the same pull-based pace and
is not a kill switch. It cannot save someone whose app crashes before it can
check for updates.

### The automatic protection, and its limit

If an update crashes **before the first frame renders**, `expo-updates` marks it
failed, gives itself five seconds to fetch a replacement, and otherwise rolls
back to the last update that worked. Automatic, and the reason a bad bundle
cannot permanently brick the app.

If it crashes **after** the first frame, there is no automatic rollback — the app
simply crashes. **That is the more common case**, and it is what the commands
above exist for.

Never set `disableAntiBrickingMeasures`.

### Incident order

1. `eas channel:pause production` — stop the spread
2. `eas update:insights <group>` — confirm it is the update, and which platform
3. `eas update:rollback` — put a known-good bundle back
4. `eas channel:resume production` — start serving it
5. **Only now** work out what happened

Step 1 before step 5. The rollback still propagates at pull speed, so every
minute spent diagnosing first is a minute more devices pick up the bad bundle.

---

## When to ship a binary instead

The fingerprint already forces a build for any dependency, `app.config.ts`,
permission, plugin, icon or SDK change. Beyond what it forces:

- **The change needs a version number a user can report.** Updates have no
  version anyone can see. A support conversation is much harder when three people
  on 1.0.0 are running three different bundles.
- **You want the store's own staged rollout**, with its crash reporting and
  review attached.
- **It touches payments, permission prompts, or account deletion.** Not because
  it is disallowed — because you want the paper trail.
- **The same problem is on its second OTA attempt** — the first one rolled
  back. Two failed attempts is a signal the problem is not in JavaScript.

### Store policy

Apple permits JavaScript OTA updates: the JS calls only native APIs audited at
submission, and the native layer never changes. What Apple acts on is apps that
**generate and execute code** to change their own behaviour at runtime, which is
a different thing.

**The line that matters: an update must not change what the app is for.** Fix
bugs, ship features that belong to the reviewed product. Never use an update to
reveal functionality that was hidden during review. Google's position is
equivalent.

---

## Testing it for the first time

`Updates.isEnabled` is **false in every development build**, so none of this can
be exercised locally by default — `expo-updates` is compiled out unless
`updatesNativeDebug` is set in `Podfile.properties.json`. Do not read "the banner
never appears" in a dev build as a wiring bug; it is the expected outcome.

Against a real internal/TestFlight build:

1. `pnpm ota:forced:preview -m "forced test"` → foreground the app. The banner
   should appear; tapping it restarts into the new bundle.
2. `pnpm ota:preview -m "silent test"` → **two** cold starts. Make it a visibly
   different build so you can tell.
3. `eas update:insights <group>` → confirm installs and crash rate report.
4. Publish something deliberately broken to `preview` and practise
   `eas channel:pause` + `eas update:rollback`. The rollback path is the one you
   want muscle memory for, and preview is the only place it is free to get wrong.

---

## Files

| Path | Role |
|---|---|
| `fingerprint.config.js` | What may move the runtime version. **Do not delete.** |
| `app.config.ts` | `updates`, `runtimeVersion`, `extra.updatePolicy`, `extra.otaBuild` |
| `src/lib/updates/index.ts` | `useOTAUpdates`, `readUpdatePolicy`, `updateInfo` |
| `src/components/updates/update-banner.tsx` | What `forced` looks like |
| `src/components/updates/build-info.tsx` | `describeBuild()` — version and ordinal |
| `scripts/ota-publish.mjs` | Publish + ordinal |
| `jest.setup.js` | `expo-updates` and `expo-haptics` mocks |
