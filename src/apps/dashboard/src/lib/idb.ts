import { openDB, IDBPDatabase } from "idb";

let dbPromise: Promise<IDBPDatabase> | null = null;

const STORES = [
  "products",
  "users",
  "sales",
  "categories",
  "orders",
  "faqs",
  "collections",
  "settings",
  "analytics",
  "customers",
  "todos",
  "stores",
];

export const idbPromise = () => {
  if (!dbPromise) {
    dbPromise = openDB("app-db", 2, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        }
      },
    });
  }
  return dbPromise;
};

export async function idbGet(store: string) {
  try {
    const db = await idbPromise();
    return (await db.get(store, "all")) ?? [];
  } catch (e) {
    //    console.log("faild to preload products :", String(e));
    return null
  }

}

export async function idbPut(store: string, data: any) {
  const db = await idbPromise();
  await db.put(store, data, "all");
}

export async function idbClear(store: string) {
  const db = await idbPromise();
  await db.clear(store);
}

export async function idbRefresh(store: string, data: any) {
  const db = await idbPromise();
  try {
    await db.clear(store);
  } catch (e) {
    // console.log("clearing an idb store failed :", String(e));
  }
  try {
    await db.put(store, data, "all");
  } catch (e) {
    //console.log("puting into idb store failed :", String(e));
  }
}

export async function clearIDB() {
  STORES.forEach(async (store) => {
    try {
      await idbClear(store)
    } catch (e) {

    }
  })

}
