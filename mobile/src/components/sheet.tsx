import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { BackLink, TextLink, type } from './ui';
export type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Actions pinned to the bottom edge while the content scrolls. */
  footer?: ReactNode;
  onBack?: () => void;
};
export function Sheet({ open, title, onClose, children, footer, onBack }: SheetProps) {
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
      if (onBack) onBack();
      else modal.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open, onBack]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>
      </BottomSheetFooter>
    ),
    [footer, insets.bottom],
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
      footerComponent={footer ? renderFooter : undefined}
      backgroundStyle={styles.paper}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/* A plain view fills the fixed snap point, so long content scrolls inside the sheet. */}
      <View
        style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}
        accessibilityViewIsModal
      >
        {onBack ? (
          <View style={styles.back}>
            <BackLink onPress={onBack} />
          </View>
        ) : null}
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[type.heading, styles.title]}>
            {title}
          </Text>
          <TextLink label="Close" onPress={() => modal.current?.dismiss()} />
        </View>
        {children}
      </View>
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  paper: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg },
  content: { flex: 1, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1 },
  back: { marginBottom: -6 },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: colors.card },
});
