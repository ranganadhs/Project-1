/**
 * Stacking order. Gaps of 10 leave room to slot a layer in without renumbering
 * everything above it.
 *
 * Native modals and native tab bars are NOT in this scale — they are OS windows
 * and always draw above every React Native view regardless of zIndex. Do not
 * try to out-rank them here; use a route presentation instead.
 */
export const zIndex = {
  behind: -1,
  base: 0,
  /** Raised cards and pressed states within normal flow. */
  raised: 10,
  /** Sticky headers and floating action buttons. */
  sticky: 100,
  /** Dropdowns and popovers anchored to content. */
  popover: 150,
  /** Full-screen scrims. */
  overlay: 200,
  /** JS-rendered modals (native ones ignore this). */
  modal: 300,
  /** Toasts and snackbars — above modals so confirmations are never hidden. */
  toast: 400,
  /** Tooltips sit on top of everything. */
  tooltip: 500,
} as const;
