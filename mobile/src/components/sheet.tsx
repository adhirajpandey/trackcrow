import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { TextLink, type } from './ui';
export type SheetProps = { open: boolean; title: string; onClose: () => void; children: ReactNode };
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const modal = useRef<BottomSheetModal>(null);
  const presented = useRef(false);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (open) {
      presented.current = true;
      modal.current?.present();
    } else if (presented.current) {
      presented.current = false;
      modal.current?.dismiss();
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      modal.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );
  return (
    <BottomSheetModal
      ref={modal}
      snapPoints={['75%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      animateOnMount={!reducedMotion}
      onDismiss={() => {
        presented.current = false;
        onClose();
      }}
      backdropComponent={backdrop}
      backgroundStyle={styles.paper}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}
        accessibilityViewIsModal
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[type.heading, styles.title]}>
            {title}
          </Text>
          <TextLink label="Close" onPress={() => modal.current?.dismiss()} />
        </View>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  paper: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg },
  content: { flex: 1, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1 },
});
