import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { queryKeys } from '../../lib/query-keys';
import { colors } from '../../theme';
import { AppHeader } from '../app-header';
import { PageHeading } from '../transactions/shared';
import { TextLink } from '../ui';

export function LedgerPage({ title, heading, headingAction, children, footer }: {
  title: string; heading?: string; headingAction?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  const back = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/more');
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
    <AppHeader section={title} />
    {heading ? <PageHeading heading={heading} action={headingAction} onBack={back} /> : <View style={{ paddingHorizontal: 16 }}>
      <TextLink label="Back" onPress={back} />
    </View>}
    <View style={{ flex: 1 }}>{children}</View>
    {footer}
  </SafeAreaView>;
}
export function useInvalidateRecipientsAndRules(url: string) {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      queryKeys.recipients(url), ['recipient', url], queryKeys.rules(url),
      queryKeys.transactions(url), ['transaction', url],
      queryKeys.summary(url).slice(0, 2), ['category-spending', url], ['period-spending', url],
    ].map(queryKey => client.invalidateQueries({ queryKey })));
  };
}
