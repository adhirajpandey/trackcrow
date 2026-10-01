import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import type { CategorySpend } from '../../lib/api/dashboard';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { DayRange, TrendBucket } from '../../lib/insights-ranges';
import { dayLabel } from '../../lib/transaction-dates';
import { colors } from '../../theme';
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

export function TrendChart({
  buckets,
  onSelect,
}: {
  buckets: TrendBucket[];
  onSelect: (range: DayRange) => void;
}) {
  const maximum = Math.max(0, ...buckets.map((bucket) => bucket.totalSpend));
  const peak = buckets.find((bucket) => bucket.totalSpend === maximum);
  const width = Math.max(280, buckets.length * 48);
  const step = width / Math.max(1, buckets.length);
  return (
    <Panel style={{ padding: 14, gap: 10 }}>
      {peak && maximum > 0 ? (
        <Text style={type.body}>
          Highest: {dayLabel(peak.startDate)}
          {peak.endDate !== peak.startDate ? ` – ${dayLabel(peak.endDate)}` : ''} · {formatCurrency(maximum)}
        </Text>
      ) : null}
      <Text style={type.muted}>
        Tap a bar or a period below to see its transactions. Scroll sideways for more periods.
      </Text>
      <ScrollView horizontal>
        <View style={{ width, height: 160 }}>
          <Svg width={width} height={160} accessible={false} importantForAccessibility="no-hide-descendants">
            <Line x1={0} y1={150} x2={width} y2={150} stroke={colors.border} strokeWidth={2} />
            {buckets.map((bucket, index) => {
              const height = maximum > 0 ? (bucket.totalSpend / maximum) * 130 : 0;
              return (
                <Rect
                  key={bucket.period}
                  x={index * step + 8}
                  y={150 - height}
                  width={step - 16}
                  height={height}
                  fill={bucket === peak && maximum > 0 ? colors.accent : colors.info}
                />
              );
            })}
          </Svg>
          <View style={{ ...{ position: 'absolute' as const, inset: 0 }, flexDirection: 'row' }}>
            {buckets.map((bucket) => (
              <Pressable
                key={bucket.period}
                accessibilityRole="button"
                accessibilityLabel={`${dayLabel(bucket.startDate)} to ${dayLabel(bucket.endDate)}, ${formatCurrency(bucket.totalSpend)}, ${bucket.transactionCount} transactions${bucket === peak && maximum > 0 ? ', highest spending' : ''}. Open filtered Transactions.`}
                onPress={() => onSelect(bucket)}
                style={{ width: step, height: 160 }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      {buckets.map((bucket) => (
        <Pressable
          key={bucket.period}
          accessibilityRole="button"
          onPress={() => onSelect(bucket)}
          style={{
            minHeight: 44,
            justifyContent: 'center',
            borderTopWidth: 1,
            borderColor: colors.secondary,
          }}
        >
          <Text style={type.body}>
            {dayLabel(bucket.startDate)}
            {bucket.endDate !== bucket.startDate ? ` – ${dayLabel(bucket.endDate)}` : ''}:{' '}
            {formatCurrency(bucket.totalSpend)} · {bucket.transactionCount} transactions
          </Text>
        </Pressable>
      ))}
    </Panel>
  );
}
