# App plan

> Fill this in **before** creating anything under `src/app`.
>
> Auth gating is structural in Expo Router. Moving a screen between `(auth)`
> and `(app)` later means rewriting guards, imports, and every navigation
> target that points at it. Ten minutes here saves a day of restructuring.
>
> Delete the example rows once yours replace them.

## What this app is

_One or two sentences. What does someone use it for, and what is the single
thing they do most often? The answer usually decides what the first tab is._

## Screens

Auth values: `out` (signed out only) · `in` (signed in only) · `any`

| Route | Screen | Auth | Presentation | Notes |
|---|---|---|---|---|
| `/` | Home | in | tab | Must be `index` — see trap 1 in CLAUDE.md |
| `/search` | Search | in | tab | |
| `/settings` | Settings | in | tab | Adapt the shipped one |
| `/sign-in` | Sign in | out | stack | |
| `/post/[id]` | Post detail | in | push | |
| `/compose` | Compose | in | modal | Full-screen on Android |
| `/filters` | Filters | in | formSheet | Max 3 detents on Android |
| `/confirm-delete` | Confirm | in | transparentModal | A dialog as a route |

## Tabs

Native tab bars are static — tabs cannot be added or removed at runtime.

| Order | Route | Label | SF Symbol (iOS) | Material (Android) |
|---|---|---|---|---|
| 1 | `index` | Home | `house` / `house.fill` | `home` |
| 2 | `search` | Search | `magnifyingglass` | `search` |
| 3 | `settings` | Settings | `gearshape` / `gearshape.fill` | `settings` |

_A centre "+" that opens a modal instead of switching tabs is a `kind: 'action'`
tab — see `TabConfig`._

## Guards

```
(auth)  guard={!isAuthenticated}   sign-in, sign-up, reset password
(app)   guard={isAuthenticated}    everything else
```

_Add an onboarding tier only if signed-in-but-incomplete is a real state:_

```
guard={isAuthenticated && !onboardingComplete}   (onboarding)
guard={isAuthenticated && onboardingComplete}    (app)
```

## Folder structure

```
src/app/
├─ _layout.tsx              providers + guards
├─ (auth)/
│  └─ sign-in.tsx
└─ (app)/
   ├─ _layout.tsx           stack: tabs + all presentations
   ├─ (tabs)/
   │  ├─ _layout.tsx        AppTabs config
   │  ├─ index.tsx          MUST exist — resolves '/'
   │  ├─ search.tsx
   │  └─ settings.tsx
   ├─ post/[id].tsx
   ├─ compose.tsx
   └─ filters.tsx
```

## Release identifiers

Decide these **here**, at plan time. Every one of them becomes permanent the
moment a store record exists against it, and the bundle id is unique across
every developer team in the world. Where each is set, and who owns it, is in
`docs/release-pipeline.md`.

| Identifier | Value | Where it lives |
|---|---|---|
| Bundle id / Android package (same string) | `com.example.myapp` | `app.config.ts` → `ios.bundleIdentifier`, `android.package` |
| URL scheme | `myapp` | `app.config.ts` → `scheme` |
| EAS owner (the org account, not a person) | `<EAS_OWNER>` | `app.config.ts` → `owner` — before `eas init` |
| EAS slug | `myapp` | `app.config.ts` → `slug` |
| EAS project id | `<EAS_PROJECT_ID>` | `app.config.ts` → `extra.eas.projectId`, `updates.url` — printed by `eas init` |
| Apple Developer team id | `<APPLE_TEAM_ID>` | `eas.json` → `submit.*.ios.appleTeamId` |
| App Store Connect app id | `<ASC_APP_ID>` | `eas.json` → `submit.*.ios.ascAppId` — exists only once the ASC record does |
| TestFlight internal group | `<TESTFLIGHT_INTERNAL_GROUP>` | `eas.json` → `submit.preview.ios.groups` — a group **without** automatic distribution |
| Play package | same as the bundle id | Play Console, on app creation |

_No persona, role or environment segment on the base id. One app carries every
profile; a suffix on a shipped id cannot be undone. `pnpm check:release` fails
while any of these is still a placeholder._

## Deep links

Scheme is set in `app.config.ts`. List anything reachable from outside the app —
push notification targets, shared URLs, OAuth callbacks. These must work in
**every** auth state: a signed-out user opening a protected deep link should
land on sign-in and ideally resume afterwards.

| Link | Route | Signed-out behaviour |
|---|---|---|
| `myapp://post/123` | `/post/[id]` | Stash, sign in, resume |

## Data

| Screen | Source | Cache |
|---|---|---|
| Home | `GET /feed` | Query, 5 min stale |
| Post detail | `GET /posts/:id` | Query, seeded from feed |
| Compose | `POST /posts` | Mutation, invalidates feed |

_Server state → TanStack Query. Client/UI state → Zustand. Never both._

## Permissions

Only list what the app genuinely uses — delete the rest of the plugins and
packages before shipping.

| Permission | Why | When requested |
|---|---|---|
| Notifications | Reply alerts | After first post, not at launch |
| Photos | Attach images | On tapping attach |

_Never request at launch. Ask in context, at the moment the value is obvious._
