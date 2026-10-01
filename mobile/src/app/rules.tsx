import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { EmptyState } from '../components/empty-state';
import { LedgerPage, useInvalidateRecipientsAndRules } from '../components/recipients/shared';
import { RuleEditor, type RuleEditorSelection } from '../components/rules/editor';
import { TextField } from '../components/text-field';
import { useToast } from '../components/toast-host';
import { TransactionSession, errorMessage } from '../components/transactions/shared';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../components/ui';
import { ApiError, type Credentials } from '../lib/api/client';
import { fetchRecipientDetail } from '../lib/api/recipients';
import { fetchRule, fetchRules, updateRule, type Rule, type RuleFilters } from '../lib/api/rules';
import { queryKeys } from '../lib/query-keys';

export default function RulesScreen() {
  return <TransactionSession>{c => <Rules credentials={c} />}</TransactionSession>;
}
function Rules({ credentials: c }: { credentials: Credentials }) {
  const params = useLocalSearchParams<{ ruleUuid?: string; recipientUuid?: string }>();
  const ruleUuid = Array.isArray(params.ruleUuid) ? params.ruleUuid[0] : params.ruleUuid;
  const recipientUuid = Array.isArray(params.recipientUuid) ? params.recipientUuid[0] : params.recipientUuid;
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [status, setStatus] = useState<RuleFilters['status']>();
  const [editor, setEditor] = useState<RuleEditorSelection | null>(null);
  const [handled, setHandled] = useState('');
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const routeKey = `${ruleUuid ?? ''}:${recipientUuid ?? ''}`;
  const target = useQuery({
    queryKey: [...queryKeys.rules(c.apiUrl), 'detail', ruleUuid],
    enabled: Boolean(ruleUuid),
    queryFn: ({ signal }) => fetchRule(c, ruleUuid!, signal),
  });
  const recipient = useQuery({
    queryKey: queryKeys.recipient(c.apiUrl, recipientUuid ?? ''),
    enabled: Boolean(recipientUuid && !ruleUuid),
    queryFn: ({ signal }) => fetchRecipientDetail(c, recipientUuid!, signal),
  });
  // Adjust route-owned state only when the route changes and its data is ready.
  if (routeKey !== handled) {
    if (ruleUuid && target.data?.uuid === ruleUuid) {
      setEditor({ rule: target.data }); setHandled(routeKey);
    } else if (!ruleUuid && recipient.data?.uuid === recipientUuid && recipientUuid) {
      setEditor({ recipient: recipient.data }); setHandled(routeKey);
    } else if (!ruleUuid && !recipientUuid) {
      setEditor(null); setHandled(routeKey);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const filters = { q, status, size: 30 };
  const query = useInfiniteQuery({
    queryKey: queryKeys.rules(c.apiUrl, filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchRules(c, { ...filters, page: pageParam }, signal),
    getNextPageParam: page => page.hasNext ? page.page + 1 : undefined,
  });
  const toggle = useMutation({
    mutationFn: (rule: Rule) => updateRule(c, rule.uuid, { isEnabled: !rule.isEnabled }),
    onSuccess: result => { toast({ message: result.isEnabled ? 'Rule enabled.' : 'Rule disabled.' }); },
    onError: (error, rule) => {
      if (error instanceof ApiError && error.code === 'RULE_RECIPIENT_CONFLICT') {
        setEditor({ rule: { ...rule, isEnabled: true } });
        toast({ message: 'This recipient has an enabled rule. Save here to replace it.' });
      } else toast({ message: errorMessage(error) });
    },
    onSettled: () => invalidate(),
  });
  const routePending = handled !== routeKey && Boolean(ruleUuid || recipientUuid);
  return <LedgerPage title="Rules">
    <FlashList key={JSON.stringify(filters)} data={query.data?.pages.flatMap(page => page.rules) ?? []}
      keyExtractor={item => item.uuid} keyboardShouldPersistTaps="handled"
      refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage(); }}
      ListHeaderComponent={<View style={{ padding: 16, gap: 12 }}>
        <TextField label="Search rules" placeholder="Rule or recipient name" value={search} onChangeText={setSearch} />
        <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
          {([
            [undefined, 'All'], ['enabled', 'Enabled'], ['disabled', 'Disabled'], ['needsRepair', 'Needs repair'],
          ] as const).map(([value, label]) => <Button key={label} label={`${status === value ? '✓ ' : ''}${label}`}
            variant="secondary" onPress={() => setStatus(value)} />)}
        </ScrollView>
        <Button label="Create rule" disabled={toggle.isPending} onPress={() => setEditor({})} />
        {query.data ? <Text style={type.muted}>{query.data.pages[0].total} rules</Text> : null}
        {query.isPending ? <Skeleton height={100} /> : null}
        {routePending && (ruleUuid ? target.isPending : recipient.isPending) ?
          <Text style={type.muted}>Opening rule editor…</Text> : null}
        {routePending && ruleUuid && target.isError ?
          <InlineError message={errorMessage(target.error)} onRetry={() => void target.refetch()} /> : null}
        {routePending && !ruleUuid && recipient.isError ?
          <InlineError message={errorMessage(recipient.error)} onRetry={() => void recipient.refetch()} /> : null}
      </View>}
      renderItem={({ item }) => <Panel tone={item.actionStatus === 'NEEDS_REPAIR' ? 'review' : 'paper'}
        style={{ marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit rule ${item.name}`}
          disabled={toggle.isPending} onPress={() => setEditor({ rule: item })}
          style={{ minHeight: 44, gap: 8 }}>
          <Text style={type.heading}>{item.name}</Text>
          <Text style={type.body}>{item.recipient.displayName}</Text>
          <Text style={type.muted}>{item.action.type === 'IGNORE' ? 'Ignore future SMS imports' :
            `Categorize as ${item.action.categoryName ?? 'Missing category'}${item.action.subcategoryName ? ` / ${item.action.subcategoryName}` : ''}`}</Text>
          {item.actionStatus === 'NEEDS_REPAIR' ? <Chip label="Needs repair" tone="uncategorized" /> : null}
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 }}>
          <Text style={type.body}>{item.isEnabled ? 'Enabled' : 'Disabled'}</Text>
          <Switch accessibilityLabel={`Enable rule ${item.name}`} value={item.isEnabled}
            disabled={toggle.isPending || (item.actionStatus === 'NEEDS_REPAIR' && !item.isEnabled)}
            onValueChange={() => toggle.mutate(item)} />
        </View>
        {item.actionStatus === 'NEEDS_REPAIR' ? <Button label="Repair rule" variant="secondary"
          disabled={toggle.isPending} onPress={() => setEditor({ rule: item })} /> : null}
      </Panel>}
      ListEmptyComponent={query.isSuccess ? <View style={{ padding: 16 }}><EmptyState title="No rules"
        message="Create a recipient rule to categorize or ignore future SMS imports." /></View> : null}
      ListFooterComponent={<View style={{ padding: 16, gap: 12 }}>
        {query.isError ? <InlineError message={errorMessage(query.error)}
          onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())} /> : null}
        {query.hasNextPage ? <Button label={query.isFetchingNextPage ? 'Loading…' : 'Load more rules'}
          variant="secondary" disabled={query.isFetching} onPress={() => void query.fetchNextPage()} /> : null}
      </View>} />
    {editor ? <RuleEditor key={editor.rule?.uuid ?? 'new'} credentials={c} selection={editor}
      onClose={() => setEditor(null)} /> : null}
  </LedgerPage>;
}
