import { useState } from 'react';
import { FormInput } from './form-controls';
import { Sheet } from './sheet';
import { Button } from './ui';

export function TextEditSheet({
  open,
  title,
  value,
  placeholder,
  multiline = false,
  onDone,
  onClose,
}: {
  open: boolean;
  title: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onDone: (value: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const [closing, setClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText(value);
      setClosing(false);
    }
  }
  return (
    <Sheet
      open={open && !closing}
      title={title}
      onClose={onClose}
      footer={
        <Button
          label="Done"
          onPress={() => {
            onDone(text);
            setClosing(true);
          }}
        />
      }
    >
      <FormInput
        accessibilityLabel={title}
        placeholder={placeholder}
        multiline={multiline}
        autoFocus
        value={text}
        onChangeText={setText}
      />
    </Sheet>
  );
}
