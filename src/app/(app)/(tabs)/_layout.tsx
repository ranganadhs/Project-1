import { AppTabs, type TabConfig } from '@/components/native/app-tabs';

// The first tab is named 'index' so it resolves the launch URL '/'. Route
// groups like (app) and (tabs) contribute no path segment, so without an index
// route the app opens on expo-router's "Unmatched Route" screen.
const TABS: TabConfig[] = [
  {
    name: 'index',
    label: 'Components',
    sf: { default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' },
    md: 'grid_view',
  },
  {
    name: 'patterns',
    label: 'Navigation',
    sf: { default: 'rectangle.stack', selected: 'rectangle.stack.fill' },
    md: 'layers',
  },
  {
    name: 'native',
    label: 'Native',
    sf: { default: 'wand.and.sparkles', selected: 'wand.and.sparkles.inverse' },
    md: 'auto_awesome',
  },
  {
    name: 'settings',
    label: 'Settings',
    sf: { default: 'gearshape', selected: 'gearshape.fill' },
    md: 'settings',
  },
];

export default function TabsLayout() {
  return <AppTabs tabs={TABS} />;
}
