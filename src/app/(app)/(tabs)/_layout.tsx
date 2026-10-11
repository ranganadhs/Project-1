import { AppTabs, type TabConfig } from '@/components/native/app-tabs';

// The first tab is named 'index' so it resolves the launch URL '/'. Route
// groups like (app) and (tabs) contribute no path segment, so without an index
// route the app opens on expo-router's "Unmatched Route" screen.
const TABS: TabConfig[] = [
  {
    name: 'index',
    label: 'Learn',
    sf: { default: 'sparkles', selected: 'sparkles' },
    md: 'auto_awesome',
  },
  {
    name: 'sessions',
    label: 'Sessions',
    sf: { default: 'message', selected: 'message.fill' },
    md: 'chat_bubble',
  },
  {
    name: 'quizzes',
    label: 'Quizzes',
    sf: { default: 'questionmark.circle', selected: 'questionmark.circle.fill' },
    md: 'quiz',
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
