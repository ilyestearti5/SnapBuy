import { useEffect, useMemo } from "react";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { StoreNotificationHandler } from "./notifications";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { Biqpod } from "@biqpod/app/ui/types";

// Hook to manage store notifications
export const useStoreNotifications = () => {
  const storeId = useStoreId();

  // Get store data including notification settings
  const store = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.store.get(storeId);
  }, [storeId]);

  // Create notification handler instance
  const notificationHandler = useMemo(() => {
    if (!storeId || !store) return null;

    return new StoreNotificationHandler(storeId, store.notify);
  }, [storeId, store?.notify]);

  // Update handler when notification settings change
  useEffect(() => {
    if (notificationHandler && store?.notify) {
      notificationHandler.updateSettings(store.notify);
    }
  }, [notificationHandler, store?.notify]);

  // Request notification permission on first load
  useEffect(() => {
    if (notificationHandler) {
      // Request permission when the handler is ready
      notificationHandler["notificationService"]
        .requestPermission()
        .catch(console.error);
    }
  }, [notificationHandler]);

  return {
    notificationHandler,
    store,
    isReady: !!notificationHandler,
    notifySettings: store?.notify || {},

    // Helper methods to trigger notifications
    notifyNewOrder: (order: Biqpod.Snapbuy.Order) =>
      notificationHandler?.notifyNewOrder(order),
    notifyOrderStatusChanged: (
      order: Biqpod.Snapbuy.Order,
      oldStatus: Biqpod.Snapbuy.OrderStatus
    ) => notificationHandler?.notifyOrderStatusChanged(order, oldStatus),
    notifyOrderCompleted: (order: Biqpod.Snapbuy.Order) =>
      notificationHandler?.notifyOrderCompleted(order),
    notifyOrderCancelled: (order: Biqpod.Snapbuy.Order) =>
      notificationHandler?.notifyOrderCancelled(order),
    notifyOrderProcessing: (order: Biqpod.Snapbuy.Order) =>
      notificationHandler?.notifyOrderProcessing(order),
    notifyOrderDelivery: (order: Biqpod.Snapbuy.Order) =>
      notificationHandler?.notifyOrderDelivery(order),
    notifyLowStock: (product: Biqpod.Snapbuy.Product) =>
      notificationHandler?.notifyLowStock(product),
    notifyNewProduct: (product: Biqpod.Snapbuy.Product) =>
      notificationHandler?.notifyNewProduct(product),
    notifyNewClient: (client: Biqpod.Snapbuy.Client) =>
      notificationHandler?.notifyNewClient(client),
  };
};

// Example usage in components:
// const MyComponent = () => {
//   const { notifyNewOrder, notifyOrderStatusChanged, notifySettings } = useStoreNotifications();
//
//   const handleNewOrder = (order: Biqpod.Snapbuy.Order) => {
//     // Your existing order logic...
//
//     // Trigger notification if enabled
//     notifyNewOrder(order);
//   };
//
//   const handleStatusChange = (order: Biqpod.Snapbuy.Order, oldStatus: Biqpod.Snapbuy.OrderStatus) => {
//     // Your existing status change logic...
//
//     // Trigger notification if enabled
//     notifyOrderStatusChanged(order, oldStatus);
//   };
//
//   return (
//     <div>
//       {notifySettings.newOrder && <span>✅ New order notifications enabled</span>}
//       {/* Your component JSX */}
//     </div>
//   );
// };
