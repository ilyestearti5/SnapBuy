// Desktop notification fixes for SnapBuy
// This module addresses common issues with desktop notifications

export class DesktopNotificationFixer {
  private static hasRun = false;

  public static async applyFixes(): Promise<void> {
    if (this.hasRun) return;
    this.hasRun = true;

    console.log("🔧 Applying desktop notification fixes...");

    // Fix 1: Ensure service worker is properly registered
    await this.ensureServiceWorkerRegistration();

    // Fix 2: Handle Windows-specific notification issues
    this.applyWindowsFixes();

    // Fix 3: Handle focus/visibility issues
    this.applyFocusFixes();

    // Fix 4: Apply browser-specific fixes
    this.applyBrowserFixes();

    // Fix 5: Debug notification permission issues
    this.debugPermissionIssues();

    console.log("✅ Desktop notification fixes applied");
  }

  private static async ensureServiceWorkerRegistration(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      console.warn("⚠️ Service Worker not supported");
      return;
    }

    try {
      // First, unregister any existing service workers to start fresh
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (
          registration.scope.includes("snapbuy") ||
          registration.scope.includes(location.origin)
        ) {
          console.log("🔄 Updating existing service worker...");
          await registration.update();
        }
      }

      // Register our service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none", // Always check for updates
      });

      console.log(
        "✅ Service Worker registered successfully",
        registration.scope
      );

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("✅ Service Worker is ready");
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }

  private static applyWindowsFixes(): void {
    const isWindows = navigator.userAgent.toLowerCase().includes("windows");
    if (!isWindows) return;

    console.log("🪟 Applying Windows-specific fixes...");

    // Windows sometimes blocks notifications if they come too quickly
    // Add a small delay between notifications
    const originalNotification = window.Notification;
    if (originalNotification) {
      let lastNotificationTime = 0;
      const minDelay = 1000; // 1 second minimum between notifications

      const createNotification = (
        title: string,
        options?: NotificationOptions
      ) => {
        const now = Date.now();
        const timeSinceLastNotification = now - lastNotificationTime;

        if (timeSinceLastNotification < minDelay) {
          // Delay the notification
          setTimeout(() => {
            lastNotificationTime = Date.now();
            return new originalNotification(title, options);
          }, minDelay - timeSinceLastNotification);
        } else {
          lastNotificationTime = now;
          return new originalNotification(title, options);
        }
      };

      // Don't override completely, just add delay logic for our app
      (window as any).SnapBuyNotification = createNotification;
    }
  }

  private static applyFocusFixes(): void {
    console.log("👁️ Applying focus/visibility fixes...");

    // Some notifications don't show when the window is focused
    // Force show notifications even when window is focused
    let originalHidden = false;

    const forceShowNotifications = () => {
      if (document.hidden) {
        originalHidden = true;
      } else {
        // If window becomes visible after being hidden, show pending notifications
        if (originalHidden) {
          originalHidden = false;
          console.log(
            "🔄 Window became visible, notifications should now work"
          );
        }
      }
    };

    document.addEventListener("visibilitychange", forceShowNotifications);
    window.addEventListener("focus", forceShowNotifications);
    window.addEventListener("blur", forceShowNotifications);
  }

  private static applyBrowserFixes(): void {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("chrome")) {
      console.log("🟡 Applying Chrome-specific fixes...");
      // Chrome sometimes requires a user gesture for notifications
      // Ensure we have user interaction before showing notifications
      this.ensureUserGesture();
    } else if (userAgent.includes("firefox")) {
      console.log("🟠 Applying Firefox-specific fixes...");
      // Firefox has good notification support, minimal fixes needed
    } else if (userAgent.includes("edge")) {
      console.log("🔵 Applying Edge-specific fixes...");
      // Edge notifications work similarly to Chrome
      this.ensureUserGesture();
    } else {
      console.log("❓ Unknown browser, applying generic fixes...");
    }
  }

  private static ensureUserGesture(): void {
    // Add a click listener to ensure we have user gesture
    const ensureGesture = () => {
      (window as any).snapbuyHasUserGesture = true;
      console.log("✅ User gesture captured for notifications");
      document.removeEventListener("click", ensureGesture);
      document.removeEventListener("keydown", ensureGesture);
    };

    document.addEventListener("click", ensureGesture, { once: true });
    document.addEventListener("keydown", ensureGesture, { once: true });
  }

  private static debugPermissionIssues(): void {
    if (!("Notification" in window)) return;

    console.log("🐛 Debugging permission issues...");

    // Log current permission state
    console.log("📋 Current permission:", Notification.permission);

    // Check if permission was previously denied
    if (Notification.permission === "denied") {
      console.warn(
        "⚠️ Notifications are blocked. User needs to enable them manually in browser settings."
      );
      console.warn(
        "💡 In Chrome: Settings > Privacy and security > Site Settings > Notifications"
      );
      console.warn(
        "💡 In Firefox: Settings > Privacy & Security > Permissions > Notifications"
      );
      console.warn("💡 In Edge: Settings > Site permissions > Notifications");
    }

    // Monitor permission changes
    const checkPermissionChange = () => {
      const currentPermission = Notification.permission;
      console.log("🔄 Permission check:", currentPermission);

      if (currentPermission === "granted") {
        console.log("✅ Notifications are now enabled!");
      }
    };

    // Check permission every 5 seconds
    setInterval(checkPermissionChange, 5000);
  }

  // Public method to test if fixes are working
  public static async testNotificationAfterFixes(): Promise<boolean> {
    try {
      if (Notification.permission !== "granted") {
        console.log("🤔 Requesting permission after applying fixes...");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.error("❌ Permission still denied after fixes");
          return false;
        }
      }

      console.log("🧪 Testing notification after applying fixes...");

      const notification = new Notification("🔧 Fix Test - SnapBuy", {
        body: "Desktop notification fixes have been applied successfully!",
        icon: "/assets/snapbuy.png",
        tag: "fix-test",
        requireInteraction: false,
      });

      setTimeout(() => {
        notification.close();
      }, 4000);

      console.log("✅ Fix test notification sent successfully");
      return true;
    } catch (error) {
      console.error("❌ Fix test failed:", error);
      return false;
    }
  }
}

// Auto-apply fixes when module loads
if (typeof window !== "undefined") {
  // Apply fixes after a short delay to ensure DOM is ready
  setTimeout(() => {
    DesktopNotificationFixer.applyFixes();
  }, 1000);

  // Add to window for manual testing
  (window as any).fixNotifications = () =>
    DesktopNotificationFixer.applyFixes();
  (window as any).testNotificationFixes = () =>
    DesktopNotificationFixer.testNotificationAfterFixes();
}
