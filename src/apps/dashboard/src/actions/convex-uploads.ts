import { api } from "convex-api/convex";
import { convex } from "@/lib/convex-client";

export function getImageUrl(storageId: string) {
  return convex.query(api.uploads.getUrl, { storageId })
}

export function generateUploadUrl() {
  return convex.mutation(api.uploads.generateUploadUrl, {})
}
