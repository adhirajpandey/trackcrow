import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { Sheet } from '../sheet';
import { TextField } from '../text-field';
import { Button } from '../ui';
import { errorMessage } from '../transactions/shared';
import { ApiError } from '../../lib/api/client';

export function NameSheet({
  title,
  initialName = '',
  maxLength,
  onSave,
  onClose,
}: {
  title: string;
  initialName?: string;
  maxLength: number;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function save() {
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      await onSave(name.trim());
      onClose();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 409
          ? 'This name already exists. Choose another name.'
          : errorMessage(caught),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet open title={title} onClose={onClose}>
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
        <TextField
          label="Name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(undefined);
          }}
          maxLength={maxLength}
          error={error}
          editable={!busy}
          autoFocus
        />
        <Button
          label={busy ? 'Saving…' : 'Save'}
          disabled={busy || !name.trim()}
          onPress={() => void save()}
        />
      </BottomSheetScrollView>
    </Sheet>
  );
}
