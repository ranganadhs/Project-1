#!/usr/bin/env node
/**
 * Fails when app code calls an Expo API the installed SDK has deprecated.
 *
 * WHY THIS EXISTS: several Expo modules moved to object-oriented APIs and now
 * guard the old entry points at RUNTIME — the call throws. The deprecated names
 * are still exported with valid type signatures, so `tsc` passes, lint passes,
 * the bundle builds, and the app crashes on device the first time the code path
 * runs. Nothing else in the toolchain can see it.
 *
 * Each affected module ships `build/legacyWarnings.d.ts` listing exactly which
 * exports are deprecated. This reads those lists and checks src/ against them.
 *
 * Matching is bound to the IMPORT ALIAS, not the bare method name. Several
 * modules share names like `requestPermissionsAsync`, so a file importing more
 * than one of them would otherwise report a deprecation from module A against a
 * call on module B.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MODULES_DIR = 'node_modules';
const SRC_DIR = 'src';

/** Every installed expo-* package that publishes a legacy-deprecation list. */
function findDeprecationLists() {
  const lists = new Map();
  for (const name of readdirSync(MODULES_DIR)) {
    if (!name.startsWith('expo')) continue;
    const file = join(MODULES_DIR, name, 'build', 'legacyWarnings.d.ts');
    if (!existsSync(file)) continue;

    const names = new Set(
      [
        ...readFileSync(file, 'utf8').matchAll(
          /export\s+declare\s+(?:function|const)\s+([A-Za-z0-9_]+)/g,
        ),
      ].map((match) => match[1]),
    );

    if (names.size > 0) lists.set(name, names);
  }
  return lists;
}

/**
 * Maps how a file imported each module:
 *   import * as Calendar from 'expo-calendar'  -> namespace 'Calendar'
 *   import { Camera } from 'expo-camera'       -> namespace 'Camera'
 *   import Foo from 'expo-x'                   -> namespace 'Foo'
 *   import { getEventsAsync } from 'expo-x'    -> bare name, called directly
 */
function resolveImports(content, moduleName) {
  const namespaces = [];
  const bare = new Set();
  const escaped = moduleName.replace(/[/\-]/g, (c) => `\\${c}`);
  const importRe = new RegExp(`import\\s+([^;]+?)\\s+from\\s+['"]${escaped}['"]`, 'g');

  for (const [, clause] of content.matchAll(importRe)) {
    const namespaceMatch = /^\*\s+as\s+([A-Za-z0-9_$]+)$/.exec(clause.trim());
    if (namespaceMatch) {
      namespaces.push(namespaceMatch[1]);
      continue;
    }
    const braced = /\{([^}]*)\}/.exec(clause);
    if (braced) {
      for (const raw of braced[1].split(',')) {
        const spec = raw.trim().replace(/^type\s+/, '');
        if (!spec) continue;
        const [imported, local] = spec.split(/\s+as\s+/).map((s) => s.trim());
        // A named import could be either a namespace object (Camera) or a
        // function; record it both ways and let the call site disambiguate.
        namespaces.push(local ?? imported);
        bare.add(local ?? imported);
      }
    }
    const defaultMatch = /^([A-Za-z0-9_$]+)(?:\s*,|$)/.exec(clause.trim());
    if (defaultMatch && !clause.trim().startsWith('{')) namespaces.push(defaultMatch[1]);
  }

  return { namespaces, bare };
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

const lists = findDeprecationLists();
const violations = [];

for (const file of walk(SRC_DIR)) {
  const content = readFileSync(file, 'utf8');

  for (const [moduleName, deprecated] of lists) {
    if (!content.includes(`'${moduleName}'`)) continue;
    const { namespaces, bare } = resolveImports(content, moduleName);
    if (namespaces.length === 0 && bare.size === 0) continue;

    content.split('\n').forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('import')) {
        return;
      }

      for (const name of deprecated) {
        const viaNamespace = namespaces.some((ns) =>
          new RegExp(`\\b${ns}\\.${name}\\s*\\(`).test(line),
        );
        const viaBare = bare.has(name) && new RegExp(`(?<![.\\w])${name}\\s*\\(`).test(line);

        if (viaNamespace || viaBare) {
          violations.push({ file, line: index + 1, module: moduleName, name, text: trimmed });
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error(`✗ ${violations.length} deprecated Expo API call(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.name}() is deprecated in ${v.module}`);
    console.error(`    ${v.text}\n`);
  }
  console.error(
    'These still typecheck but THROW at runtime. Check the module docs for the\n' +
      'replacement, or import the old API explicitly from "<module>/legacy".',
  );
  process.exit(1);
}

console.log(
  `✓ No deprecated Expo APIs in ${SRC_DIR}/ ` +
    `(checked ${lists.size} module(s): ${[...lists.keys()].join(', ')})`,
);
