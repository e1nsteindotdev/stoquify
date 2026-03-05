import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";
import { idbGet, idbRefresh } from "@/lib/idb";

export const settingsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["settings"],
    queryFn: async (): Promise<any[]> => {
      console.log("[settings] queryFn running");
      try {
        const settings = await convex.query(api.settings.getSettings);
        const normalizedSettings = Array.isArray(settings)
          ? settings
          : settings
            ? [settings]
            : [];
        idbRefresh("settings", normalizedSettings);
        return normalizedSettings;
      } catch (e) {
        const cachedSettings = await idbGet("settings");
        return Array.isArray(cachedSettings) ? cachedSettings : [];
      }
    },
    queryClient: queryClient,
    getKey: (item) => item?._id,
    syncMode: "eager",
    staleTime: 24 * 60 * 60 * 1000,
  }),
);

export const useGetSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const settings = await convex.query(api.settings.getSettings);
        idbRefresh("settings", settings);
        return settings;
      } catch (e) {
        const cachedSettings = await idbGet("settings");
        if (Array.isArray(cachedSettings)) {
          return cachedSettings[0] ?? null;
        }
        return cachedSettings ?? null;
      }
    },
  });
};
