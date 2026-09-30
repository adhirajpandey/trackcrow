import { useState } from 'react';
import { Text, View } from 'react-native';

import { CategorySheet } from './category-sheet';
import { useToast } from './toast-host';
import { Button, type } from './ui';

// Development-client smoke check. No preview data enters the ledger.
export function ShellPreview() {
  const [open, setOpen] = useState(false);
  const showToast = useToast();
  return (
    <View style={{ gap: 10 }}>
      <Text style={type.label}>App shell preview</Text>
      <Button label="Open category sheet" variant="secondary" onPress={() => setOpen(true)} />
      <Button
        label="Show toast"
        variant="secondary"
        onPress={() =>
          showToast({
            message: 'Category saved (preview)',
            undo: () => showToast({ message: 'Change undone (preview)' }),
          })
        }
      />
      <CategorySheet
        open={open}
        categories={[
          { uuid: 'food', name: 'Food', subcategories: [] },
          { uuid: 'travel', name: 'Travel', subcategories: [] },
          { uuid: 'shopping', name: 'Shopping', subcategories: [] },
        ]}
        recentCategoryUuids={['food']}
        onSelect={() =>
          showToast({
            message: 'Category saved (preview)',
            undo: () => showToast({ message: 'Change undone (preview)' }),
          })
        }
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
