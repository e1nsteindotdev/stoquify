import { useEffect, useState } from "react";
import { fileStorage } from "@/hooks/storage/indexeddb";
import { StoredFile } from "@/hooks/storage/mod";

export function useGetIndexedDBImg(id: number | null): string | null {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setImgUrl(null);
      return;
    }

    let objectUrl: string | null = null;

    const fetchImg = async () => {
      try {
        const file: StoredFile | null = await fileStorage.get(id);
        const all = await fileStorage.getAll()
        console.log('all files :', all)
        // console.log("file : ", file)
        if (file?.blob) {
          objectUrl = URL.createObjectURL(file.blob);
          setImgUrl(objectUrl);
        } else {
          setImgUrl(null);
        }
      } catch (error) {
        console.error("Error fetching image from IndexedDB:", error);
        setImgUrl(null);
      }
    };

    fetchImg();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  return imgUrl;
}
