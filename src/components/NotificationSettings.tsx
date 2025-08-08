import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Icon,
  Line,
  Scroll,
  Translate,
  BooleanField,
  IconProps,
} from "@biqpod/app/ui/components";
import { showToast, useAsyncMemo, useCopyState } from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { notificationService } from "../utils/notifications";
interface NotificationToggleProps {
  icon: IconProps["icon"];
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}
const NotificationToggle: React.FC<NotificationToggleProps> = ({
  icon,
  title,
  description,
  enabled,
  onChange,
}) => {
  const state = useCopyState<boolean | null>(enabled);
  useEffect(() => {
    if (state.get !== enabled) onChange(!!state.get);
  }, [enabled]);
  return (
    <div className="flex justify-between items-center p-3 border-[--biqpod-border] border-b">
      <div className="flex items-center gap-3">
        <div className="flex justify-center items-center bg-[--biqpod-primary-opacity] rounded-full w-8 h-8">
          <Icon icon={icon} />
        </div>
        <div>
          <h4 className="font-medium text-[--biqpod-text]">{title}</h4>
          <p className="text-[--biqpod-text-secondary] text-sm">
            {description}
          </p>
        </div>
      </div>
      <label className="inline-flex relative items-center cursor-pointer">
        <BooleanField state={state} id={`notification-toggle-${title}`} />
      </label>
    </div>
  );
};
export const NotificationSettings: React.FC = () => {
  const storeId = useStoreId();
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  // Get store data
  const store = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.getStore(storeId);
  }, [storeId]);
  // Check notification permission status
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);
  const requestPermission = async () => {
    try {
      const permission = await notificationService.requestPermission();
      setPermissionStatus(permission);
      if (permission === "granted") {
        showToast("Notifications enabled successfully!", "success");
      } else if (permission === "denied") {
        showToast(
          "Notifications were denied. Please enable them in browser settings.",
          "warning"
        );
      }
    } catch (error) {
      showToast("Failed to request notification permission", "error");
    }
  };
  const updateNotificationSetting = async (
    setting: keyof NonNullable<SnapBuy.Store["notify"]>,
    enabled: boolean
  ) => {
    if (!store || !storeId) {
      showToast("Store not found", "error");
      return;
    }
    setIsLoading(true);
    try {
      const updatedNotifySettings = {
        ...store.notify,
        [setting]: enabled,
      };
      // Update store in database
      await snapbuyApi.updateStore(storeId, {
        ...store,
        notify: updatedNotifySettings,
      });
      // Clear notification cache so new settings take effect
      const { clearNotificationCache } = await import(
        "../utils/orderNotifications"
      );
      clearNotificationCache(storeId);
      showToast(
        `${setting} notifications ${enabled ? "enabled" : "disabled"}`,
        "success"
      );
    } catch (error) {
      console.error("Failed to update notification setting:", error);
      showToast("Failed to update notification setting", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const testNotification = async () => {
    if (permissionStatus !== "granted") {
      showToast("Please enable notifications first", "warning");
      return;
    }
    try {
      await notificationService.sendNotification({
        title: "🛒 Test Notification",
        body: "This is a test notification from SnapBuy!",
        icon: "/assets/snapbuy.png",
        tag: "test-notification",
      });
      showToast("Test notification sent!", "success");
    } catch (error) {
      showToast("Failed to send test notification", "error");
    }
  };
  if (!store) {
    return (
      <Card className="mx-auto max-w-md">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 border-[--biqpod-primary] border-2 border-t-transparent rounded-full w-8 h-8 animate-spin" />
          <p className="text-[--biqpod-text-secondary]">
            <Translate content="Loading store settings..." />
          </p>
        </div>
      </Card>
    );
  }
  const notifications = store.notify || {};
  return (
    <Card className="mx-auto max-w-2xl">
      <div>
        {/* Permission Status */}
        <div className="p-4">
          <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="mb-1 font-medium text-[--biqpod-text]">
                  <Translate content="Browser Notifications" />
                </h3>
                <p className="text-[--biqpod-text-secondary] text-sm">
                  {permissionStatus === "granted" && (
                    <>
                      ✅ <Translate content="Notifications are enabled" />
                    </>
                  )}
                  {permissionStatus === "denied" && (
                    <>
                      ❌ <Translate content="Notifications are blocked" />
                    </>
                  )}
                  {permissionStatus === "default" && (
                    <>
                      ⏳ <Translate content="Notifications not configured" />
                    </>
                  )}
                </p>
              </div>
              {permissionStatus !== "granted" && (
                <Button
                  className="px-2 py-1 w-fit"
                  icon={allIcons.solid.faBell}
                  onClick={requestPermission}
                >
                  <Translate content="Enable" />
                </Button>
              )}
              {permissionStatus === "granted" && (
                <Button
                  onClick={testNotification}
                  className="px-2 py-1 w-fit"
                  icon={allIcons.solid.faPlay}
                >
                  <Translate content="Test" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <Line />
        {/* Notification Settings */}
        <Scroll className="max-h-96">
          <div className="space-y-0">
            <NotificationToggle
              icon={allIcons.solid.faShoppingCart}
              title={<Translate content="New Orders" />}
              description={
                <Translate content="Get notified when customers place new orders" />
              }
              enabled={notifications.newOrder || false}
              onChange={(enabled) =>
                updateNotificationSetting("newOrder", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faSync}
              title={<Translate content="Order Status Changes" />}
              description={
                <Translate content="Get notified when order status is updated" />
              }
              enabled={notifications.orderStatusChanged || false}
              onChange={(enabled) =>
                updateNotificationSetting("orderStatusChanged", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faCheckCircle}
              title={<Translate content="Order Completed" />}
              description={
                <Translate content="Get notified when orders are marked as completed" />
              }
              enabled={notifications.orderCompleted || false}
              onChange={(enabled) =>
                updateNotificationSetting("orderCompleted", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faTimesCircle}
              title={<Translate content="Order Cancelled" />}
              description={
                <Translate content="Get notified when orders are cancelled" />
              }
              enabled={notifications.orderCancelled || false}
              onChange={(enabled) =>
                updateNotificationSetting("orderCancelled", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faCog}
              title={<Translate content="Order Processing" />}
              description={
                <Translate content="Get notified when orders start processing" />
              }
              enabled={notifications.orderProcessing || false}
              onChange={(enabled) =>
                updateNotificationSetting("orderProcessing", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faTruck}
              title={<Translate content="Order Delivery" />}
              description={
                <Translate content="Get notified when orders are out for delivery" />
              }
              enabled={notifications.orderDelivery || false}
              onChange={(enabled) =>
                updateNotificationSetting("orderDelivery", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faExclamationTriangle}
              title={<Translate content="Low Stock Alerts" />}
              description={
                <Translate content="Get notified when product inventory is running low" />
              }
              enabled={notifications.lowStock || false}
              onChange={(enabled) =>
                updateNotificationSetting("lowStock", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faBox}
              title={<Translate content="New Products" />}
              description={
                <Translate content="Get notified when new products are added to your store" />
              }
              enabled={notifications.newProduct || false}
              onChange={(enabled) =>
                updateNotificationSetting("newProduct", enabled)
              }
            />
            <NotificationToggle
              icon={allIcons.solid.faUsers}
              title={<Translate content="New Clients" />}
              description={
                <Translate content="Get notified when new customers register" />
              }
              enabled={notifications.newClient || false}
              onChange={(enabled) =>
                updateNotificationSetting("newClient", enabled)
              }
            />
          </div>
        </Scroll>
      </div>
      <Line />
      {/* Info Section */}
      <div className="p-4">
        <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon icon={allIcons.solid.faInfoCircle} />
            <div className="text-sm">
              <p className="mb-1 font-medium">
                <Translate content="How notifications work:" />
              </p>
              <ul className="space-y-1">
                <li>
                  •{" "}
                  <Translate content="Notifications work even when SnapBuy is closed" />
                </li>
                <li>
                  •{" "}
                  <Translate content="You'll receive alerts on your computer desktop" />
                </li>
                <li>
                  •{" "}
                  <Translate content="Click notifications to quickly navigate to relevant pages" />
                </li>
                <li>
                  •{" "}
                  <Translate content="You can change these settings anytime" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black/10 rounded-lg">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg">
            <div className="border-[--biqpod-primary] border-2 border-t-transparent rounded-full w-5 h-5 animate-spin" />
            <span className="text-[--biqpod-text]">
              <Translate content="Updating settings..." />
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
