import React, { useState } from "react";
import { Card, Button, Icon, Line, Translate } from "@biqpod/app/ui/components";
import { showToast } from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";
import { notificationService } from "../utils/notifications";
import {
  notificationDebugger,
  NotificationDiagnostic,
} from "../utils/notificationDebugger";

export const NotificationTester: React.FC = () => {
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnostic[]>([]);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await notificationDebugger.runDiagnostics();
      setDiagnostics(results);
      showToast("Diagnostic completed", "success");
    } catch (error) {
      showToast("Failed to run diagnostics", "error");
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const testBasicNotification = async () => {
    setIsTestingNotification(true);
    try {
      const result = await notificationDebugger.testNotification();
      if (result.success) {
        showToast("Test notification sent successfully!", "success");
      } else {
        showToast(`Test failed: ${result.error}`, "error");
      }
    } catch (error) {
      showToast("Failed to send test notification", "error");
    } finally {
      setIsTestingNotification(false);
    }
  };

  const testAdvancedNotification = async () => {
    try {
      await notificationService.sendNotification({
        title: "🎉 Advanced Test - Biqpod.Snapbuy",
        body: "This is an advanced notification test with all features enabled!",
        icon: "/assets/snapbuy.png",
        tag: "advanced-test",
        requireInteraction: true,
        data: {
          type: "test",
          timestamp: new Date().toISOString(),
        },
      });
      showToast("Advanced test notification sent!", "success");
    } catch (error) {
      showToast("Failed to send advanced notification", "error");
    }
  };

  const testServiceWorkerNotification = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        registration.active.postMessage({
          type: "SHOW_NOTIFICATION",
          payload: {
            title: "🔧 Service Worker Test - Biqpod.Snapbuy",
            body: "This notification was sent via Service Worker!",
            icon: "/assets/snapbuy.png",
            tag: "sw-test",
            requireInteraction: false,
          },
        });
        showToast("Service Worker notification sent!", "success");
      } else {
        showToast("Service Worker not available", "error");
      }
    } catch (error) {
      showToast("Service Worker test failed", "error");
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        showToast("Notification permission granted!", "success");
        // Re-run diagnostics to update permission status
        await runDiagnostics();
      } else {
        showToast("Notification permission denied", "warning");
      }
    } catch (error) {
      showToast("Failed to request permission", "error");
    }
  };

  const downloadReport = () => {
    const report = notificationDebugger.generateReport();
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snapbuy-notification-diagnostic.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Diagnostic report downloaded", "success");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "supported":
        return allIcons.solid.faCheckCircle;
      case "not-supported":
        return allIcons.solid.faTimesCircle;
      default:
        return allIcons.solid.faQuestionCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "supported":
        return "text-green-600";
      case "not-supported":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="mb-2 font-bold text-[--biqpod-text] text-2xl">
              🔔 <Translate content="Notification Testing Center" />
            </h2>
            <p className="text-[--biqpod-text-secondary]">
              <Translate content="Test and debug notification functionality on desktop" />
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              icon={allIcons.solid.faSearch}
              className="px-4 py-2"
            >
              {isRunningDiagnostics ? (
                <Translate content="Running..." />
              ) : (
                <Translate content="Run Diagnostics" />
              )}
            </Button>
            {diagnostics.length > 0 && (
              <Button
                onClick={downloadReport}
                icon={allIcons.solid.faDownload}
                className="px-4 py-2"
              >
                <Translate content="Download Report" />
              </Button>
            )}
          </div>
        </div>

        <Line />

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="mb-4 font-semibold text-[--biqpod-text] text-lg">
            <Translate content="Quick Tests" />
          </h3>
          <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={requestPermission}
              icon={allIcons.solid.faShieldAlt}
              className="flex-col p-3 h-auto"
            >
              <div className="font-medium">
                <Translate content="Request Permission" />
              </div>
              <div className="opacity-80 text-xs">
                <Translate content="Enable notifications" />
              </div>
            </Button>

            <Button
              onClick={testBasicNotification}
              disabled={isTestingNotification}
              icon={allIcons.solid.faBell}
              className="flex-col p-3 h-auto"
            >
              <div className="font-medium">
                {isTestingNotification ? (
                  <Translate content="Testing..." />
                ) : (
                  <Translate content="Basic Test" />
                )}
              </div>
              <div className="opacity-80 text-xs">
                <Translate content="Simple notification" />
              </div>
            </Button>

            <Button
              onClick={testAdvancedNotification}
              icon={allIcons.solid.faCog}
              className="flex-col p-3 h-auto"
            >
              <div className="font-medium">
                <Translate content="Advanced Test" />
              </div>
              <div className="opacity-80 text-xs">
                <Translate content="With all features" />
              </div>
            </Button>

            <Button
              onClick={testServiceWorkerNotification}
              icon={allIcons.solid.faCode}
              className="flex-col p-3 h-auto"
            >
              <div className="font-medium">
                <Translate content="Service Worker" />
              </div>
              <div className="opacity-80 text-xs">
                <Translate content="Background test" />
              </div>
            </Button>
          </div>
        </div>

        {/* Diagnostic Results */}
        {diagnostics.length > 0 && (
          <>
            <Line />
            <div className="mb-6">
              <h3 className="mb-4 font-semibold text-[--biqpod-text] text-lg">
                <Translate content="Diagnostic Results" />
              </h3>
              <div className="space-y-3">
                {diagnostics.map((diagnostic, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-[--biqpod-gray-opacity] p-4 rounded-lg"
                  >
                    <Icon
                      icon={getStatusIcon(diagnostic.status)}
                      iconClassName={`text-xl ${getStatusColor(
                        diagnostic.status
                      )}`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-[--biqpod-text]">
                          {diagnostic.feature}
                        </h4>
                        {diagnostic.permission !== "N/A" && (
                          <span className="bg-[--biqpod-primary-opacity] px-2 py-1 rounded text-xs">
                            {diagnostic.permission}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[--biqpod-text-secondary] text-sm">
                        {diagnostic.details}
                      </p>
                      {diagnostic.recommendation && (
                        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 mt-2 p-2 rounded">
                          <Icon
                            icon={allIcons.solid.faLightbulb}
                            iconClassName="text-blue-600 text-sm mt-0.5"
                          />
                          <p className="text-blue-800 dark:text-blue-200 text-xs">
                            {diagnostic.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Troubleshooting Guide */}
        <Line />
        <div>
          <h3 className="mb-4 font-semibold text-[--biqpod-text] text-lg">
            <Translate content="Troubleshooting Guide" />
          </h3>
          <div className="space-y-4">
            <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
              <h4 className="mb-2 font-medium">
                🚫 <Translate content="No notifications appearing?" />
              </h4>
              <ul className="space-y-1 text-sm">
                <li>
                  •{" "}
                  <Translate content="Check if notifications are blocked in browser settings" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Ensure Windows/macOS notifications are enabled" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Disable Do Not Disturb or Focus Assist" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Try a different browser (Chrome works best)" />
                </li>
              </ul>
            </div>

            <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
              <h4 className="mb-2 font-medium">
                ⚠️{" "}
                <Translate content="Notifications appear briefly then disappear?" />
              </h4>
              <ul className="space-y-1 text-sm">
                <li>
                  •{" "}
                  <Translate content="This is normal behavior for some operating systems" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Notifications may go to the notification center" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Check your system notification history" />
                </li>
              </ul>
            </div>

            <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
              <h4 className="mb-2 font-medium">
                🔧 <Translate content="Advanced troubleshooting:" />
              </h4>
              <ul className="space-y-1 text-sm">
                <li>
                  • <Translate content="Open browser developer tools (F12)" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Check the Console tab for error messages" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Look for Service Worker errors in Application tab" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Clear browser cache and reload the page" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
