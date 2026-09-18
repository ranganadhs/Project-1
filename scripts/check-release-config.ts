/**
 * Is this app configured to release?
 *
 * The template ships eas.json, the EAS workflows and the OTA wiring INERT: every
 * identifier that belongs to a real app is a placeholder. That is the right
 * shape for a template and the wrong shape for a build. A workflow that builds
 * for twenty minutes and then fails at "Prepare credentials: set ascAppId" has
 * spent minutes nobody wanted to pay for — and a preview build with the
 * template's bundle id would install over another app derived from the same
 * template on the same phone.
 *
 * So preview.yml and production.yml run this first, on a Linux worker, and stop
 * the run in seconds if anything below is still the template's. PR checks do
 * NOT run it: a fresh clone must stay green until someone decides to release.
 *
 * Run it locally with `pnpm check:release`. It is deliberately not a hook.
 *
 * Runs under tsx so it can import app.config.ts directly, the same file Expo
 * evaluates, rather than re-parsing it with a regex. app.config.ts imports only
 * a type from `expo/config`, so this is safe in plain Node.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import config from '../app.config';

type Problem = { where: string; what: string; source: string };

const problems: Problem[] = [];
const PLACEHOLDER = /<[A-Z][A-Z0-9_]*>/;

/** Identifiers the template ships with. Any of them in a release is a bug. */
const TEMPLATE_IDENTIFIERS = ['boilerplate', 'com.example.', 'example.com'];

const looksLikeTemplate = (value: unknown) =>
  typeof value === 'string' &&
  (PLACEHOLDER.test(value) ||
    TEMPLATE_IDENTIFIERS.some((needle) => value.toLowerCase().includes(needle)));

// ── app.config.ts ──────────────────────────────────────────────────────────

const appConfig = 'app.config.ts';

const owner = (config as { owner?: string }).owner;
if (!owner || looksLikeTemplate(owner)) {
  problems.push({
    where: appConfig,
    what: '`owner` is missing or a placeholder',
    source:
      'The EAS account (personal or organisation) the project lives under. Decide it BEFORE `eas init`; it is not a setting you change afterwards, it is a different project.',
  });
}

const projectId = (config.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
if (!projectId || looksLikeTemplate(projectId)) {
  problems.push({
    where: appConfig,
    what: '`extra.eas.projectId` is missing or a placeholder',
    source:
      '`eas init` prints it (it cannot write a dynamic config). Also visible on the project page at expo.dev.',
  });
}

const updatesUrl = config.updates?.url;
if (!updatesUrl || looksLikeTemplate(updatesUrl)) {
  problems.push({
    where: appConfig,
    what: '`updates.url` is missing or a placeholder',
    source: 'https://u.expo.dev/<the projectId above>. See docs/ota-updates.md.',
  });
} else if (projectId && !updatesUrl.endsWith(projectId)) {
  problems.push({
    where: appConfig,
    what: '`updates.url` does not end with `extra.eas.projectId`',
    source: 'They identify the same project; a mismatch publishes updates nobody receives.',
  });
}

for (const [key, value] of [
  ['name', config.name],
  ['slug', config.slug],
  ['scheme', config.scheme],
  ['ios.bundleIdentifier', config.ios?.bundleIdentifier],
  ['android.package', config.android?.package],
] as const) {
  if (!value || looksLikeTemplate(value)) {
    problems.push({
      where: appConfig,
      what: `\`${key}\` is missing or still the template's`,
      source:
        key === 'ios.bundleIdentifier' || key === 'android.package'
          ? 'Your reverse-DNS app id, the SAME string on both platforms. Permanent once an App Store Connect record or a Play upload exists. See docs/release-pipeline.md.'
          : 'Decided in docs/app-plan.md, step 2 of the build order.',
    });
  }
}

// ── eas.json ───────────────────────────────────────────────────────────────

const easJsonPath = resolve(process.cwd(), 'eas.json');
const easJson = JSON.parse(readFileSync(easJsonPath, 'utf8')) as {
  submit?: Record<string, Record<string, Record<string, unknown>>>;
};

const SUBMIT_SOURCES: Record<string, string> = {
  ascAppId:
    'App Store Connect → Apps → your app → App Information → "Apple ID" (a number). The app record must exist first.',
  appleTeamId: 'developer.apple.com → Membership details → Team ID (10 characters).',
  groups:
    'App Store Connect → TestFlight → Internal Testing group name. Automatic distribution must be OFF on that group for EAS to add builds to it.',
};

for (const [profile, platforms] of Object.entries(easJson.submit ?? {})) {
  for (const [platform, keys] of Object.entries(platforms)) {
    for (const [key, value] of Object.entries(keys)) {
      const values = Array.isArray(value) ? value : [value];
      if (values.some(looksLikeTemplate)) {
        problems.push({
          where: `eas.json → submit.${profile}.${platform}.${key}`,
          what: 'placeholder',
          source: SUBMIT_SOURCES[key] ?? 'See docs/release-pipeline.md.',
        });
      }
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────

if (problems.length === 0) {
  console.log('✓ Release configuration is filled in.');
  process.exit(0);
}

console.error(`✗ ${problems.length} release setting(s) still need a real value:\n`);
for (const problem of problems) {
  console.error(`  ${problem.where}\n    ${problem.what}\n    ← ${problem.source}\n`);
}
console.error('docs/release-pipeline.md walks through every one of these, in order.');
process.exit(1);
