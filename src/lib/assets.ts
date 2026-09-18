/**
 * Bundled assets, addressed by NAME rather than by path.
 *
 * ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
 * Metro resolves `require` of an asset at BUILD time, from a LITERAL path. A
 * computed one does not resolve:
 *
 *   require(`../assets/trophies/trophy-${tier}.png`)   // ✗ undefined on device
 *
 * and it fails at runtime, not at typecheck — the bundler simply has nothing to
 * include, so the asset is missing in the build and fine in development if you
 * never look. Listing every asset once here is what makes a keyed lookup like
 * `TROPHY[tier]` safe: the requires are literal, and callers index a plain
 * object.
 *
 * Type each registry with `Record<Key, …>` where the key is a union, so adding
 * a variant without adding its asset is a type error rather than a blank space
 * on a screen.
 */

/**
 * Lottie compositions, ready for `<Lottie source={…} />`.
 *
 * DEMO — `sample` exists so the Lottie primitive is wired and visibly working
 * out of the box. Delete it, this comment, and `assets/animations/sample.json`
 * once a real animation replaces it.
 */
export const ANIMATION = {
  sample: require('../../assets/animations/sample.json') as unknown,
};
