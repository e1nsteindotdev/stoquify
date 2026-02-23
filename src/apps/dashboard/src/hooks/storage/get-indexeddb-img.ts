import { LocalFiles } from "@/lib/services/files-service";
import { effectRuntime } from "@/lib/effect-runtime";
import { useEffect, useState, useRef } from "react";
import { Effect } from "effect";

export function useGetIndexedDBImg(id: number) {
  const [url, setUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const program = Effect.gen(function*() {
      const files = yield* LocalFiles
      return yield* files.read(id)
    })

    async function getImage() {
      const value = await effectRuntime.runPromise(program)
      urlRef.current = value;
      setUrl(value)
    }
    getImage()

    return () => {
      if (urlRef.current)
        URL.revokeObjectURL(urlRef.current);
    }
  }, [id]);

  return url
}
