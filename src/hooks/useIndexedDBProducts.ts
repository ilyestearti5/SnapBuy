import { useEffect, useState, useCallback } from "react";
interface CachedProductsData {
  products: SnapBuy.Product[];
  lastDoc: SnapBuy.Product | null;
  storeId: string;
  timestamp: number;
}
const DB_NAME = "SnapBuyCache";
const STORE_NAME = "products";
const DB_VERSION = 1;
// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "storeId" });
      }
    };
  });
};
const CACH_TIME_SEC = 1 * 60; // 1 minute
// Get cached data for a store
const getCachedData = async (
  storeId: string
): Promise<CachedProductsData | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(storeId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const data = request.result as CachedProductsData | undefined;
        if (data && Date.now() - data.timestamp > CACH_TIME_SEC * 1000) {
          // Cache expired, clear it
          clearCachedData(storeId);
          resolve(null);
        } else {
          resolve(data || null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error getting cached data:", error);
    return null;
  }
};
// Save cached data for a store
const saveCachedData = async (
  storeId: string,
  products: SnapBuy.Product[],
  lastDoc: SnapBuy.Product | null
): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const data: CachedProductsData = {
      products,
      lastDoc,
      storeId,
      timestamp: Date.now(),
    };
    store.put(data);
  } catch (error) {
    console.error("Error saving cached data:", error);
  }
};
// Clear cached data for a store
const clearCachedData = async (storeId: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(storeId);
  } catch (error) {
    console.error("Error clearing cached data:", error);
  }
};
export const useIndexedDBProducts = (storeId: string | null | undefined) => {
  const [products, setProducts] = useState<SnapBuy.Product[]>([]);
  const [lastDoc, setLastDoc] = useState<SnapBuy.Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Load cached data on mount or storeId change
  useEffect(() => {
    if (!storeId) {
      setProducts([]);
      setLastDoc(null);
      setIsLoading(false);
      return;
    }
    const loadCachedData = async () => {
      setIsLoading(true);
      try {
        const cached = await getCachedData(storeId);
        if (cached) {
          setProducts(cached.products);
          setLastDoc(cached.lastDoc);
        } else {
          setProducts([]);
          setLastDoc(null);
        }
      } catch (error) {
        console.error("Error loading cached products:", error);
        setProducts([]);
        setLastDoc(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadCachedData();
  }, [storeId]);
  // Update products and save to cache
  const updateProducts = useCallback(
    (newProducts: SnapBuy.Product[], newLastDoc: SnapBuy.Product | null) => {
      setProducts(newProducts);
      setLastDoc(newLastDoc);
      if (storeId) {
        saveCachedData(storeId, newProducts, newLastDoc);
      }
    },
    [storeId]
  );
  // Add more products (for pagination)
  const addProducts = useCallback(
    (
      additionalProducts: SnapBuy.Product[],
      newLastDoc: SnapBuy.Product | null
    ) => {
      setProducts((prev) => {
        const updated = [...prev, ...additionalProducts];
        const newArray = Array.from(new Set(updated.map((p) => p.id))).map(
          (id) => updated.find((p) => p.id === id)!
        );
        setLastDoc(newLastDoc);
        if (storeId) {
          saveCachedData(storeId, newArray, newLastDoc);
        }
        return newArray;
      });
    },
    [storeId]
  );
  // Clear cache for current store
  const clearCache = useCallback(() => {
    if (storeId) {
      clearCachedData(storeId);
      setProducts([]);
      setLastDoc(null);
    }
  }, [storeId]);
  return {
    products,
    lastDoc,
    isLoading,
    updateProducts,
    addProducts,
    clearCache,
  };
};
