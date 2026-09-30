import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { Gauge, ReceiptText, ChartNoAxesCombined, Ellipsis } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabButton, tabBarStyles } from '../../components/tab-bar';
import { colors } from '../../theme';
const tabs = [
  { name: 'index', href: '/', label: 'Overview', icon: Gauge },
  { name: 'transactions', href: '/transactions', label: 'Txns', a11yLabel: 'Transactions', icon: ReceiptText },
  { name: 'insights', href: '/insights', label: 'Insights', icon: ChartNoAxesCombined },
  { name: 'more', href: '/more', label: 'More', icon: Ellipsis },
] as const;
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1, backgroundColor: colors.background }}>
      <TabSlot />
      <TabList style={[tabBarStyles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton icon={tab.icon} label={tab.label} a11yLabel={'a11yLabel' in tab ? tab.a11yLabel : tab.label} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}
