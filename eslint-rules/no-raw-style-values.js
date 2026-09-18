/**
 * Bans design-meaningful literals inside StyleSheet.create, so every colour,
 * spacing, radius, font-size, and z-index value resolves to a token.
 *
 * Layout numerics (flex, and the 0/1 identity values) carry no design meaning
 * and are allowlisted — banning them would force pointless token indirection.
 */
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i;

/** Properties whose numeric values must come from a token scale. */
const TOKENIZED_NUMERIC_PROPS = new Set([
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'gap',
  'rowGap',
  'columnGap',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'borderWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'zIndex',
  'elevation',
]);

/** Values that are identity/reset, not design decisions. */
const ALLOWED_NUMBERS = new Set([0, 1]);

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Require design tokens for style values' },
    messages: {
      rawColor:
        'Raw colour "{{value}}". Use a semantic token (theme.color.*). If no token fits, ' +
        'add one to src/theme/tokens/palette.ts and map it in src/theme/themes/color-*.ts.',
      rawNumber:
        'Raw value {{value}} for "{{prop}}". Use a token (theme.space.*, theme.radius.*, ' +
        'theme.typography.*, theme.zIndex.*). If no token fits, add one to src/theme/tokens/.',
    },
    schema: [],
  },

  create(context) {
    let depth = 0;

    const isStyleSheetCreate = (node) =>
      node.callee &&
      node.callee.type === 'MemberExpression' &&
      node.callee.object &&
      node.callee.object.name === 'StyleSheet' &&
      node.callee.property &&
      node.callee.property.name === 'create';

    return {
      CallExpression(node) {
        if (isStyleSheetCreate(node)) depth++;
      },
      'CallExpression:exit'(node) {
        if (isStyleSheetCreate(node)) depth--;
      },
      Property(node) {
        if (depth === 0) return;

        const prop = node.key.name ?? node.key.value;
        const value = node.value;
        if (value.type !== 'Literal') return;

        if (typeof value.value === 'string' && COLOR_RE.test(value.value)) {
          context.report({ node: value, messageId: 'rawColor', data: { value: value.value } });
          return;
        }

        if (
          typeof value.value === 'number' &&
          TOKENIZED_NUMERIC_PROPS.has(prop) &&
          !ALLOWED_NUMBERS.has(value.value)
        ) {
          context.report({
            node: value,
            messageId: 'rawNumber',
            data: { value: String(value.value), prop },
          });
        }
      },
    };
  },
};
