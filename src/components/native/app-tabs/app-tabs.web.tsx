import { Tabs } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { isActionTab, type AppTabsProps } from './types';

/**
 * Web fallback — the JS tab bar. SF Symbols and Material icons are OS-drawn and
 * have no web equivalent, so tabs are labelled rather than iconified here.
 * Metro resolves this file only for the web bundle.
 */
export function AppTabs({ tabs }: AppTabsProps) {
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.interactive.primary.rest,
        tabBarInactiveTintColor: theme.color.fg.tertiary,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.label }}
          listeners={
            isActionTab(tab)
              ? {
                  tabPress: (event) => {
                    event.preventDefault();
                    tab.onAction?.();
                  },
                }
              : undefined
          }
        />
      ))}
    </Tabs>
  );
}
