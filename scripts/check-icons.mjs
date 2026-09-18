#!/usr/bin/env node
/**
 * Fails when an app icon asset would be rejected, or would render wrongly, on a
 * platform that nobody checks until the build is already in review.
 *
 * Reads the PNG header directly rather than decoding: bytes 16-23 are width and
 * height, big-endian, and byte 25 is the colour type, where 4 and 6 carry an
 * alpha channel. No dependency, no decode, runs in milliseconds.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

function png(file) {
  const buf = readFileSync(join(ASSETS, file));
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    hasAlpha: [4, 6].includes(buf[25]),
  };
}

const failures = [];
const fail = (message) => failures.push(message);

// ── iOS ────────────────────────────────────────────────────────────────────
// Apple requires 1024x1024. Expo flattens `light` and `tinted` onto white and
// preserves alpha only on `dark`, so the tinted art must be opaque — otherwise
// that forced white background becomes the icon.
for (const file of ['icon.png', 'ios-icon-dark.png', 'ios-icon-tinted.png']) {
  if (!existsSync(join(ASSETS, file))) {
    fail(`${file} is missing — run \`pnpm icons\` to generate the derived variants`);
    continue;
  }
  const { width, height } = png(file);
  if (width !== 1024 || height !== 1024) {
    fail(`${file} is ${width}x${height}; Apple requires 1024x1024`);
  }
}

if (existsSync(join(ASSETS, 'ios-icon-dark.png')) && !png('ios-icon-dark.png').hasAlpha) {
  fail('ios-icon-dark.png has no alpha channel — iOS composites its own backdrop behind it');
}

// ── Android ────────────────────────────────────────────────────────────────
// The launcher masks the adaptive foreground to an arbitrary shape; only the
// centre 61.1% of the canvas is guaranteed visible. 432px is the floor for the
// densest bucket.
if (existsSync(join(ASSETS, 'android-icon-foreground.png'))) {
  const { width, height } = png('android-icon-foreground.png');
  if (width < 432 || width !== height) {
    fail(`android-icon-foreground.png is ${width}x${height}; needs to be square and >= 432px`);
  }
}

if (failures.length > 0) {
  console.error('✗ App icon problems:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log('✓ App icons are the right size, and the right ones carry alpha.');
