// Browser notification service for Souqify
// This handles native browser notifications that work even when the app is closed

import {
  getOrderClientInfo,
  getOrderClientDisplayName,
} from "./orderClientInfo";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    // Register service worker for push notifications
    if ("serviceWorker" in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  // Request notification permission from user
  public async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Check if notifications are supported and permitted
  public isSupported(): boolean {
    return "Notification" in window;
  }

  public isPermitted(): boolean {
    return Notification.permission === "granted";
  }

  // Send a local notification (works when app is open)
  public async sendLocalNotification(
    options: NotificationOptions
  ): Promise<Notification | null> {
    if (!this.isSupported() || !this.isPermitted()) {
      console.warn("Notifications not supported or not permitted");
      return null;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/icon.png",
      badge: options.badge || "/icon.png",
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data,
    });

    // Auto-close after 5 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  }

  // Send a push notification (works even when app is closed, requires service worker)
  public async sendPushNotification(
    options: NotificationOptions
  ): Promise<void> {
    if (!this.swRegistration) {
      console.error("Service worker not registered");
      return;
    }

    if (!this.isPermitted()) {
      console.warn("Notification permission not granted");
      return;
    }

    // Send message to service worker to show notification
    if (this.swRegistration.active) {
      this.swRegistration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        payload: options,
      });
    }
  }

  // Send notification (automatically chooses best method)
  public async sendNotification(options: NotificationOptions): Promise<void> {
    try {
      await this.requestPermission();

      // Try push notification first (works when app is closed)
      if (this.swRegistration && this.swRegistration.active) {
        await this.sendPushNotification(options);
      } else {
        // Fallback to local notification (only works when app is open)
        await this.sendLocalNotification(options);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }
}

// Store-specific notification handlers
export class StoreNotificationHandler {
  private notificationService: NotificationService;
  private storeId: string;
  private storeNotifySettings: Souqify.Store["notify"];

  constructor(storeId: string, notifySettings: Souqify.Store["notify"]) {
    this.notificationService = NotificationService.getInstance();
    this.storeId = storeId;
    this.storeNotifySettings = notifySettings || {};
  }

  // Update notification settings
  public updateSettings(notifySettings: Souqify.Store["notify"]) {
    this.storeNotifySettings = notifySettings || {};
  }

  // New order notification
  public async notifyNewOrder(order: Souqify.Order): Promise<void> {
    if (!this.storeNotifySettings?.newOrder) return;

    const clientInfo = await getOrderClientInfo(order);
    const clientName = getOrderClientDisplayName(clientInfo);

    await this.notificationService.sendNotification({
      title: "🛒 New Order Received!",
      body: `Order from ${clientName} - Total: ${order.totalPrice || 0} DA`,
      icon: "/assets/snapbuy.png",
      tag: `new-order-${order.id}`,
      requireInteraction: true,
      data: {
        type: "new-order",
        orderId: order.id,
        storeId: this.storeId,
      },
    });
  }

  // Order status change notification
  public async notifyOrderStatusChanged(
    order: Souqify.Order,
    oldStatus: Souqify.OrderStatus
  ): Promise<void> {
    if (!this.storeNotifySettings?.orderStatusChanged) return;

    const statusEmojis: Record<Souqify.OrderStatus, string> = {
      pending: "⏳",
      processing: "🔄",
      delivery: "🚚",
      completed: "✅",
      done: "🎉",
      cancelled: "❌",
    };

    await this.notificationService.sendNotification({
      title: `${statusEmojis[order.status]} Order Status Updated`,
      body: `Order #${order.id.slice(-6)} changed from ${oldStatus} to ${
        order.status
      }`,
      icon: "/assets/snapbuy.png",
      tag: `status-change-${order.id}`,
      data: {
        type: "status-change",
        orderId: order.id,
        storeId: this.storeId,
        newStatus: order.status,
        oldStatus,
      },
    });
  }

  // Order completed notification
  public async notifyOrderCompleted(order: Souqify.Order): Promise<void> {
    if (!this.storeNotifySettings?.orderCompleted) return;

    const clientInfo = await getOrderClientInfo(order);
    const clientName = getOrderClientDisplayName(clientInfo);

    await this.notificationService.sendNotification({
      title: "🎉 Order Completed!",
      body: `Order from ${clientName} has been completed`,
      icon: "/assets/snapbuy.png",
      tag: `completed-${order.id}`,
      data: {
        type: "order-completed",
        orderId: order.id,
        storeId: this.storeId,
      },
    });
  }

  // Order cancelled notification
  public async notifyOrderCancelled(order: Souqify.Order): Promise<void> {
    if (!this.storeNotifySettings?.orderCancelled) return;

    const clientInfo = await getOrderClientInfo(order);
    const clientName = getOrderClientDisplayName(clientInfo);

    await this.notificationService.sendNotification({
      title: "❌ Order Cancelled",
      body: `Order from ${clientName} has been cancelled`,
      icon: "/assets/snapbuy.png",
      tag: `cancelled-${order.id}`,
      data: {
        type: "order-cancelled",
        orderId: order.id,
        storeId: this.storeId,
      },
    });
  }

  // Order deleted notification
  public async notifyOrderDeleted(order: Souqify.Order): Promise<void> {
    if (!this.storeNotifySettings?.orderCancelled) return; // Use same setting as cancelled

    const clientInfo = await getOrderClientInfo(order);
    const clientName = getOrderClientDisplayName(clientInfo);

    await this.notificationService.sendNotification({
      title: "🗑️ Order Deleted",
      body: `Order from ${clientName} has been deleted`,
      icon: "/assets/snapbuy.png",
      tag: `deleted-${order.id}`,
      data: {
        type: "order-deleted",
        orderId: order.id,
        storeId: this.storeId,
      },
    });
  }

  // Order processing notification
  public async notifyOrderProcessing(order: Souqify.Order): Promise<void> {
    if (!this.storeNotifySettings?.orderProcessing) return;

    const clientInfo = await getOrderClientInfo(order);
    const clientName = getOrderClientDisplayName(clientInfo);

    await this.notificationService.sendNotification({
      title: "🔄 Order Processing",
      body: `Order from ${clientName} is now being processed`,
      icon: "/assets/snapbuy.png",
      tag: `processing-${order.id}`,
      data: {
        type: "order-processing",
        orderId: order.id,
        storeId: this.storeId,
      },
    });
  }

  // Order delivery notification
  public async notifyOrderDelivery(order: Souqify.Order): Promise<void> {
    if (!this.storeNotifySettings?.orderDelivery) return;

    const clientInfo = await getOrderClientInfo(order);
    const clientName = getOrderClientDisplayName(clientInfo);

    await this.notificationService.sendNotification({
      title: "🚚 Order Out for Delivery",
      body: `Order from ${clientName} is out for delivery`,
      icon: "/assets/snapbuy.png",
      tag: `delivery-${order.id}`,
      data: {
        type: "order-delivery",
        orderId: order.id,
        storeId: this.storeId,
      },
    });
  }

  // Low stock notification
  public async notifyLowStock(product: Souqify.Product): Promise<void> {
    if (!this.storeNotifySettings?.lowStock) return;

    await this.notificationService.sendNotification({
      title: "⚠️ Low Stock Alert",
      body: `${product.name} is running low (${
        product.quantity || 0
      } remaining)`,
      icon: "/assets/snapbuy.png",
      tag: `low-stock-${product.id}`,
      data: {
        type: "low-stock",
        productId: product.id,
        storeId: this.storeId,
      },
    });
  }

  // New product notification
  public async notifyNewProduct(product: Souqify.Product): Promise<void> {
    if (!this.storeNotifySettings?.newProduct) return;

    await this.notificationService.sendNotification({
      title: "📦 New Product Added",
      body: `${product.name} has been added to your store`,
      icon: "/assets/snapbuy.png",
      tag: `new-product-${product.id}`,
      data: {
        type: "new-product",
        productId: product.id,
        storeId: this.storeId,
      },
    });
  }

  // New client notification
  public async notifyNewClient(client: Souqify.Client): Promise<void> {
    if (!this.storeNotifySettings?.newClient) return;

    await this.notificationService.sendNotification({
      title: "👥 New Client Registered",
      body: `${client.firstname} ${client.lastname} has joined your store`,
      icon: "/assets/snapbuy.png",
      tag: `new-client-${client.id}`,
      data: {
        type: "new-client",
        clientId: client.id,
        storeId: this.storeId,
      },
    });
  }
}

// Export singleton instance for easy access
export const notificationService = NotificationService.getInstance();
