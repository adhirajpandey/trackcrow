import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../app-header';
import { BackLink, Button, TextLink, type } from '../ui';
import { fetchCategories } from '../../lib/api/categories';
import { fetchAccounts } from '../../lib/api/accounts';
import type { Credentials } from '../../lib/api/client';
import { useCredentials } from '../../lib/credentials';
import { queryKeys } from '../../lib/query-keys';
import { colors } from '../../theme';
export const contentStyle = { padding: 16, gap: 12, paddingBottom: 32 };
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
export function TransactionSession({ children }: { children: (credentials: Credentials) => ReactNode }) {
  const { state } = useCredentials();
  if (state.status === 'ready') return children(state.credentials);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={contentStyle}>
        <Text style={type.heading}>{state.status === 'loading' ? 'Loading…' : 'Connect TrackCrow'}</Text>
        <Button label="Open Settings" onPress={() => router.navigate('/settings')} />
      </View>
    </SafeAreaView>
  );
}
export function TransactionPage({
  title,
  heading,
  headingAction,
  children,
  footer,
  fallback = '/(tabs)/transactions',
}: {
  title: string;
  heading?: string;
  headingAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Where Back goes when the screen was opened without history, such as from a link. */
  fallback?: Href;
}) {
  const back = () => (router.canGoBack() ? router.back() : router.replace(fallback));
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section={title} />
      {heading ? (
        <PageHeading heading={heading} action={headingAction} onBack={back} />
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          <TextLink label="Back" onPress={back} />
        </View>
      )}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={contentStyle}>
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}
export function PageHeading({
  heading,
  action,
  onBack,
}: {
  heading: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 4 }}>
      {onBack ? <BackLink onPress={onBack} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text accessibilityRole="header" style={[type.heading, { flexShrink: 1 }]}>
          {heading}
        </Text>
        {action}
      </View>
    </View>
  );
}
export function useTransactionOptions(c: Credentials) {
  const categories = useQuery({
    queryKey: queryKeys.categories(c.apiUrl),
    queryFn: ({ signal }) => fetchCategories(c, signal),
  });
  const accounts = useQuery({
    queryKey: queryKeys.accounts(c.apiUrl),
    queryFn: ({ signal }) => fetchAccounts(c, signal),
  });
  return { categories, accounts };
}
export function useInvalidateLedger(c: Credentials) {
  const client = useQueryClient();
  return async () => {
    await Promise.all(
      [
        ['summary', c.apiUrl],
        ['category-spending', c.apiUrl],
        ['period-spending', c.apiUrl],
        ['transactions', c.apiUrl],
        ['transaction', c.apiUrl],
        ['recipients', c.apiUrl],
        ['recipient', c.apiUrl],
        ['rules', c.apiUrl],
      ].map((queryKey) => client.invalidateQueries({ queryKey })),
    );
  };
}
