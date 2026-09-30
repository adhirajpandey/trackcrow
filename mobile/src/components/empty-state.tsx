import { Text } from 'react-native';
import { Button, Panel, type } from './ui';
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Panel style={{ padding: 16, gap: 10 }}>
      <Text style={type.heading}>{title}</Text>
      <Text style={type.muted}>{message}</Text>
      {action ? <Button {...action} variant="secondary" /> : null}
    </Panel>
  );
}
