# App plan

> Fill this in **before** creating anything under `src/app`.
>
> Auth gating is structural in Expo Router. Moving a screen between
> `(auth)` and `(app)` later means rewriting guards, imports, and every
> navigation target that points at it. Ten minutes here saves a day of
> restructuring.

## What this app is

Lumen is a local-first, on-device AI study tutor. A student picks a free
Gemma model once (the "model downloaded" gate below), then every chat,
diagram, and quiz runs fully offline on-device — no account, no server, no
student data leaving the phone. The thing someone does most often is open
the Learn tab and start or resume a chat session, which is why it is the
first tab.

## Guards

This app has no real authentication — "No account" is a selling point in
the spec doc. The structural `(auth)/(app)` split from the boilerplate is
repurposed as a **first-run gate on model readiness**, not sign-in:

```
(onboarding)  guard={!hasModel}   model-setup (pick + download a model)
(app)         guard={hasModel}    everything else — the 4 tabs + pushed screens
```

`hasModel` is a Zustand client-state flag (`src/lib/model/` — new, not
server state), persisted in MMKV once a model finishes downloading.
Flipping it on download-complete is what drives the guard, the same way
`isAuthenticated` does today. No `(auth)` group, no `AuthAdapter` swap
needed for this app; `src/lib/auth` stays in the template unused unless a
future version adds real accounts.

## Screens

Auth values here mean: `out` (model not yet downloaded) · `in` (model
ready) · `any`.

| Route | Screen | Auth | Presentation | Notes |
|---|---|---|---|---|
| `/model-setup` | Model Setup | out | tab-equivalent (only screen in the group) | Pick Lite/Balanced/Deep, background download. pen.dev screen 1 |
| `/` | Learn (Home) | in | tab | Must be `index`. Ask bar, continue-session card, recent sessions. pen.dev screen 2 |
| `/sessions` | Sessions | in | tab | Full session list with filters. pen.dev screen 3 (list) |
| `/quizzes` | Quizzes | in | tab | Streak card, ready-to-review + completed quizzes. pen.dev screen 4 (list) |
| `/settings` | Settings | in | tab | Theme switch (light/dark/system), model management, privacy. Adapt the shipped one. pen.dev screen 5 |
| `/session/[id]` | Chat with Diagram | in | push | Conversation + inline diagram + quick-check prompt. pen.dev screen 6 |
| `/session/[id]/quiz/[quizId]` | Quiz runner | in | push | Multi-question-type flow: multiple choice, match pairs, (label diagram later). pen.dev screens 7–8 |
| `/session/[id]/quiz/[quizId]/results` | Results & Mastery | in | fullScreenModal | Score ring, breakdown, concept mastery, must act (Review/Next) before dismissing. pen.dev screen 9 |

_No `/compose`, `/filters`, `/confirm-delete`, `/post/[id]` — those were
boilerplate-demo routes with no Lumen equivalent; deleted in the scaffold
step, not adapted._

## Tabs

Native tab bars are static — tabs cannot be added or removed at runtime.

| Order | Route | Label | SF Symbol (iOS) | Material (Android) |
|---|---|---|---|---|
| 1 | `index` | Learn | `sparkles` | `auto_awesome` |
| 2 | `sessions` | Sessions | `message` / `message.fill` | `chat_bubble` |
| 3 | `quizzes` | Quizzes | `questionmark.circle` / `.fill` | `quiz` |
| 4 | `settings` | Settings | `gearshape` / `gearshape.fill` | `settings` |

No centre "+" action tab — the primary create action (new chat) lives in
the Learn tab's ask bar, not the tab bar itself, matching the pen.dev
design.

## Folder structure

```
src/app/
├─ _layout.tsx                         providers + guards
├─ (onboarding)/
│  └─ model-setup.tsx
└─ (app)/
   ├─ _layout.tsx                      stack: tabs + pushed screens
   ├─ (tabs)/
   │  ├─ _layout.tsx                   AppTabs config
   │  ├─ index.tsx                     MUST exist — resolves '/'. Learn
   │  ├─ sessions.tsx
   │  ├─ quizzes.tsx
   │  └─ settings.tsx
   └─ session/
      └─ [id]/
         ├─ index.tsx                  Chat with Diagram
         └─ quiz/
            └─ [quizId]/
               ├─ index.tsx            Quiz runner (MC + match pairs)
               └─ results.tsx          fullScreenModal
```

## Release identifiers

Decide these **here**, at plan time. Every one of them becomes permanent
the moment a store record exists against it, and the bundle id is unique
across every developer team in the world. Where each is set, and who owns
it, is in `docs/release-pipeline.md`.

| Identifier | Value | Where it lives |
|---|---|---|
| Bundle id / Android package (same string) | `<TBD — needs a real org domain>` | `app.config.ts` → `ios.bundleIdentifier`, `android.package` |
| URL scheme | `lumen` | `app.config.ts` → `scheme` |
| EAS owner (the org account, not a person) | `<EAS_OWNER>` | `app.config.ts` → `owner` — before `eas init` |
| EAS slug | `lumen` | `app.config.ts` → `slug` |
| EAS project id | `<EAS_PROJECT_ID>` | `app.config.ts` → `extra.eas.projectId`, `updates.url` — printed by `eas init` |
| Apple Developer team id | `<APPLE_TEAM_ID>` | `eas.json` → `submit.*.ios.appleTeamId` |
| App Store Connect app id | `<ASC_APP_ID>` | `eas.json` → `submit.*.ios.ascAppId` — exists only once the ASC record does |
| TestFlight internal group | `<TESTFLIGHT_INTERNAL_GROUP>` | `eas.json` → `submit.preview.ios.groups` |
| Play package | same as the bundle id | Play Console, on app creation |

_Still placeholders — this session is Android-focused theme/screen work,
not release prep. Fill these in before `pnpm check:release` needs to pass._

## Deep links

Scheme is `lumen://`. This app has no server-backed content to share, so
the only deep link worth wiring is resuming a specific session/quiz from a
notification (e.g. "your download finished" or a spaced-repetition nudge,
if added later).

| Link | Route | Signed-out (no model) behaviour |
|---|---|---|
| `lumen://session/abc123` | `/session/[id]` | Stash the id, show Model Setup, resume into the session once `hasModel` flips |

## Data

Everything is **local-only** — no `GET`/`POST` to a backend. Server state
(TanStack Query) does not apply here; this is 100% client/UI state.

| Screen | Source | Store |
|---|---|---|
| Model Setup | Download progress from the on-device model-fetch pipeline (`react-native-fs` → S3/HF CDN, per the architecture doc) | Zustand (`src/lib/model/`), persisted flag in MMKV |
| Learn / Sessions / Quizzes | Chat sessions, messages, quiz results | MMKV-backed Zustand store, keyed by session id (per the architecture doc §3.4) |
| Chat / Quiz runner | On-device LLM inference (LiteRT-LM / Gemma) | Not cached — generated live per message; session transcript persists to MMKV as it streams |

## Permissions

| Permission | Why | When requested |
|---|---|---|
| None at launch | — | — |

No permissions are requested for the core flow described in the
architecture doc (chat, quizzes, on-device inference). If a later version
adds PDF upload or web-link import, `expo-document-picker`/network access
would be added here — not before the feature exists.
