import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useUnistyles } from 'react-native-unistyles';
import type { ReactElement } from 'react';
import type { ImageSourcePropType } from 'react-native';
// TYPE-ONLY from the barrel (erased at runtime), and the context from a leaf
// module that imports only react. A VALUE import from the barrel here drags
// text.tsx's module-scope StyleSheet.create into this ROUTE's import graph, and
// the app white-screens before StyleSheet.configure() has run. See
// components/ui/tab-bar-clearance.ts.
import type { IconName } from '@/components/ui';
import { TabBarClearanceContext } from '@/components/ui/tab-bar-clearance';
import { isActionTab, isIonTab, type AppTabsProps, type TabConfig } from './types';

/**
 * Native tab bar on both platforms: a real UITabBarController on iOS (which
 * brings iOS 26 Liquid Glass for free) and Material tabs on Android.
 *
 * WHY NO CUSTOM ANDROID BAR: SDK 57 supports `disabled` (emits tabPress,
 * skips navigation), `labelVisibilityMode`, `disableIndicator`,
 * `indicatorColor` and `rippleColor` on Android, so a headless
 * `expo-router/ui` bar with a hand-drawn pill buys nothing. If you want a
 * bespoke floating bar, add `app-tabs.android.tsx` — this file stays the iOS
 * and default implementation and nothing else changes.
 *
 * `expo-router/unstable-native-tabs` is an unstable API. Every consumer goes
 * through <AppTabs>, so an upstream break is a one-file fix.
 */
export function AppTabs({ tabs, minimizeBehavior }: AppTabsProps) {
  const { theme } = useUnistyles();

  return (
    /*
      Every screen under this bar needs room to scroll CLEAR of it — the iOS 26
      bar is a floating pill that content passes beneath, and the safe-area
      inset describes only the home indicator. This is the one place that knows
      a tab bar exists, so it is where the clearance is published; `Screen`
      reads it and adds nothing outside the tabs.
    */
    <TabBarClearanceContext value={theme.size.bar.tab}>
      <NativeTabs
        /*
          THE SELECTED ICON COLOUR DIFFERS BY PLATFORM, and it is not a
          preference:

            iOS      draws no filled indicator, so the selected glyph sits on
                     the glass and must BE the accent.
            ANDROID  Material 3 draws an active-indicator PILL behind the
                     selected glyph, and `indicatorColor` fills it with that
                     same accent. An accent glyph on an accent pill is
                     invisible — the bar renders a solid lozenge with nothing
                     in it.

          So Android takes the paired ink. `interactive.primary.*` pairs with
          `fg.onBrand` (see the pairing table in CLAUDE.md); this is that rule
          arrived at from the opposite direction — the fill happens to be the
          indicator rather than a button.
        */
        iconColor={{
          default: theme.color.fg.tertiary,
          selected:
            Platform.OS === 'android'
              ? theme.color.fg.onBrand
              : theme.color.interactive.primary.rest,
        }}
        labelStyle={{ color: theme.color.fg.tertiary }}
        indicatorColor={theme.color.interactive.primary.rest}
        badgeBackgroundColor={theme.color.status.danger.solid}
        badgeTextColor={theme.color.status.danger.onSolid}
        minimizeBehavior={minimizeBehavior}
      >
        {tabs.map((tab) => (
          <NativeTabs.Trigger
            key={tab.name}
            name={tab.name}
            disabled={isActionTab(tab)}
            role={tab.role}
            /*
              Both are real Trigger props (verified in expo-router's
              native-tabs types): `testID` maps to the item's accessibility
              identifier on iOS, which XCUITest and Maestro match, and to the
              view tag on Android, which Maestro does NOT read — so a flow that
              targets a tab on Android matches `accessibilityLabel` instead.
            */
            accessibilityLabel={tab.label}
            testID={`tab-${tab.name}`}
            listeners={isActionTab(tab) ? { tabPress: () => tab.onAction?.() } : undefined}
          >
            {/*
              CALLED, not rendered as <TabGlyph tab={tab} />. See tabGlyph below
              — the element has to BE the Icon, not a component that returns one.
            */}
            {tabGlyph(tab)}
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
            {/*
              A direct child for the same reason as the icon: the Trigger keeps
              only Icon, Label and Badge elements and drops anything else.
              Rendered only when there is something to show, so a tab without
              a badge never commits an empty one to native.
            */}
            {tab.badge ? <NativeTabs.Trigger.Badge>{tab.badge}</NativeTabs.Trigger.Badge> : null}
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    </TabBarClearanceContext>
  );
}

/**
 * The glyph, resolved SYNCHRONOUSLY where we can.
 *
 * ── THE BUG THIS EXISTS FOR: LABELS SITTING LOW UNTIL YOU TAP ONE ─────────
 * On a cold launch every UNSELECTED tab's label sat visibly lower than the
 * selected one's, and the first tap on any tab snapped all of them into
 * alignment permanently.
 *
 * The cause is that the icon arrives ONE RENDER LATE. Passing a `VectorIcon`
 * ELEMENT sends expo-router down its async path — `optionsIconConverter
 * .shared.js` treats a React element as a component src, `utils/icon.js` turns
 * it into `family.getImageSource(name, 24, 'white')`, and that returns a
 * PROMISE. `useAwaitedScreensIcon` therefore returns `undefined` on the first
 * render and resolves the promise in an effect, so the tab item is committed to
 * native with a TITLE AND NO IMAGE.
 *
 * INFERRED FROM HERE, and labelled as such because it is load-bearing: a
 * `UITabBarItem` with no image centres its title, where one with an image
 * stacks image-above-title. So the bar lays out on the title-only baseline, and
 * when the image lands `tabItemAppearanceHasChanged` updates the item without
 * forcing the BAR to re-run layout. A selection change does force one, which is
 * why a single tap fixes every tab at once. That is inference from the symptom,
 * not something read out of UIKit — but it predicts the whole repro, including
 * why it is the unselected tabs and why one tap is permanent.
 *
 * ── THE WORKAROUND: HAND IT A SOURCE, NOT AN ELEMENT ──────────────────────
 * `convertSrcOrComponentToSrc` only takes the async path for a React ELEMENT;
 * anything else is passed straight through. `getImageSourceSync` is
 * `getImageSource` without the await, so the item has its image on the FIRST
 * commit and never lays out title-only.
 *
 * THIS IS AN UPSTREAM BUG. When expo-router either resolves the icon before
 * first commit or forces a bar layout when it lands, DELETE this whole function
 * and go back to:
 *
 *     <NativeTabs.Trigger.VectorIcon family={Ionicons} name={name} />
 *
 * ── WHY THE FALLBACK IS NOT DEFENSIVE PADDING ─────────────────────────────
 * The sync path SKIPS `loadFontAsync`, which the async one awaits when dynamic
 * font loading is on (`create-icon-set.js`). The config plugin links the font
 * statically so it is there at first call — but if that ever stops being true,
 * `getImageForFontSync` fails and we would ship a bar with NO ICONS AT ALL.
 * That is far worse than a low label, and invisible to typecheck, lint and the
 * bundler. So a failure falls back to the element, which is exactly today's
 * behaviour: the worst case is the bug we started with, never a blank bar.
 *
 * The catch is deliberately narrow in intent — it exists for a missing font,
 * and nothing else in these two lines can throw.
 */
const vectorIcon = (name: IconName): ReactElement | ImageSourcePropType => {
  try {
    return Ionicons.getImageSourceSync(name, ICON_POINT_SIZE, ICON_RASTER_COLOUR);
  } catch {
    return <NativeTabs.Trigger.VectorIcon family={Ionicons} name={name} />;
  }
};

/**
 * expo-router's own numbers, repeated here because we now call the same API it
 * calls: `getImageSource(name, 24, 'white')` in `utils/icon.js`. WHITE is not a
 * colour choice — the glyph is rasterised as a white bitmap and is only ever
 * visible because it is re-tinted as a template image. See `tabGlyph`.
 */
const ICON_POINT_SIZE = 24;
const ICON_RASTER_COLOUR = 'white';

/**
 * Ionicons reach the native bar through `src`, which takes a `VectorIcon`
 * descriptor rather than a rendered view — the OS draws the glyph itself.
 *
 * A PLAIN FUNCTION, deliberately, and it must stay one.
 *
 * `NativeTabs.Trigger` never renders its children. It reads them as data —
 * `Children.toArray(children).filter(c => c.type === Icon | Label | Badge)` —
 * and anything whose element type is not one of those three is dropped without
 * a warning. Wrap this in a component and `<TabGlyph/>`'s type is `TabGlyph`,
 * so the icon is discarded while the Label, a direct child, still renders: a
 * tab bar of labels with no icons, passing typecheck, lint and the bundler.
 * The same applies to a Fragment — `Children.toArray` flattens arrays but NOT
 * fragments, so `<>...</>` around these breaks it too. See app-tabs.test.tsx.
 *
 * `renderingMode` is explicit rather than inherited. `VectorIcon` rasterises the
 * glyph as a WHITE bitmap (expo-router hardcodes `getImageSource(name, 24,
 * 'white')`), so it is only ever visible because iOS re-tints it as a template
 * image. expo-router infers that from `iconColor` being set — which it is, just
 * above — but the inference is the only thing standing between a themed icon and
 * a white glyph on a white Liquid Glass bar. Say it outright.
 */
function tabGlyph(tab: TabConfig): ReactElement {
  if (!isIonTab(tab)) return <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />;

  const { ion } = tab;
  if (typeof ion === 'string') {
    return <NativeTabs.Trigger.Icon src={vectorIcon(ion)} renderingMode="template" />;
  }

  return (
    <NativeTabs.Trigger.Icon
      src={{ default: vectorIcon(ion.default), selected: vectorIcon(ion.selected) }}
      renderingMode="template"
    />
  );
}
