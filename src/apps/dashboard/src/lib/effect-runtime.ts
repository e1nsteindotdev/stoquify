import { ManagedRuntime, Layer } from "effect";
import { Images } from "@/lib/services/image-service";
import { LocalFiles } from "./services/files-service";

const Dependencies = Layer.mergeAll(LocalFiles.layer, Images.layer);

export const effectRuntime = ManagedRuntime.make(Dependencies);
