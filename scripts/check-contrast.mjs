#!/usr/bin/env node
/**
 * Fails when any semantic foreground/background pair drops below WCAG AA.
 * Body text needs 4.5:1; large text and UI borders need 3:1.
 *
 * Reads the SAME theme source the app does, via tsx — so this can never drift
 * from what actually ships.
 */
import { execFileSync } from 'node:child_process';

const AA_BODY = 4.5;
const AA_LARGE = 3;

function srgbToLinear(channel) {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a === null || b === null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// Imports the COLOUR modules, not the full themes. Those two files import only
// tokens/palette (pure data), so they load in plain Node. Importing the full
// theme would transitively pull in border.ts -> react-native's Flow-typed
// source, which esbuild cannot parse.
const stdout = execFileSync(
  'pnpm',
  [
    'exec',
    'tsx',
    '-e',
    "import {colorLight} from './src/theme/themes/color-light';" +
      "import {colorDark} from './src/theme/themes/color-dark';" +
      'console.log(JSON.stringify({light: colorLight, dark: colorDark}))',
  ],
  { encoding: 'utf8' },
);
const themeColors = JSON.parse(stdout.trim().split('\n').pop());

// [foregroundPath, backgroundPath, minimumRatio]
const PAIRS = [
  // Text on every surface it can land on.
  ['fg.primary', 'bg.canvas', AA_BODY],
  ['fg.primary', 'bg.surface', AA_BODY],
  ['fg.primary', 'bg.raised', AA_BODY],
  ['fg.primary', 'bg.sunken', AA_BODY],
  ['fg.secondary', 'bg.canvas', AA_BODY],
  ['fg.secondary', 'bg.surface', AA_BODY],
  ['fg.secondary', 'bg.raised', AA_BODY],
  ['fg.tertiary', 'bg.canvas', AA_LARGE],
  ['fg.placeholder', 'bg.raised', AA_LARGE],
  ['fg.inverse', 'bg.inverse', AA_BODY],
  ['fg.link', 'bg.canvas', AA_BODY],
  ['fg.link', 'bg.surface', AA_BODY],
  ['fg.brand', 'bg.canvas', AA_BODY],

  // Text on filled interactive surfaces, in every state a user can reach.
  ['fg.onBrand', 'interactive.primary.rest', AA_BODY],
  ['fg.onBrand', 'interactive.primary.hover', AA_BODY],
  ['fg.onBrand', 'interactive.primary.pressed', AA_BODY],
  ['fg.onBrand', 'interactive.danger.rest', AA_BODY],
  ['fg.onBrand', 'interactive.danger.pressed', AA_BODY],
  ['fg.primary', 'interactive.secondary.rest', AA_BODY],
  ['fg.primary', 'interactive.secondary.pressed', AA_BODY],
  ['fg.onBrand', 'bg.brand', AA_BODY],
  ['fg.onAccent', 'bg.accent', AA_BODY],

  // Status: tinted variant and solid variant are different failure modes.
  ['status.success.fg', 'status.success.bg', AA_BODY],
  ['status.warning.fg', 'status.warning.bg', AA_BODY],
  ['status.danger.fg', 'status.danger.bg', AA_BODY],
  ['status.info.fg', 'status.info.bg', AA_BODY],
  ['status.neutral.fg', 'status.neutral.bg', AA_BODY],
  ['status.success.onSolid', 'status.success.solid', AA_BODY],
  ['status.warning.onSolid', 'status.warning.solid', AA_BODY],
  ['status.danger.onSolid', 'status.danger.solid', AA_BODY],
  ['status.info.onSolid', 'status.info.solid', AA_BODY],
  ['status.neutral.onSolid', 'status.neutral.solid', AA_BODY],

  // Status text also has to survive on a plain surface, since badges and
  // inline messages are not always on their own tint.
  ['status.success.fg', 'bg.canvas', AA_BODY],
  ['status.danger.fg', 'bg.canvas', AA_BODY],

  // WCAG 1.4.11 (non-text contrast) applies to boundaries that IDENTIFY a
  // component, and to focus indicators. `border.subtle` and `border.default`
  // are decorative separators — a list row is identifiable without them — so
  // they are intentionally not gated. These are.
  ['border.strong', 'bg.canvas', AA_LARGE],
  ['border.strong', 'bg.surface', AA_LARGE],
  ['border.focus', 'bg.canvas', AA_LARGE],
  ['border.focus', 'bg.raised', AA_LARGE],
  ['border.selected', 'bg.canvas', AA_LARGE],

  // Chart axis/label legibility. Gridlines are deliberately exempt — they must
  // recede behind the data, and a 3:1 gridline competes with the marks.
  ['chart.label', 'bg.canvas', AA_BODY],
  // chart.axis and chart.grid are deliberately NOT gated. Both are thin rules
  // that must recede behind the data; a 3:1 axis competes with the marks it is
  // supposed to frame. Legibility is carried by chart.label, which IS gated.
];

const at = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

let failed = 0;
for (const [name, color] of Object.entries(themeColors)) {
  for (const [fgPath, bgPath, min] of PAIRS) {
    const fg = at(color, fgPath);
    const bg = at(color, bgPath);
    const r = ratio(fg, bg);
    if (r === null) continue; // rgba() scrims are not contrast-checked
    if (r < min) {
      failed++;
      console.error(
        `✗ ${name}: ${fgPath} (${fg}) on ${bgPath} (${bg}) = ${r.toFixed(2)}:1, needs ${min}:1`,
      );
    }
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} contrast violation(s). Adjust the ramp step in src/theme/tokens/palette.ts.\n` +
      'Do not lower the threshold, and do not hardcode a one-off colour in the theme.',
  );
  process.exit(1);
}
console.log('✓ All semantic colour pairs meet WCAG AA.');
