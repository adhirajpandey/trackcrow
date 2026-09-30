import { ComingSoon } from '../components/coming-soon';
import { ShellPreview } from '../components/shell-preview';

export default function Screen() {
  return <ComingSoon section="Diagnostics">{__DEV__ ? <ShellPreview /> : null}</ComingSoon>;
}
