import { Funnel } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, minTarget, radii, shadows } from '../theme';

export function FilterButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Filter, filters applied' : 'Filter'}
      onPress={onPress}
      style={({ pressed }) => [styles.filter, pressed ? styles.filterPressed : styles.filterShadow]}
    >
      <Funnel size={22} color={colors.foreground} strokeWidth={2.25} />
      {/* A dot, not only color, shows that filters are applied. */}
      {active ? <View style={styles.filterDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filter: {
    width: minTarget + 8,
    height: minTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  filterShadow: { boxShadow: shadows.control },
  filterPressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.destructive,
  },
});
