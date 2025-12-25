import { convex } from "@/lib/convex-client"
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { api } from 'api/convex'
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"


const queryClient = new QueryClient()

export const faqsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['faqs'],
    queryFn: async (ctx) => {
      const faqs = await convex.query(api.settings.getFAQs)
      return faqs
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: 'on-demand', // ← Enable query-driven sync
  })
)
