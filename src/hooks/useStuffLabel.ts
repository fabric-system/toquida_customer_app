import { useQuery } from '@tanstack/react-query';
import * as backend from '../api/backend';
import { useAuth } from '../auth/useAuth';

/** Tab / page label: nickname when fully verified + named, else "My Stuff". */
export function useStuffLabel() {
  const { user } = useAuth();

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
    staleTime: 30000,
  });

  const nickname = user?.vehicle_nickname?.trim() ?? '';
  const hasNamedStuff = Boolean(vq.data?.all_complete && nickname);
  const tabLabel = hasNamedStuff ? nickname : 'My Stuff';

  return {
    tabLabel,
    hasNamedStuff,
    nickname,
    isLoading: vq.isLoading,
    allComplete: Boolean(vq.data?.all_complete),
  };
}
