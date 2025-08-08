import { useEffect, useMemo } from "react";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { StoreNotificationHandler } from "./notifications";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";

// Hook to manage store notifications
export const useStoreNotifications = () => {
  const storeId = useStoreId();

  // Get store data including notification settings
  const store = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.getStore(storeId);
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
    notifyNewOrder: (order: SnapBuy.Order) =>
      notificationHandler?.notifyNewOrder(order),
    notifyOrderStatusChanged: (
      order: SnapBuy.Order,
      oldStatus: SnapBuy.OrderStatus
    ) => notificationHandler?.notifyOrderStatusChanged(order, oldStatus),
    notifyOrderCompleted: (order: SnapBuy.Order) =>
      notificationHandler?.notifyOrderCompleted(order),
    notifyOrderCancelled: (order: SnapBuy.Order) =>
      notificationHandler?.notifyOrderCancelled(order),
    notifyOrderProcessing: (order: SnapBuy.Order) =>
      notificationHandler?.notifyOrderProcessing(order),
    notifyOrderDelivery: (order: SnapBuy.Order) =>
      notificationHandler?.notifyOrderDelivery(order),
    notifyLowStock: (product: SnapBuy.Product) =>
      notificationHandler?.notifyLowStock(product),
    notifyNewProduct: (product: SnapBuy.Product) =>
      notificationHandler?.notifyNewProduct(product),
    notifyNewClient: (client: SnapBuy.Client) =>
      notificationHandler?.notifyNewClient(client),
  };
};

// Example usage in components:
// const MyComponent = () => {
//   const { notifyNewOrder, notifyOrderStatusChanged, notifySettings } = useStoreNotifications();
//
//   const handleNewOrder = (order: SnapBuy.Order) => {
//     // Your existing order logic...
//
//     // Trigger notification if enabled
//     notifyNewOrder(order);
//   };
//
//   const handleStatusChange = (order: SnapBuy.Order, oldStatus: SnapBuy.OrderStatus) => {
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
