#!/usr/bin/env node
/**
 * Publishes an OTA update, stamped with a sequence number a human can say out
 * loud.
 *
 * ── THE PROBLEM THIS SOLVES ───────────────────────────────────────────────
 *
 * EAS has no "OTA version". An update is identified by a UUID and a timestamp,
 * which are exact and unusable in a sentence: nobody reports "I'm on
 * 3f9a1c2d-4b17-…". So this computes a small ordinal — OTA 1, OTA 2 — and
 * passes it into the bundle through `extra.otaBuild`, where the running app
 * reads it back out of its own manifest.
 *
 * ── THE TWO RULES, AND WHY ONLY ONE NEEDED CODE ───────────────────────────
 *
 * INCREMENT on every publish to the same binary. That is what this script does:
 * it counts the update groups already published to the current runtime version
 * and adds one.
 *
 * RESET on every store submission. **This needs no code at all**, and that is
 * the part worth understanding. `runtimeVersion` is a fingerprint of the native
 * project, so a new binary is a new runtime version, and the count of updates
 * published to it starts at zero on its own. The reset is not a convention
 * anyone has to remember — it falls out of the thing that already decides which
 * binaries an update may reach.
 *
 * A consequence: a rebuild that changes the fingerprint WITHOUT a store release
 * (a new dependency, an `eas.json` edit) also resets the count. That is correct.
 * The number means "how many updates has THIS binary received", and that is a
 * different binary.
 *
 * ── IT WILL NOT INVENT A NUMBER ───────────────────────────────────────────
 *
 * If the count cannot be established, this publishes ANYWAY with no number
 * rather than guessing — the app then falls back to showing the update id. A
 * hotfix must never be blocked by a bookkeeping failure, and two updates both
 * calling themselves "OTA 4" is worse than neither having a name, for the same
 * reason a version that disagrees with the binary is worse than no version.
 */
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);

const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};

const channel = flag('--channel');
const environment = flag('--environment');
const forced = argv.includes('--forced');
const message = flag('-m') ?? flag('--message');

if (!channel || !environment) {
  console.error('usage: ota-publish --channel <c> --environment <e> [--forced] -m "message"');
  process.exit(1);
}
if (!message) {
  // Not optional, deliberately. The message is the only human-readable record
  // of what an update contained, and it is what `eas update:list` shows you at
  // three in the morning.
  console.error('A message is required. What changed?');
  process.exit(1);
}

/** Runs eas and parses JSON, returning null rather than throwing. */
const easJson = (args) => {
  const run = spawnSync('npx', ['eas-cli', ...args, '--json', '--non-interactive'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (run.status !== 0) return null;
  const match = run.stdout.match(/[{[][\s\S]*[}\]]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

/**
 * The runtime version this publish will land on.
 *
 * iOS is used as the reference even though the two platforms fingerprint
 * differently: `eas update` publishes both in ONE group, so the group count is
 * the same either way, and one number for both is what a human wants.
 */
const fingerprint = easJson(['fingerprint:generate', '-p', 'ios', '--environment', environment]);
const runtimeVersion = fingerprint?.hash ?? null;

/** The branch this channel points at. Absent until the first publish. */
const resolveBranch = () => {
  const view = easJson(['channel:view', channel]);
  const mapped = view?.updateBranches?.[0]?.name;
  // With no mapping yet, `eas update --channel X` creates a branch named after
  // the channel — so that is the right name to count against.
  return mapped ?? channel;
};

/**
 * Does this branch exist at all?
 *
 * This is what separates "genuinely nothing published yet, so the answer is
 * ZERO" from "the lookup failed, so the answer is UNKNOWN". Without it the very
 * first update on a branch is indistinguishable from a network blip — and the
 * safe handling of a blip, publishing with no number, would then permanently
 * cost the first update its ordinal and start the sequence at 2.
 *
 * `branch:list` is a different call from `update:list`, so a null from one and
 * a null from the other genuinely do mean different things.
 *
 * Returns null if even this cannot be established, which stays UNKNOWN.
 */
const branchExists = (branch) => {
  const list = easJson(['branch:list']);
  if (list === null) return null;
  const rows = Array.isArray(list) ? list : (list.currentPage ?? []);
  return rows.some((b) => b?.name === branch);
};

/**
 * Update groups already published to this runtime version, paginated.
 *
 * Returns a count, or **null for UNKNOWN** — and the difference is the whole
 * point of this number.
 *
 * `easJson` returns null for everything: an expired token, a network blip, an
 * `eas-cli` schema change, or JSON this parser does not recognise. Counting any
 * of those as zero stamps `OTA 1` on a runtime version that may already have
 * several, which is precisely the "two updates both calling themselves OTA 4"
 * this file exists to prevent. Only a branch that verifiably does not exist is
 * a real zero.
 *
 * The asymmetry is deliberate, and it matches `readUpdatePolicy` resolving
 * anything unrecognised to `silent`. A missing number costs a user nothing. A
 * wrong one is indistinguishable from a real one forever.
 */
const countExisting = (branch) => {
  if (!runtimeVersion) return null;

  const exists = branchExists(branch);
  if (exists === null) return null;
  // Nothing has ever been published here. A genuine zero, so the first update
  // gets to be OTA 1 rather than losing its ordinal to caution.
  if (exists === false) return 0;

  const LIMIT = 50;
  let offset = 0;
  let total = 0;

  // Bounded so a pagination bug cannot spin forever. 50 pages is 2500 updates
  // to one binary, which would mean something else has gone wrong.
  for (let page = 0; page < 50; page += 1) {
    const result = easJson([
      'update:list',
      '--branch',
      branch,
      '--runtime-version',
      runtimeVersion,
      '--limit',
      String(LIMIT),
      '--offset',
      String(offset),
    ]);

    // The branch exists, so this is a failure rather than an empty list. Give
    // up on the whole count rather than reporting a partial one as complete.
    if (result === null) return null;

    const rows = result.currentPage ?? [];
    total += rows.length;
    if (rows.length < LIMIT) return total;
    offset += LIMIT;
  }
  return total;
};

const branch = resolveBranch();
const existing = countExisting(branch);
const otaBuild = existing === null ? null : existing + 1;

if (otaBuild === null) {
  console.warn(
    '! Could not determine the OTA number — publishing without one.\n' +
      '  The app will show the update id instead. Nothing is broken; the\n' +
      '  sequence resumes on the next publish that can count.',
  );
} else {
  console.log(`→ OTA ${otaBuild} on ${channel} (runtime ${runtimeVersion?.slice(0, 8)}…)`);
  if (otaBuild === 1) {
    console.log('  First update to this binary. The count reset because the fingerprint changed.');
  }
}

const publish = spawnSync(
  'npx',
  ['eas-cli', 'update', '--channel', channel, '--environment', environment, '-m', message],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      APP_UPDATE_POLICY: forced ? 'forced' : 'silent',
      ...(otaBuild === null ? {} : { APP_OTA_BUILD: String(otaBuild) }),
    },
  },
);

process.exit(publish.status ?? 1);
