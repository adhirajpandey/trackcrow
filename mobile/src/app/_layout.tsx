import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Kalam_400Regular } from '@expo-google-fonts/kalam';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { StatusBar } from 'expo-status-bar';
import { Gauge, ReceiptText, ScrollText, Settings, Users } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton, tabBarStyles } from '../components/tab-bar';
import { CredentialsProvider } from '../lib/credentials';
import { colors } from '../theme';

// Section names follow the web app's navigation.
const tabs = [
  { name: 'index', href: '/', label: 'Overview', icon: Gauge },
  { name: 'transactions', href: '/transactions', label: 'Transactions', icon: ReceiptText },
  { name: 'recipients', href: '/recipients', label: 'Recipients', icon: Users },
  { name: 'rules', href: '/rules', label: 'Rules', icon: ScrollText },
  { name: 'settings', href: '/settings', label: 'Settings', icon: Settings },
] as const;

function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1, backgroundColor: colors.background }}>
      <TabSlot />
      <TabList style={[tabBarStyles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton icon={tab.icon} label={tab.label} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

export default function Layout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Kalam_400Regular,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        <QueryClientProvider client={queryClient}>
          <CredentialsProvider>
            <AppTabs />
          </CredentialsProvider>
        </QueryClientProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      )}
    </SafeAreaProvider>
  );
}
