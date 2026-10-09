import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CategorySpend } from '../../lib/api/dashboard';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { DayRange, Granularity, TrendBucket } from '../../lib/insights-ranges';
import { dayLabel } from '../../lib/transaction-dates';
import { colors, fonts, radii } from '../../theme';
import { Panel, type } from '../ui';

export function CategoryBars({
  spending,
  onSelect,
}: {
  spending: CategorySpend[];
  onSelect: (category: string) => void;
}) {
  const sorted = [...spending].sort((a, b) => b.totalSpend - a.totalSpend);
  const total = sorted.reduce((sum, row) => sum + row.totalSpend, 0);
  return (
    <Panel style={{ padding: 14, gap: 8 }}>
      {sorted.map((row) => (
        <Pressable
          key={row.category}
          accessibilityRole="button"
          accessibilityLabel={`${row.category}, ${formatCurrency(row.totalSpend)}, ${formatPercent(row.totalSpend, total)} of spending, ${row.transactionCount} transactions. ${row.category === 'Uncategorized' ? 'Open review queue' : 'Open filtered Transactions'}.`}
          onPress={() => onSelect(row.category)}
          style={{ minHeight: 64, gap: 6, paddingVertical: 8 }}
        >
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
            <Text style={[type.body, { flex: 1 }]}>{row.category}</Text>
            <Text style={type.number}>
              {formatCurrency(row.totalSpend)} · {formatPercent(row.totalSpend, total)}
            </Text>
          </View>
          <View style={{ height: 12, backgroundColor: colors.muted, borderRadius: 6, overflow: 'hidden' }}>
            <View
              style={{
                height: 12,
                width: `${total ? (row.totalSpend / total) * 100 : 0}%`,
                backgroundColor: row.category === 'Uncategorized' ? colors.accent : colors.primary,
              }}
            />
          </View>
        </Pressable>
      ))}
    </Panel>
  );
}

const AXIS = 150;
const HEADROOM = 52;
const LABEL_WIDTH = 34;

function compactAmount(value: number) {
  if (value >= 100_000) return `${+(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `${+(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function niceStep(maximum: number) {
  const raw = maximum / 3;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((step) => step >= raw) ?? raw;
}

export function bucketLabel(bucket: TrendBucket, granularity: Granularity, short = false) {
  const [year, month, day] = bucket.startDate.split('-').map(Number);
  if (granularity === 'month') return short ? monthNames[month - 1] : `${monthNames[month - 1]} ${year}`;
  if (short) return `${day} ${monthNames[month - 1]}`;
  return granularity === 'week' && bucket.endDate !== bucket.startDate
    ? `${dayLabel(bucket.startDate).slice(0, -5)} – ${dayLabel(bucket.endDate)}`
    : dayLabel(bucket.startDate);
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SpendingChart({
  buckets,
  granularity,
  average,
}: {
  buckets: TrendBucket[];
  granularity: Granularity;
  average: number;
}) {
  const [width, setWidth] = useState(0);
  const maximum = Math.max(0, ...buckets.map((bucket) => bucket.totalSpend));
  const peak = buckets.findIndex((bucket) => bucket.totalSpend === maximum);
  const [chosen, setChosen] = useState<number | null>(null);
  const selected = chosen ?? peak;
  const step = maximum > 0 ? niceStep(maximum) : 1;
  const top = Math.max(step, Math.ceil(maximum / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step).reverse();
  const plot = Math.max(0, width - LABEL_WIDTH);
  const slot = Math.max(plot / Math.max(1, buckets.length), 44);
  const inner = slot * buckets.length;
  const bucket = buckets[selected];
  return (
    <Panel style={styles.chart}>
      <Text style={type.muted}>Daily average: {formatCurrency(average)}</Text>
      <View style={styles.chartBody} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <View style={[styles.axis, { height: AXIS, marginTop: HEADROOM }]}>
          {ticks.map((tick) => (
            <Text key={tick} style={styles.tick}>
              {compactAmount(tick)}
            </Text>
          ))}
        </View>
        {width ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: plot }}>
            <View style={{ width: inner }}>
              <View style={[styles.plot, { height: AXIS + HEADROOM }]}>
                {ticks.map((tick) => (
                  <View key={tick} style={[styles.grid, { bottom: (tick / top) * AXIS }]} />
                ))}
                {buckets.map((item, index) => (
                  <Pressable
                    key={item.period}
                    accessibilityRole="button"
                    accessibilityState={{ selected: index === selected }}
                    accessibilityLabel={`${bucketLabel(item, granularity)}, ${formatCurrency(item.totalSpend)}, ${item.transactionCount} transactions`}
                    onPress={() => setChosen(index)}
                    style={[styles.slot, { width: slot }]}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (item.totalSpend / top) * AXIS,
                          backgroundColor: index === selected && maximum > 0 ? colors.accent : colors.primary,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
                {bucket && maximum > 0 ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.tooltip,
                      {
                        left: Math.min(Math.max(0, selected * slot + slot / 2 - 60), inner - 120),
                        bottom: (bucket.totalSpend / top) * AXIS + 6,
                      },
                    ]}
                  >
                    <Text style={styles.tooltipAmount}>{formatCurrency(bucket.totalSpend)}</Text>
                    <Text style={styles.tooltipCount}>
                      {bucket.transactionCount} {bucket.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.labels}>
                {buckets.map((item) => (
                  <Text key={item.period} style={[styles.dateLabel, { width: slot }]} numberOfLines={1}>
                    {bucketLabel(item, granularity, true)}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Panel>
  );
}

export function SpendingBreakdown({
  buckets,
  granularity,
  onSelect,
}: {
  buckets: TrendBucket[];
  granularity: Granularity;
  onSelect: (range: DayRange) => void;
}) {
  const rows = buckets.filter((bucket) => bucket.transactionCount > 0);
  return (
    <Panel style={styles.breakdown}>
      {rows.map((bucket, index) => (
        <Pressable
          key={bucket.period}
          accessibilityRole="button"
          accessibilityLabel={`${bucketLabel(bucket, granularity)}, ${formatCurrency(bucket.totalSpend)}, ${bucket.transactionCount} transactions. Open filtered Transactions.`}
          onPress={() => onSelect(bucket)}
          style={({ pressed }) => [styles.breakdownRow, index > 0 && styles.divider, pressed && styles.pressed]}
        >
          <Text style={[type.body, styles.flex]}>{bucketLabel(bucket, granularity)}</Text>
          <Text style={type.muted}>
            {formatCurrency(bucket.totalSpend)} · {bucket.transactionCount}{' '}
            {bucket.transactionCount === 1 ? 'transaction' : 'transactions'}
          </Text>
          <ChevronRight size={18} color={colors.foreground} />
        </Pressable>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  chart: { padding: 14, gap: 12 },
  chartBody: { flexDirection: 'row' },
  axis: { width: LABEL_WIDTH, justifyContent: 'space-between', marginBottom: 22 },
  tick: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: -7 },
  plot: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 2, borderColor: colors.border },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.secondary },
  slot: { height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '62%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tooltip: {
    position: 'absolute',
    width: 120,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
  },
  tooltipAmount: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  tooltipCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.mutedForeground },
  labels: { flexDirection: 'row', height: 22, alignItems: 'flex-end' },
  dateLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, textAlign: 'center' },
  breakdown: { paddingHorizontal: 14, paddingVertical: 4 },
  breakdownRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { borderTopWidth: 1, borderColor: colors.secondary },
  pressed: { opacity: 0.6 },
  flex: { flex: 1 },
});
