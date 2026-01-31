import { useEffect, useState } from "react";
import { fileStorage } from "@/hooks/storage/indexeddb";
import { StoredFile } from "@/hooks/storage/mod";

export function useGetIndexedDBImg(id: number | null): string | null {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log('hi')
    if (!id) {
      console.log('no id ')
      setImgUrl(null);
      return;
    }

    let objectUrl: string | null = null;

    const fetchImg = async () => {
      try {
        const file: StoredFile | null = await fileStorage.get(id);
        const all_images = await fileStorage.getAll()
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
