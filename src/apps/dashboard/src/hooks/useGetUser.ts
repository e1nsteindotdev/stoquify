import { convex } from '@/lib/convex-query';
import { idbRefresh } from '@/lib/idb';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from 'api/convex';

export function useGetUser() {
  const setUser = useAppStore(state => state.setUser);
  const { data } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      console.log('queryFn of useGetUser')
      const user = await convex.query(api.users.getUserData);
      if (!user) return null
      setUser(user);
      return user;
    },
    staleTime: 0,
  });

  return data;
}
