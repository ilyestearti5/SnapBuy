// Notification Debugger for Souqify
// This utility helps diagnose notification issues on desktop

export interface NotificationDiagnostic {
  feature: string;
  status: "supported" | "not-supported" | "unknown";
  permission: NotificationPermission | "N/A";
  details: string;
  recommendation?: string;
}

export class NotificationDebugger {
  private diagnostics: NotificationDiagnostic[] = [];

  public async runDiagnostics(): Promise<NotificationDiagnostic[]> {
    this.diagnostics = [];

    // Check if browser supports notifications
    this.checkNotificationSupport();

    // Check notification permission
    this.checkNotificationPermission();

    // Check service worker support and registration
    await this.checkServiceWorker();

    // Check if desktop environment allows notifications
    this.checkDesktopEnvironment();

    // Check browser focus state
    this.checkDocumentVisibility();

    // Check notification settings
    this.checkNotificationSettings();

    return this.diagnostics;
  }

  private checkNotificationSupport(): void {
    if ("Notification" in window) {
      this.diagnostics.push({
        feature: "Notification API",
        status: "supported",
        permission: "N/A",
        details: "Browser supports the Notification API",
      });
    } else {
      this.diagnostics.push({
        feature: "Notification API",
        status: "not-supported",
        permission: "N/A",
        details: "Browser does not support the Notification API",
        recommendation:
          "Please use a modern browser like Chrome, Firefox, or Edge",
      });
    }
  }

  private checkNotificationPermission(): void {
    if ("Notification" in window) {
      const permission = Notification.permission;
      let details = "";
      let recommendation = "";

      switch (permission) {
        case "granted":
          details = "Notification permission is granted";
          break;
        case "denied":
          details = "Notification permission is denied";
          recommendation =
            "Enable notifications in browser settings: Settings > Privacy > Notifications";
          break;
        case "default":
          details = "Notification permission not requested yet";
          recommendation =
            'Click the "Enable Notifications" button to request permission';
          break;
      }

      this.diagnostics.push({
        feature: "Notification Permission",
        status: permission === "granted" ? "supported" : "not-supported",
        permission,
        details,
        recommendation,
      });
    }
  }

  private async checkServiceWorker(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          this.diagnostics.push({
            feature: "Service Worker",
            status: "supported",
            permission: "N/A",
            details: `Service Worker registered and active (scope: ${registration.scope})`,
          });
        } else {
          this.diagnostics.push({
            feature: "Service Worker",
            status: "not-supported",
            permission: "N/A",
            details: "Service Worker not registered",
            recommendation: "Refresh the page to register the service worker",
          });
        }
      } catch (error) {
        this.diagnostics.push({
          feature: "Service Worker",
          status: "not-supported",
          permission: "N/A",
          details: `Service Worker error: ${error}`,
          recommendation: "Check browser console for detailed error messages",
        });
      }
    } else {
      this.diagnostics.push({
        feature: "Service Worker",
        status: "not-supported",
        permission: "N/A",
        details: "Browser does not support Service Workers",
        recommendation: "Use a modern browser that supports Service Workers",
      });
    }
  }

  private checkDesktopEnvironment(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const isWindows = userAgent.includes("windows");
    const isMac = userAgent.includes("mac");
    const isLinux = userAgent.includes("linux");

    let details = `Operating System: ${
      isWindows ? "Windows" : isMac ? "macOS" : isLinux ? "Linux" : "Unknown"
    }`;
    let recommendation = "";

    if (isWindows) {
      details += " - Windows notifications should work in most modern browsers";
      recommendation =
        "Ensure Windows notifications are enabled in System Settings > Notifications & actions";
    } else if (isMac) {
      details += " - macOS notifications should work in most modern browsers";
      recommendation =
        "Ensure notifications are enabled in System Preferences > Notifications";
    } else if (isLinux) {
      details += " - Linux notifications depend on the desktop environment";
      recommendation =
        "Ensure your desktop environment supports notifications (GNOME, KDE, etc.)";
    }

    this.diagnostics.push({
      feature: "Desktop Environment",
      status: "unknown",
      permission: "N/A",
      details,
      recommendation,
    });
  }

  private checkDocumentVisibility(): void {
    const isVisible = !document.hidden;
    const visibilityState = document.visibilityState;

    this.diagnostics.push({
      feature: "Document Visibility",
      status: isVisible ? "supported" : "not-supported",
      permission: "N/A",
      details: `Document is ${visibilityState}, visible: ${isVisible}`,
      recommendation: isVisible
        ? undefined
        : "Tab needs to be visible for some notification features to work properly",
    });
  }

  private checkNotificationSettings(): void {
    // Check if Do Not Disturb or Focus Assist might be blocking notifications
    const now = new Date();
    const hour = now.getHours();

    let details = `Current time: ${now.toLocaleTimeString()}`;
    let recommendation = "";

    if (hour >= 22 || hour <= 6) {
      details += " (Night time - notifications might be suppressed)";
      recommendation = "Check if Do Not Disturb or Focus Assist is enabled";
    }

    this.diagnostics.push({
      feature: "System Notification Settings",
      status: "unknown",
      permission: "N/A",
      details,
      recommendation,
    });
  }

  public async testNotification(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Request permission if needed
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          return { success: false, error: "Permission denied" };
        }
      }

      if (Notification.permission !== "granted") {
        return { success: false, error: "Permission not granted" };
      }

      // Try to show a simple notification
      const notification = new Notification("🔔 Souqify Test", {
        body: "If you can see this, notifications are working!",
        icon: "/assets/snapbuy.png",
        tag: "debug-test",
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  public generateReport(): string {
    let report = "📊 Souqify Notification Diagnostic Report\n";
    report += "=" + "=".repeat(50) + "\n\n";

    this.diagnostics.forEach((diagnostic, index) => {
      report += `${index + 1}. ${diagnostic.feature}\n`;
      report += `   Status: ${diagnostic.status.toUpperCase()}\n`;
      if (diagnostic.permission !== "N/A") {
        report += `   Permission: ${diagnostic.permission}\n`;
      }
      report += `   Details: ${diagnostic.details}\n`;
      if (diagnostic.recommendation) {
        report += `   💡 Recommendation: ${diagnostic.recommendation}\n`;
      }
      report += "\n";
    });

    report += "Generated: " + new Date().toLocaleString() + "\n";

    return report;
  }
}

// Export singleton instance
export const notificationDebugger = new NotificationDebugger();
