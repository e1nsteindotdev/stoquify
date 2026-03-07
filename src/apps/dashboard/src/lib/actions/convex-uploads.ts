import { api } from "api/convex";
import { convex } from "@/lib/convex-client";
import { Id } from "api/data-model";

export function getImageUrl(storageId: Id<"_storage">) {
  return convex.query(api.images.getUrl, { storageId });
}

export function generateUploadUrl() {
  return convex.mutation(api.images.uploadUrl, {});
}
