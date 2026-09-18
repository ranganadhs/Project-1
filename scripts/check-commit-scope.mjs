#!/usr/bin/env node
/**
 * Fails when a COMMIT imports a file that commit does not contain.
 *
 * WHY THIS EXISTS: a commit can be internally incomplete — it stages a file
 * whose imports point at a sibling that was never staged, or lands before the
 * commit that adds its dependency. The working tree still builds, so nothing
 * local complains, and the break only appears for whoever checks that commit
 * out: a fresh clone, a `git bisect`, or a reviewer reading one commit.
 *
 * THE PRE-COMMIT HOOK CANNOT SEE THIS, and that is the whole point. Read
 * `lefthook.yml`: `typecheck` runs `pnpm typecheck`, which reads the WORKING
 * TREE, and `lint` passes the staged file LIST to eslint, which then also reads
 * the working tree. Both are green on a commit that is already broken, because
 * the missing file is sitting on disk unstaged. The two usual shapes: committed
 * files importing a helper that was never staged, and a feature commit
 * importing a module that arrives in the NEXT commit.
 *
 * IT IS NOT A PRE-COMMIT HOOK and cannot be wired as one: it inspects commits,
 * which do not exist until after the hook has run. Run it on HEAD after
 * committing, or over a range in CI. Do not move it into lefthook and conclude
 * it is broken.
 *
 * WHAT IT DOES NOT DO: this resolves module specifiers, it does not typecheck.
 * A commit can pass here and still fail `tsc` for an unrelated reason. It
 * answers exactly one question — is this commit self-contained?
 *
 *   node scripts/check-commit-scope.mjs                  # HEAD alone
 *   node scripts/check-commit-scope.mjs HEAD~5..HEAD     # a range
 *   node scripts/check-commit-scope.mjs origin/main..HEAD
 */
import { execFileSync } from 'node:child_process';
import { posix } from 'node:path';

/** Only `@/*` is aliased — see tsconfig's `paths`. Keep the two in step. */
const ALIAS = { '@/': 'src/' };

/**
 * Extension-less specifiers are the norm in this codebase, so a hit has to be
 * tried against every form the bundler and tsc would accept, including the
 * directory-index forms the `components/ui` and `components/native` barrels
 * rely on.
 */
const RESOLUTIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js'];

const SOURCE = /\.(ts|tsx|js|jsx|mjs)$/;

/**
 * `from '…'` covers imports AND re-exports — the barrels are the second form,
 * and a barrel re-exporting a file that was never staged is the exact shape
 * this script exists to catch. The other two forms are lazy imports and the
 * occasional CommonJS require in config-adjacent code.
 */
const SPECIFIERS = [/\bfrom\s+'([^']+)'/g, /\bimport\(\s*'([^']+)'\s*\)/g, /\brequire\(\s*'([^']+)'\s*\)/g];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function commitsIn(range) {
  return git('rev-list', '--reverse', range).split('\n').filter(Boolean);
}

/** Every blob in the commit, as `path -> sha`. */
function treeOf(commit) {
  const entries = new Map();
  for (const line of git('ls-tree', '-r', commit).split('\n')) {
    if (!line) continue;
    const [meta, path] = line.split('\t');
    const [, type, sha] = meta.split(/\s+/);
    if (type === 'blob') entries.set(path, sha);
  }
  return entries;
}

/**
 * Read many blobs in ONE `git cat-file --batch`, rather than spawning `git
 * show` per file. On a repo this size that is the difference between a second
 * and a minute, which decides whether anyone actually runs it.
 */
function readBlobs(shas) {
  if (shas.length === 0) return new Map();
  const raw = execFileSync('git', ['cat-file', '--batch'], {
    input: `${shas.join('\n')}\n`,
    maxBuffer: 256 * 1024 * 1024,
  });

  const contents = new Map();
  let offset = 0;
  while (offset < raw.length) {
    const newline = raw.indexOf('\n', offset);
    if (newline === -1) break;
    const [sha, , size] = raw.toString('utf8', offset, newline).split(' ');
    const start = newline + 1;
    const end = start + Number(size);
    contents.set(sha, raw.toString('utf8', start, end));
    offset = end + 1; // trailing newline after the payload
  }
  return contents;
}

/** `@/x` and `./x` resolve against the tree; bare specifiers are dependencies. */
function resolve(specifier, fromPath, tree) {
  let base;
  for (const [prefix, replacement] of Object.entries(ALIAS)) {
    if (specifier.startsWith(prefix)) base = replacement + specifier.slice(prefix.length);
  }
  if (base === undefined) {
    if (!specifier.startsWith('.')) return null; // node_modules — not our problem
    base = posix.normalize(posix.join(posix.dirname(fromPath), specifier));
  }
  return RESOLUTIONS.some((extension) => tree.has(base + extension)) ? null : base;
}

function checkCommit(commit) {
  const tree = treeOf(commit);
  /*
   * `scripts/` is excluded for two reasons, and the second one is a real limit
   * of this approach. They are node tooling rather than part of the app's
   * module graph, so a broken import there fails loudly the moment anyone runs
   * the script. And extraction is regex-based, which cannot tell code from a
   * STRING containing code — `check-contrast.mjs` builds a snippet that embeds
   * `import {colorLight} from './src/theme/themes/color-light';` as text, which
   * would report as a missing file on every commit. A false positive here is
   * worse than a gap: a checker that cries wolf stops being run.
   *
   * `.claude/` and `.agents/` hold VENDORED third-party agent skills, pinned by
   * `skills-lock.json` and refreshed by their own tools. Their example scripts
   * carry placeholder paths (`./ComponentName`) that are documentation, not
   * imports, and none of it is part of the app's module graph.
   */
  const VENDORED = ['scripts/', '.claude/', '.agents/'];
  const sources = [...tree].filter(
    ([path]) => SOURCE.test(path) && !VENDORED.some((prefix) => path.startsWith(prefix)),
  );
  const contents = readBlobs(sources.map(([, sha]) => sha));

  const failures = [];
  for (const [path, sha] of sources) {
    const source = contents.get(sha) ?? '';
    for (const pattern of SPECIFIERS) {
      for (const [, specifier] of source.matchAll(pattern)) {
        const missing = resolve(specifier, path, tree);
        if (missing) failures.push({ path, specifier });
      }
    }
  }
  return failures;
}

const range = process.argv[2];
const commits = range ? commitsIn(range) : [git('rev-parse', 'HEAD').trim()];

let broken = 0;
for (const commit of commits) {
  const subject = git('log', '-1', '--format=%s', commit).trim();
  const failures = checkCommit(commit);
  const short = commit.slice(0, 7);

  if (failures.length === 0) {
    console.log(`  ✓ ${short}  ${subject}`);
    continue;
  }

  broken += 1;
  console.log(`  ✗ ${short}  ${subject}`);
  for (const { path, specifier } of failures) {
    console.log(`      ${path}`);
    console.log(`        imports '${specifier}' — not present in this commit`);
  }
}

if (broken > 0) {
  console.error(
    `\n${broken} of ${commits.length} commit(s) import files they do not contain.\n` +
      `Each one builds in your working tree and breaks for anyone who checks it out.\n` +
      `Usually the fix is to stage the missing file, or to reorder so the commit\n` +
      `that ADDS a dependency lands before the commit that imports it.`,
  );
  process.exit(1);
}

console.log(`\n✓ ${commits.length} commit(s) self-contained — every import resolves within its own tree.`);
