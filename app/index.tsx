// app/index.tsx
import { Redirect } from 'expo-router';

/**
 * When someone opens “/”, jump straight into the first tab
 * while keeping the bottom-tab bar alive.
 */
export default function Index() {
  return <Redirect href="/(tabs)/add" />;
}
