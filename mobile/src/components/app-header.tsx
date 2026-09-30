import { useQuery } from '@tanstack/react-query';
import { fetchSummary } from '../lib/api/dashboard';
import { useCredentials } from '../lib/credentials';
import { queryKeys } from '../lib/query-keys';
import { ScreenHeader } from './screen-header';
export function AppHeader({ section }: { section: string }) {
  const { state } = useCredentials();
  const credentials = state.status === 'ready' ? state.credentials : null;
  const summary = useQuery({
    queryKey: queryKeys.summary(credentials?.apiUrl ?? ''),
    enabled: Boolean(credentials),
    queryFn: ({ signal }) => fetchSummary(credentials!, undefined, signal),
  });
  return <ScreenHeader section={section} reviewCount={summary.data?.uncategorizedCount} />;
}
