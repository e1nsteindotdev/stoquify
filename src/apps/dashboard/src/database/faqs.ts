import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { idbGet, idbRefresh } from "@/lib/idb";
import type { Id } from "api/data-model";

type CachedFaq = {
  _id: Id<"faqs">;
  question: string;
  answer: string;
  order: number;
};

export const faqsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["faqs"],
    queryFn: async (): Promise<any[]> => {
      try {
        const faqs = await convex.query(api.settings.getFAQs);
        idbRefresh("faqs", faqs);
        return faqs;
      } catch (e) {
        const cachedFaqs = await idbGet("faqs");
        return Array.isArray(cachedFaqs) ? (cachedFaqs as CachedFaq[]) : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
  }),
);

export const useGetFAQs = () => {
  const result = useLiveQuery((q) => q.from({ faqs: faqsCollection }));
  return result as typeof result & { data: CachedFaq[] };
};
