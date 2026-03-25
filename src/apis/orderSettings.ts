import { Biqpod } from "@biqpod/app/ui/types";
import { getDoc, setDoc } from "@biqpod/app/ui/apis";

// SnapBuy project ID
const SNAPBUY_PROJECT_ID = "74510af6-4dc2-47b3-b5d5-b07b559aede7";

/**
 * Order Settings API
 * Manages seller-configured order form settings
 */

export interface OrderFormSettings extends Biqpod.Snapbuy.Store {
  orderFormSettings?: {
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
    updatedAt?: number;
  };
}

const defaultOrderSettings = {
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
};

/**
 * Get order form settings for a specific store
 */
export async function getOrderFormSettings(storeId: string) {
  try {
    const storeRef = ["projects", SNAPBUY_PROJECT_ID, "stores", storeId];
    const store = await getDoc<OrderFormSettings>(storeRef);

    if (store?.orderFormSettings) {
      return store.orderFormSettings;
    }

    return defaultOrderSettings;
  } catch (error) {
    console.error("Error fetching order form settings:", error);
    return defaultOrderSettings;
  }
}

/**
 * Save order form settings for a specific store
 */
export async function saveOrderFormSettings(
  storeId: string,
  settings: typeof defaultOrderSettings
) {
  try {
    const storeRef = ["projects", SNAPBUY_PROJECT_ID, "stores", storeId];

    await setDoc(storeRef, {
      orderFormSettings: {
        ...settings,
        updatedAt: Date.now(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error saving order form settings:", error);
    throw error;
  }
}

/**
 * Reset order form settings to defaults
 */
export async function resetOrderFormSettings(storeId: string) {
  return saveOrderFormSettings(storeId, defaultOrderSettings);
}

/**
 * Get specific setting value
 */
export async function getOrderFormSetting(
  storeId: string,
  settingKey: keyof typeof defaultOrderSettings
) {
  const settings = await getOrderFormSettings(storeId);
  return settings[settingKey];
}

/**
 * Update a single setting
 */
export async function updateOrderFormSetting(
  storeId: string,
  settingKey: keyof typeof defaultOrderSettings,
  value: any
) {
  const currentSettings = await getOrderFormSettings(storeId);
  const updatedSettings = {
    ...currentSettings,
    [settingKey]: value,
  };
  return saveOrderFormSettings(storeId, updatedSettings);
}
