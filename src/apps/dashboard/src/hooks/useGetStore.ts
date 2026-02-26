import { convex } from '@/lib/convex-query';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from 'api/convex';

export function useGetStores() {
  const setStores = useAppStore(state => state.setStores);

  const { data } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const stores = await convex.query(api.stores.list);
      console.log('queryFn of useGetStores')
      setStores(stores);
      return stores;
    },
    staleTime: 0,
  });
  return data;
}
