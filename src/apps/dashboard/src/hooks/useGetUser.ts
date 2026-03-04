import { convex } from '@/lib/convex-client';
import { idbGet } from '@/lib/idb';
import { useAppStore } from '@/lib/store';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from 'api/convex';

export function useGetUser() {
  const { signOut } = useAuthActions()
  const setUser = useAppStore(state => state.setUser);
  const queryResult = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      try {
        const user = await convex.query(api.users.getUserData)
        setUser(user)
        return user
      } catch (e) {
        const user = await idbGet('user')
        if (!user) {
          console.log("user data fetched + no user data in idb, so we gonna sign out")
          signOut()
        }
        setUser(user)
      }
    },
    staleTime: 0,
  });

  return queryResult;
}
