import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { createCollection } from "@tanstack/db"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/lib/ts-query-client"



export const settingsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['settings'],
    queryFn: async (ctx) => {
      const settings = await convex.query(api.settings.getSettings)
      return Array.isArray(settings) ? settings : [settings]
    },
    queryClient: queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand',
  })
)

export const useGetSettings = () => {
  return useQuery(convexQuery(api.settings.getSettings, {}))
}
