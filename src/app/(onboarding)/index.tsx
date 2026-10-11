import { Redirect } from 'expo-router';

// (onboarding) contributes no path segment, so '/' while !hasModel must
// resolve somewhere (trap 1) — redirect to the real screen rather than
// rename it, so the route stays /model-setup per docs/app-plan.md.
export default function OnboardingIndex() {
  return <Redirect href="/model-setup" />;
}
