import type { ReactNode } from 'react';
import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import type { StyleProp, ViewStyle } from 'react-native';

export type { MenuAction };

export type MenuProps = {
  /** Actions to show. Supports nesting via `subactions`, and `displayInline` sections. */
  actions: MenuAction[];
  onSelect: (id: string) => void;
  /** Long-press instead of tap — this is what makes it a *context* menu. */
  contextual?: boolean;
  /** iOS renders this as the menu's header. Ignored on Android. */
  title?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Native menu: SwiftUI `Menu` on iOS, Compose `DropdownMenu` on Android.
 *
 * This is the clearest case for going native. iOS gives you the blur-and-lift
 * preview, haptics, submenu chevrons, and the system dismissal gesture; Android
 * gives real Material elevation and ripple. None of that is reproducible in JS,
 * which is why the boilerplate has no JS fallback here.
 *
 * Trade-off worth knowing: the menu surface is drawn by the OS, so it follows
 * the system appearance and does NOT pick up Unistyles tokens. Only the trigger
 * (`children`) is ours to style. That is the right trade for a menu and the
 * wrong one for a branded button — see Button, which stays pure React Native.
 *
 * Icons: pass an SF Symbol name for iOS and an image source for Android on the
 * same `image` field. Each platform ignores the other's form.
 */
export function Menu({ actions, onSelect, contextual = false, title, style, children }: MenuProps) {
  return (
    <MenuView
      title={title}
      actions={actions}
      shouldOpenOnLongPress={contextual}
      onPressAction={({ nativeEvent }) => onSelect(nativeEvent.event)}
      style={style}
    >
      {children}
    </MenuView>
  );
}

/** Long-press variant. Same component, clearer intent at the call site. */
export function ContextMenu(props: Omit<MenuProps, 'contextual'>) {
  return <Menu {...props} contextual />;
}
