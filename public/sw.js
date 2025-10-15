// Service Worker for Souqify notifications
// This enables notifications to work even when the app is closed

const CACHE_NAME = "snapbuy-notifications-v1";

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const options = event.data.payload;

    self.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || "/icon.png",
      badge: options.badge || "/icon.png",
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data,
      actions: [
        {
          action: "view",
          title: "View",
          icon: "/assets/snapbuy.png",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    });
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data;

  if (event.action === "dismiss") {
    return;
  }

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes("snapbuy") && "focus" in client) {
          // Navigate to relevant page based on notification type
          if (data) {
            let targetUrl = "/";

            switch (data.type) {
              case "new-order":
              case "status-change":
              case "order-completed":
              case "order-cancelled":
              case "order-processing":
              case "order-delivery":
                targetUrl = `/orders/${data.orderId}`;
                break;
              case "low-stock":
              case "new-product":
                targetUrl = `/product/${data.productId}`;
                break;
              case "new-client":
                targetUrl = `/clients/${data.clientId}`;
                break;
            }

            client.postMessage({
              type: "NAVIGATE",
              url: targetUrl,
            });
          }

          return client.focus();
        }
      }

      // If app is not open, open it
      if (clients.openWindow) {
        let targetUrl = "/";

        if (data) {
          switch (data.type) {
            case "new-order":
            case "status-change":
            case "order-completed":
            case "order-cancelled":
            case "order-processing":
            case "order-delivery":
              targetUrl = `/orders/${data.orderId}`;
              break;
            case "low-stock":
            case "new-product":
              targetUrl = `/product/${data.productId}`;
              break;
            case "new-client":
              targetUrl = `/clients/${data.clientId}`;
              break;
          }
        }

        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle push events (for future server-sent push notifications)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icon.png",
        badge: data.badge || "/icon.png",
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        actions: [
          {
            action: "view",
            title: "View",
            icon: "/assets/snapbuy.png",
          },
          {
            action: "dismiss",
            title: "Dismiss",
          },
        ],
      })
    );
  }
});

// Install event
self.addEventListener("install", (event) => {
  console.log("Souqify Service Worker installed");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Souqify Service Worker activated");
  event.waitUntil(clients.claim());
});
