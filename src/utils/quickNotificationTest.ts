// Simple notification test utility for quick debugging
// This provides a standalone function that can be called from anywhere

import { notificationService } from "./notifications";

export async function quickNotificationTest(): Promise<void> {
  try {
    console.log("🔔 Starting quick notification test...");

    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.error("❌ Notifications not supported in this browser");
      alert(
        "Notifications are not supported in this browser. Please use Chrome, Firefox, or Edge."
      );
      return;
    }

    console.log("✅ Notifications are supported");

    // Check current permission
    console.log("📋 Current permission status:", Notification.permission);

    // Request permission if needed
    if (Notification.permission === "default") {
      console.log("🤔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("📝 Permission result:", permission);

      if (permission !== "granted") {
        console.error("❌ Permission denied");
        alert(
          "Notification permission was denied. Please enable notifications in your browser settings."
        );
        return;
      }
    }

    if (Notification.permission !== "granted") {
      console.error("❌ Permission not granted");
      alert(
        "Notification permission is required. Please enable notifications in your browser settings."
      );
      return;
    }

    console.log("✅ Permission granted, sending test notification...");

    // Create a simple test notification
    const notification = new Notification("🔔 Snapbuy Test", {
      body: "If you can see this notification, everything is working correctly!",
      icon: "/assets/snapbuy.png",
      tag: "quick-test",
      requireInteraction: false,
    });

    console.log("🚀 Test notification sent!");

    // Handle notification events
    notification.addEventListener("click", () => {
      console.log("👆 Notification clicked");
      notification.close();
      window.focus();
    });

    notification.addEventListener("show", () => {
      console.log("👁️ Notification shown");
    });

    notification.addEventListener("error", (error) => {
      console.error("❌ Notification error:", error);
    });

    notification.addEventListener("close", () => {
      console.log("🔕 Notification closed");
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
      console.log("⏰ Notification auto-closed after 5 seconds");
    }, 5000);

    // Also test through notification service
    setTimeout(async () => {
      console.log("🔄 Testing through notification service...");
      await notificationService.sendNotification({
        title: "🛠️ Service Test",
        body: "This is a test through the notification service",
        icon: "/assets/snapbuy.png",
        tag: "service-test",
      });
      console.log("✅ Service test completed");
    }, 1000);
  } catch (error) {
    console.error("💥 Quick notification test failed:", error);
    alert(`Notification test failed: ${error}`);
  }
}

// Function to show debugging information
export function showNotificationDebugInfo(): void {
  const info = {
    supported: "Notification" in window,
    permission: "Notification" in window ? Notification.permission : "N/A",
    serviceWorker: "serviceWorker" in navigator,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    timestamp: new Date().toISOString(),
  };

  console.log("🐛 Notification Debug Info:", info);

  // Also display in an alert for easy viewing
  const debugText = Object.entries(info)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  alert(`Notification Debug Info:\n\n${debugText}`);
}

// Add to window for easy testing from browser console
declare global {
  interface Window {
    testNotification: () => Promise<void>;
    notificationDebug: () => void;
  }
}

if (typeof window !== "undefined") {
  window.testNotification = quickNotificationTest;
  window.notificationDebug = showNotificationDebugInfo;
}
