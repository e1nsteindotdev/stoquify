import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;

if (!CONVEX_URL) {
  throw new Error("convex url doesn't exist in env");
}

export const convex = new ConvexReactClient(CONVEX_URL);
export const convexQueryClient = new ConvexQueryClient(convex);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});

// Connect the ConvexQueryClient to the QueryClient
convexQueryClient.connect(queryClient);
