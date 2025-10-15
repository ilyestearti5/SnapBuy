// Integration utilities for order notifications
// This file provides easy-to-use functions to integrate notifications into existing order workflows

import { StoreNotificationHandler } from "./notifications";
import { snapbuyApi } from "../apis";

// Global notification handlers cache to avoid recreating instances
const notificationHandlers = new Map<string, StoreNotificationHandler>();

// Get or create notification handler for a store
export const getNotificationHandler = async (
  storeId: string
): Promise<StoreNotificationHandler | null> => {
  // Check cache first
  if (notificationHandlers.has(storeId)) {
    return notificationHandlers.get(storeId)!;
  }

  try {
    // Get store data to access notification settings
    const store = await snapbuyApi.getStore(storeId);
    if (!store) return null;

    // Create new handler
    const handler = new StoreNotificationHandler(storeId, store.notify);
    notificationHandlers.set(storeId, handler);

    return handler;
  } catch (error) {
    console.error("Failed to get notification handler:", error);
    return null;
  }
};

// Clear handler cache when store settings are updated
export const clearNotificationCache = (storeId?: string) => {
  if (storeId) {
    notificationHandlers.delete(storeId);
  } else {
    notificationHandlers.clear();
  }
};

// Convenience function for new order notifications
export const notifyNewOrder = async (
  storeId: string,
  order: Souqify.Order
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyNewOrder(order);
  }
};

// Convenience function for order status change notifications
export const notifyOrderStatusChange = async (
  storeId: string,
  order: Souqify.Order,
  oldStatus: Souqify.OrderStatus
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyOrderStatusChanged(order, oldStatus);
  }
};

// Convenience function for order completion notifications
export const notifyOrderCompleted = async (
  storeId: string,
  order: Souqify.Order
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyOrderCompleted(order);
  }
};

// Convenience function for order cancellation notifications
export const notifyOrderCancelled = async (
  storeId: string,
  order: Souqify.Order
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyOrderCancelled(order);
  }
};

// Convenience function for order deletion notifications
export const notifyOrderDeleted = async (
  storeId: string,
  order: Souqify.Order
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyOrderDeleted(order);
  }
};

// Convenience function for low stock notifications
export const notifyLowStock = async (
  storeId: string,
  product: Souqify.Product
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyLowStock(product);
  }
};

// Convenience function for new product notifications
export const notifyNewProduct = async (
  storeId: string,
  product: Souqify.Product
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyNewProduct(product);
  }
};

// Convenience function for new client notifications
export const notifyNewClient = async (
  storeId: string,
  client: Souqify.Client
): Promise<void> => {
  const handler = await getNotificationHandler(storeId);
  if (handler) {
    await handler.notifyNewClient(client);
  }
};

// Example of how to integrate into existing order creation:
/*
// In your existing order creation code (e.g., CartPopup.tsx):

import { notifyNewOrder } from '../utils/orderNotifications';

const orderCreationAction = useAction(
  "create-order",
  async () => {
    // ... existing validation code ...
    
    const options: CreateOrderOptions = {
      products,
      client: {
        firstname,
        lastname,
        phone,
        id: crypto.randomUUID(),
        place,
      },
      delivery: deliveryState.get || false,
      metaData: magicForms,
    };
    
    // Create the order
    const newOrder = await snapbuyApi.createOrder(options);
    
    // Send notification if order was created successfully
    if (newOrder && storeId) {
      await notifyNewOrder(storeId, newOrder);
    }
    
    closePopup();
    showToast("Order Created", "success");
    visibilityTemp.setTemp("client-form", false);
    deleteCart(storeId);
  },
  [...]
);
*/
