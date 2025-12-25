import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


const queryClient = new QueryClient()

export const settingsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['settings'],
    queryFn: async (ctx) => {
      const settings = await convex.query(api.settings.getSettings)
      return Array.isArray(settings) ? settings : [settings]
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)
