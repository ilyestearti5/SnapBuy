import { useEffect } from "react";
import { Biqpod } from "@biqpod/app/ui/types";
import { getIndexedDBItem, setIndexedDBItem } from "@biqpod/app/ui/hooks";

const MAX_RECENT_STORES = 5;

interface RecentStoresData {
  userId: string;
  stores: Biqpod.Snapbuy.Store[];
  lastUpdated: number;
}

/**
 * Hook to track store visits and save to IndexedDB
 * @param storeId - The ID of the store being visited
 * @param storeData - The store data to save
 * @param userId - The current user's ID
 */
export const useStoreVisit = (
  storeId: string | null | undefined,
  storeData: Biqpod.Snapbuy.Store | null | undefined,
  userId: string | null | undefined
) => {
  useEffect(() => {
    if (!storeId || !storeData || !userId) return;

    const trackVisit = async () => {
      try {
        const key = `recently-visited-${userId}`;

        // Get existing data
        const existingData = await getIndexedDBItem<RecentStoresData>(key);

        // Update the stores list
        let stores: Biqpod.Snapbuy.Store[] = [];

        if (existingData?.stores) {
          // Remove the current store if it exists
          stores = existingData.stores.filter((s) => s.id !== storeId);
        }

        // Add the current store to the beginning
        stores.unshift(storeData);

        // Keep only the most recent stores
        stores = stores.slice(0, MAX_RECENT_STORES);

        // Save updated data
        const updatedData: RecentStoresData = {
          userId,
          stores,
          lastUpdated: Date.now(),
        };

        await setIndexedDBItem(key, updatedData);
      } catch (error) {
        console.error("Error tracking store visit:", error);
      }
    };

    trackVisit();
  }, [storeId, storeData, userId]);
};

/**
 * Utility function to get recently visited stores
 * @param userId - The user's ID
 * @returns Promise resolving to array of recently visited stores
 */
export const getRecentlyVisitedStores = async (
  userId: string
): Promise<Biqpod.Snapbuy.Store[]> => {
  try {
    const key = `recently-visited-${userId}`;
    const data = await getIndexedDBItem<RecentStoresData>(key);
    return data?.stores || [];
  } catch (error) {
    console.error("Error getting recent stores:", error);
    return [];
  }
};

/**
 * Utility function to clear recently visited stores
 * @param userId - The user's ID
 */
export const clearRecentlyVisitedStores = async (
  userId: string
): Promise<void> => {
  try {
    const key = `recently-visited-${userId}`;
    await setIndexedDBItem(key, null);
  } catch (error) {
    console.error("Error clearing recent stores:", error);
  }
};
