import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection } from "@tanstack/db";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/ts-query-client";
import { idbGet, idbRefresh, idbGetCursor, idbSetCursor } from "@/lib/idb";
import { computeNewCursor, mergeRows } from "@/lib/cursor-utils";

export const settingsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["settings"],
    queryFn: async (): Promise<any[]> => {
      const cursor = await idbGetCursor("settings");

      try {
        const settings = await convex.query(api.settings.get);
        const normalizedSettings = Array.isArray(settings)
          ? settings
          : settings
            ? [settings]
            : [];

        const cachedSettings = await idbGet<any[]>("settings");
        const mergedSettings = mergeRows(
          normalizedSettings,
          cachedSettings || [],
        );

        await idbRefresh("settings", mergedSettings);

        if (normalizedSettings.length > 0) {
          const newCursor = computeNewCursor(normalizedSettings);
          await idbSetCursor("settings", newCursor);
        }

        return mergedSettings;
      } catch (e) {
        const cachedSettings = await idbGet<any[]>("settings");
        return cachedSettings || [];
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
        const settings = await convex.query(api.settings.get);
        await idbRefresh("settings", settings);

        if (settings && !Array.isArray(settings)) {
          const newCursor = computeNewCursor([settings]);
          await idbSetCursor("settings", newCursor);
        }

        return settings;
      } catch (e) {
        const cachedSettings = await idbGet<any>("settings");
        if (Array.isArray(cachedSettings)) {
          return cachedSettings[0] ?? null;
        }
        return cachedSettings ?? null;
      }
    },
  });
};
