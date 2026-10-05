import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ChoiceChip } from '../../components/choice-chip';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { EmptyState } from '../../components/empty-state';
import { openRule } from '../../components/rules/open-rule';
import { LedgerPage, useInvalidateRecipientsAndRules } from '../../components/recipients/shared';
import { SearchField } from '../../components/search-field';
import { SelectSheet } from '../../components/select-sheet';
import { useToast } from '../../components/toast-host';
import { TransactionSession, errorMessage } from '../../components/transactions/shared';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { ApiError, type Credentials } from '../../lib/api/client';
import { deleteRule, fetchRules, updateRule, type Rule, type RuleFilters } from '../../lib/api/rules';
import { queryKeys } from '../../lib/query-keys';
import { colors, fonts } from '../../theme';

type Status = RuleFilters['status'];

const tabs: [Status, string][] = [
  [undefined, 'All'],
  ['enabled', 'Active'],
  ['disabled', 'Paused'],
  ['needsRepair', 'Repair'],
];

export default function RulesScreen() {
  return <TransactionSession>{(c) => <Rules credentials={c} />}</TransactionSession>;
}

function useRuleCount(c: Credentials, status: Status) {
  return useQuery({
    queryKey: [...queryKeys.rules(c.apiUrl, { status, size: 1 }), 'count'],
    queryFn: ({ signal }) => fetchRules(c, { status, size: 1 }, signal),
    select: (page) => page.total,
  });
}

function Rules({ credentials: c }: { credentials: Credentials }) {
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [status, setStatus] = useState<Status>();
  const [menu, setMenu] = useState<Rule | null>(null);
  const [deleting, setDeleting] = useState<Rule | null>(null);
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const counts = {
    all: useRuleCount(c, undefined).data,
    enabled: useRuleCount(c, 'enabled').data,
    disabled: useRuleCount(c, 'disabled').data,
    needsRepair: useRuleCount(c, 'needsRepair').data,
  };
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const filters = { q, status, size: 30 };
  const query = useInfiniteQuery({
    queryKey: queryKeys.rules(c.apiUrl, filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchRules(c, { ...filters, page: pageParam }, signal),
    getNextPageParam: (page) => (page.hasNext ? page.page + 1 : undefined),
  });
  const toggle = useMutation({
    mutationFn: (rule: Rule) => updateRule(c, rule.uuid, { isEnabled: !rule.isEnabled }),
    onSuccess: (result) => {
      toast({ message: result.isEnabled ? 'Rule enabled.' : 'Rule disabled.' });
    },
    onError: (error, rule) => {
      if (error instanceof ApiError && error.code === 'RULE_RECIPIENT_CONFLICT') {
        openRule(rule.uuid, { enable: '1' });
        toast({ message: 'This recipient has an enabled rule. Save here to replace it.' });
      } else toast({ message: errorMessage(error) });
    },
    onSettled: () => invalidate(),
  });
  const remove = useMutation({
    mutationFn: (rule: Rule) => deleteRule(c, rule.uuid),
    onSuccess: async () => {
      setDeleting(null);
      await invalidate();
      toast({ message: 'Rule deleted. Existing transactions will not change.' });
    },
    onError: (error) => toast({ message: errorMessage(error) }),
  });
  const visibleTabs = tabs.filter(([value]) => value !== 'needsRepair' || counts.needsRepair || status === value);
  return (
    <LedgerPage
      title="Rules"
      heading="Rules"
      headingAction={<Button label="Create rule" compact onPress={() => openRule('new')} />}
    >
      <FlashList
        key={JSON.stringify(filters)}
        data={query.data?.pages.flatMap((page) => page.rules) ?? []}
        keyExtractor={(item) => item.uuid}
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.muted}>Automatically categorize your transactions</Text>
            <SearchField
              label="Search rules"
              placeholder="Search rules…"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            <View style={styles.tabs}>
              {visibleTabs.map(([value, label]) => {
                const count = counts[value ?? 'all'];
                return (
                  <ChoiceChip
                    key={label}
                    role="tab"
                    label={count === undefined ? label : `${label} (${count})`}
                    selected={status === value}
                    onPress={() => setStatus(value)}
                  />
                );
              })}
            </View>
            {query.isPending ? <Skeleton height={100} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <RuleRow
            rule={item}
            disabled={toggle.isPending}
            onToggle={() => toggle.mutate(item)}
            onMenu={() => setMenu(item)}
          />
        )}
        ListEmptyComponent={
          query.isSuccess ? (
            <View style={styles.padded}>
              <EmptyState
                title="No rules"
                message="Create a recipient rule to categorize or ignore future SMS imports."
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {query.isError ? (
              <InlineError
                message={errorMessage(query.error)}
                onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
              />
            ) : null}
            {query.hasNextPage ? (
              <Button
                label={query.isFetchingNextPage ? 'Loading…' : 'Load more rules'}
                variant="secondary"
                disabled={query.isFetching}
                onPress={() => void query.fetchNextPage()}
              />
            ) : null}
          </View>
        }
      />
      <SelectSheet
        open={Boolean(menu)}
        title={menu?.name ?? 'Rule'}
        searchable={false}
        chevrons
        options={[
          {
            value: 'edit',
            label: menu?.actionStatus === 'NEEDS_REPAIR' ? 'Repair rule' : 'Edit rule',
            description: 'Change the recipient, action, or name',
            icon: Pencil,
          },
          {
            value: 'delete',
            label: 'Delete rule',
            description: 'Existing transactions will not change',
            icon: Trash2,
          },
        ]}
        onClose={() => setMenu(null)}
        onSelect={(action) => {
          if (!menu) return;
          if (action === 'edit') openRule(menu.uuid);
          if (action === 'delete') setDeleting(menu);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete rule?"
        message="Existing transactions will not change."
        confirmLabel="Delete rule"
        destructive
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
        }}
      />
    </LedgerPage>
  );
}

function RuleRow({
  rule,
  disabled,
  onToggle,
  onMenu,
}: {
  rule: Rule;
  disabled: boolean;
  onToggle: () => void;
  onMenu: () => void;
}) {
  const repair = rule.actionStatus === 'NEEDS_REPAIR';
  const action =
    rule.action.type === 'IGNORE'
      ? 'Ignore'
      : `${rule.action.categoryName ?? 'Missing category'}${rule.action.subcategoryName ? ` / ${rule.action.subcategoryName}` : ''}`;
  return (
    <Panel tone={repair ? 'review' : 'paper'} style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit rule ${rule.name}, if recipient is ${rule.recipient.displayName}, ${action}`}
        disabled={disabled}
        onPress={() => openRule(rule.uuid)}
        style={styles.rowText}
      >
        <Text style={styles.name} numberOfLines={1}>
          {rule.name}
        </Text>
        <Text style={type.muted} numberOfLines={1}>
          If recipient is {rule.recipient.displayName}
        </Text>
        <View style={styles.chips}>
          {repair ? (
            <Chip label="Needs repair" tone="uncategorized" />
          ) : (
            <Chip label={action} tone={rule.action.type === 'IGNORE' ? 'paper' : 'mint'} />
          )}
        </View>
      </Pressable>
      <Switch
        accessibilityLabel={`Enable rule ${rule.name}`}
        value={rule.isEnabled}
        disabled={disabled || (repair && !rule.isEnabled)}
        trackColor={{ true: colors.primary, false: colors.muted }}
        thumbColor={colors.card}
        onValueChange={onToggle}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${rule.name}`} hitSlop={10} onPress={onMenu}>
        <EllipsisVertical size={20} color={colors.foreground} />
      </Pressable>
    </Panel>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 12 },
  tabs: { flexDirection: 'row', gap: 8 },
  padded: { padding: 16 },
  footer: { padding: 16, gap: 12 },
  row: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  chips: { flexDirection: 'row', marginTop: 2 },
});
