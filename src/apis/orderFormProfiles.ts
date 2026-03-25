/**
 * Order Form Profile API
 * Manages reusable order form configuration profiles
 * Profiles can be assigned to: store (default) or individual products
 */

import {
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  getUserFunction,
} from "@biqpod/app/ui/apis";
// SnapBuy project ID
const SNAPBUY_PROJECT_ID = "74510af6-4dc2-47b3-b5d5-b07b559aede7";

export interface OrderFormProfile {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  allowQuantityControl: boolean;
  requireBuyerNotes: boolean;
  notesPlaceholder: string;
  maxNotesLength: number;
  showProductImages: boolean;
  showProductDescription: boolean;
  allowMultipleProducts: boolean;
  requireDeliveryAddress: boolean;
  requirePhoneNumber: boolean;
  showStoreInformation: boolean;
  customMessage?: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  usageCount?: number; // Number of products using this profile
}

const defaultProfileTemplate: Omit<
  OrderFormProfile,
  "id" | "storeId" | "createdAt" | "updatedAt"
> = {
  name: "Default Profile",
  description: "Default order form configuration",
  allowQuantityControl: true,
  requireBuyerNotes: false,
  notesPlaceholder: "Add any special instructions or preferences...",
  maxNotesLength: 500,
  showProductImages: true,
  showProductDescription: true,
  allowMultipleProducts: true,
  requireDeliveryAddress: true,
  requirePhoneNumber: true,
  showStoreInformation: true,
  isDefault: true,
};

/**
 * Create a new order form profile via backend
 */
export async function createOrderFormProfile(
  storeId: string,
  profile: Omit<OrderFormProfile, "id" | "storeId" | "createdAt" | "updatedAt">
): Promise<OrderFormProfile> {
  try {
    const createProfileFn = await getUserFunction<
      { data: OrderFormProfile },
      {
        storeId: string;
        profile: Omit<
          OrderFormProfile,
          "id" | "storeId" | "createdAt" | "updatedAt"
        >;
      }
    >("snapbuy-create-order-form-profile");

    if (!createProfileFn) {
      throw new Error("Function not available");
    }

    const result = await createProfileFn({ storeId, profile });
    return result.data;
  } catch (error) {
    console.error("Error creating order form profile:", error);
    throw error;
  }
}

/**
 * Get all order form profiles for a store via backend
 */
export async function getAllOrderFormProfiles(
  storeId: string
): Promise<OrderFormProfile[]> {
  try {
    const listProfilesFn = await getUserFunction<
      { data: OrderFormProfile[] },
      { storeId: string }
    >("snapbuy-list-order-form-profiles");

    if (!listProfilesFn) {
      return [];
    }

    const result = await listProfilesFn({ storeId });
    return result.data || [];
  } catch (error) {
    console.error("Error fetching order form profiles:", error);
    return [];
  }
}

/**
 * Get a specific order form profile
 */
export async function getOrderFormProfile(
  storeId: string,
  profileId: string
): Promise<OrderFormProfile | null> {
  try {
    const profileRef = [
      "projects",
      SNAPBUY_PROJECT_ID,
      "stores",
      storeId,
      "orderFormProfiles",
      profileId,
    ];

    return await getDoc<OrderFormProfile>(profileRef);
  } catch (error) {
    console.error("Error fetching order form profile:", error);
    return null;
  }
}

/**
 * Update an order form profile via backend
 */
export async function updateOrderFormProfile(
  storeId: string,
  profileId: string,
  updates: Partial<OrderFormProfile>
): Promise<OrderFormProfile> {
  try {
    const updateProfileFn = await getUserFunction<
      { data: OrderFormProfile },
      {
        storeId: string;
        profileId: string;
        updates: Partial<OrderFormProfile>;
      }
    >("snapbuy-update-order-form-profile");

    if (!updateProfileFn) {
      throw new Error("Function not available");
    }

    const result = await updateProfileFn({ storeId, profileId, updates });
    return result.data;
  } catch (error) {
    console.error("Error updating order form profile:", error);
    throw error;
  }
}

/**
 * Delete an order form profile via backend
 */
export async function deleteOrderFormProfile(
  storeId: string,
  profileId: string
): Promise<void> {
  try {
    const deleteProfileFn = await getUserFunction<
      { data: { success: boolean } },
      { storeId: string; profileId: string }
    >("snapbuy-delete-order-form-profile");

    if (!deleteProfileFn) {
      throw new Error("Function not available");
    }

    await deleteProfileFn({ storeId, profileId });
  } catch (error) {
    console.error("Error deleting order form profile:", error);
    throw error;
  }
}

/**
 * Set store default order form profile
 */
export async function setStoreDefaultProfile(
  storeId: string,
  profileId: string
): Promise<void> {
  try {
    const storeRef = ["projects", SNAPBUY_PROJECT_ID, "stores", storeId];
    await setDoc(storeRef, {
      defaultOrderFormProfileId: profileId,
    });
  } catch (error) {
    console.error("Error setting store default profile:", error);
    throw error;
  }
}

/**
 * Get store's default order form profile
 */
export async function getStoreDefaultProfile(
  storeId: string
): Promise<OrderFormProfile | null> {
  try {
    const storeRef = ["projects", SNAPBUY_PROJECT_ID, "stores", storeId];
    const store = await getDoc<any>(storeRef);

    if (store?.defaultOrderFormProfileId) {
      return await getOrderFormProfile(
        storeId,
        store.defaultOrderFormProfileId
      );
    }

    // Return first profile or create default
    const profiles = await getAllOrderFormProfiles(storeId);
    if (profiles.length > 0) {
      return profiles[0];
    }

    // Create default profile if none exists
    return await createOrderFormProfile(storeId, defaultProfileTemplate);
  } catch (error) {
    console.error("Error getting store default profile:", error);
    return null;
  }
}

/**
 * Assign profile to a product
 */
export async function assignProfileToProduct(
  productId: string,
  profileId: string
): Promise<void> {
  try {
    const productRef = ["projects", SNAPBUY_PROJECT_ID, "products", productId];
    await setDoc(productRef, {
      orderFormProfileId: profileId,
    });
  } catch (error) {
    console.error("Error assigning profile to product:", error);
    throw error;
  }
}

/**
 * Get profile for a product (or fall back to store default)
 */
export async function getProductOrderFormProfile(
  productId: string,
  storeId: string
): Promise<OrderFormProfile | null> {
  try {
    // First check if product has specific profile
    const productRef = ["projects", SNAPBUY_PROJECT_ID, "products", productId];
    const product = await getDoc<any>(productRef);

    if (product?.orderFormProfileId) {
      return await getOrderFormProfile(storeId, product.orderFormProfileId);
    }

    // Fall back to store default
    return await getStoreDefaultProfile(storeId);
  } catch (error) {
    console.error("Error getting product order form profile:", error);
    return null;
  }
}

/**
 * Duplicate a profile
 */
export async function duplicateOrderFormProfile(
  storeId: string,
  sourceProfileId: string,
  newName: string
): Promise<OrderFormProfile> {
  try {
    const sourceProfile = await getOrderFormProfile(storeId, sourceProfileId);
    if (!sourceProfile) {
      throw new Error("Source profile not found");
    }

    const newProfile = {
      ...sourceProfile,
      name: newName,
      isDefault: false,
    };

    return await createOrderFormProfile(storeId, newProfile);
  } catch (error) {
    console.error("Error duplicating profile:", error);
    throw error;
  }
}

/**
 * Get usage count for a profile
 */
export async function getProfileUsageCount(
  storeId: string,
  profileId: string
): Promise<number> {
  try {
    // This would require querying all products with this profile
    // For now, return the stored usage count
    const profile = await getOrderFormProfile(storeId, profileId);
    return profile?.usageCount || 0;
  } catch (error) {
    console.error("Error getting profile usage count:", error);
    return 0;
  }
}
