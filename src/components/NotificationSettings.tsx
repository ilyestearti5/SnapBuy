import React, { useState, useEffect } from "react";
import {
  Button,
  Icon,
  Line,
  Scroll,
  Translate,
  BooleanField,
  IconProps,
  EmptyComponent,
  Field,
} from "@biqpod/app/ui/components";
import {
  execAction,
  showToast,
  useAction,
  useAsyncEffect,
  useAsyncMemo,
  useCopyState,
  useFieldValue,
  setFieldValue,
} from "@biqpod/app/ui/hooks";
import { useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { notificationService } from "../utils/notifications";
import { motion, AnimatePresence } from "framer-motion";
import { tw } from "@biqpod/app/ui/utils";
// Fuzzy search function
function filterFuzzySearch<T>(
  list: T[],
  search: string,
  keys: (keyof T)[]
): T[] {
  if (!search) return list;
  const normSearch = search.trim().toLowerCase();
  // Score function: higher is better
  function score(str: string): number {
    str = str.toLowerCase();
    if (str === normSearch) return 1000; // exact match
    if (str.startsWith(normSearch)) return 900; // prefix match
    const idx = str.indexOf(normSearch);
    if (idx !== -1) return 800 - idx; // substring match, earlier is better
    // Fuzzy: count matching chars in order
    let sIdx = 0,
      match = 0;
    for (let c of str) {
      if (c === normSearch[sIdx]) {
        match++;
        sIdx++;
        if (sIdx === normSearch.length) break;
      }
    }
    return match === normSearch.length ? 700 - str.length : 0;
  }
  return list
    .map((item) => {
      let maxScore = 0;
      // Check all specified keys and take the highest score
      for (const key of keys) {
        const value = String(item[key] ?? "");
        const keyScore = score(value);
        if (keyScore > maxScore) {
          maxScore = keyScore;
        }
      }
      return { item, score: maxScore };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
// Highlight component for search terms
const HighlightText: React.FC<{ text: string; searchQuery: string }> = ({
  text,
  searchQuery,
}) => {
  if (!searchQuery.trim()) {
    return <span>{text}</span>;
  }
  const query = searchQuery.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  // Find all matches
  const matches: { start: number; end: number }[] = [];
  let index = 0;
  while (index < lowerText.length) {
    const found = lowerText.indexOf(query, index);
    if (found === -1) break;
    matches.push({ start: found, end: found + query.length });
    index = found + 1;
  }
  if (matches.length === 0) {
    return <span>{text}</span>;
  }
  // Build highlighted text
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  matches.forEach((match, i) => {
    // Add text before match
    if (currentIndex < match.start) {
      parts.push(text.slice(currentIndex, match.start));
    }
    // Add highlighted match
    parts.push(
      <span
        key={i}
        className="bg-[--biqpod-primary-opacity] px-1 rounded font-semibold text-[--biqpod-primary]"
      >
        {text.slice(match.start, match.end)}
      </span>
    );
    currentIndex = match.end;
  });
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }
  return <span>{parts}</span>;
};
interface NotificationToggleProps {
  icon: IconProps["icon"];
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  searchQuery?: string;
}
const NotificationToggle: React.FC<NotificationToggleProps> = ({
  icon,
  title,
  description,
  enabled,
  onChange,
  searchQuery = "",
}) => {
  return (
    <div className="flex justify-between items-center p-3 border-[--biqpod-border] border-b">
      <div className="flex items-center gap-3">
        <div className="flex justify-center items-center bg-[--biqpod-primary-opacity] rounded-full w-8 h-8">
          <Icon icon={icon} />
        </div>
        <div>
          <h4 className="font-medium text-[--biqpod-text] capitalize">
            <HighlightText text={title} searchQuery={searchQuery} />
          </h4>
          <p className="text-[--biqpod-text-secondary] text-sm">
            <HighlightText text={description} searchQuery={searchQuery} />
          </p>
        </div>
      </div>
      <label className="inline-flex relative items-center cursor-pointer">
        <BooleanField
          state={{
            get: enabled,
            set: (value) => {
              var result =
                typeof value === "function" ? value(enabled) : !value;
              typeof result === "boolean" && onChange(result);
            },
          }}
          id={`notification-toggle-${title}`}
        />
      </label>
    </div>
  );
};
export const NotificationSettings: React.FC = () => {
  const storeId = useStoreId();
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  // Use field value hook for search
  const searchFieldValue = useFieldValue("notification-search");
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
  const [notifications, setNotifications] = useState<
    Required<SnapBuy.Store>["notify"]
  >({});
  const [originalNotifications, setOriginalNotifications] = useState<
    Required<SnapBuy.Store>["notify"]
  >({});
  const updateNotificationSetting = async (
    setting: keyof NonNullable<SnapBuy.Store["notify"]>,
    enabled: boolean
  ) => {
    const newNotifications = {
      ...notifications,
      [setting]: enabled,
    };
    setNotifications(newNotifications);
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
  // Reset changes to original values
  const resetNotificationSettings = () => {
    setNotifications({ ...originalNotifications });
  };
  useAction(
    "save-notification-settings",
    async () => {
      if (!store || !storeId) {
        showToast("Store not found", "error");
        return;
      }
      setIsLoading(true);
      try {
        // Update store in database
        await snapbuyApi.updateStore(storeId, {
          notify: notifications,
        });
        // Update original notifications to match current ones
        setOriginalNotifications({ ...notifications });
        showToast("Notification settings saved successfully!", "success");
        // Clear notification cache so new settings take effect
      } catch (error) {
        showToast("Failed to update notification setting", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [storeId, notifications]
  );
  const isInited = useCopyState(false);
  // Define notification settings data
  const notificationSettingsData = useMemo(
    () => [
      {
        key: "newOrder" as const,
        icon: allIcons.solid.faShoppingCart,
        title: "new orders",
        description: "get notified when customers place new orders",
        searchKeywords: [
          "new",
          "order",
          "orders",
          "customer",
          "place",
          "shopping",
          "cart",
        ],
      },
      {
        key: "orderStatusChanged" as const,
        icon: allIcons.solid.faSync,
        title: "order status changes",
        description: "get notified when order status is updated",
        searchKeywords: ["order", "status", "change", "update", "sync"],
      },
      {
        key: "orderCompleted" as const,
        icon: allIcons.solid.faCheckCircle,
        title: "order completed",
        description: "get notified when orders are marked as completed",
        searchKeywords: [
          "order",
          "completed",
          "complete",
          "finished",
          "done",
          "check",
        ],
      },
      {
        key: "orderCancelled" as const,
        icon: allIcons.solid.faTimesCircle,
        title: "order cancelled",
        description: "get notified when orders are cancelled",
        searchKeywords: [
          "order",
          "cancelled",
          "cancel",
          "canceled",
          "times",
          "stop",
        ],
      },
      {
        key: "orderProcessing" as const,
        icon: allIcons.solid.faCog,
        title: "order processing",
        description: "get notified when orders start processing",
        searchKeywords: [
          "order",
          "processing",
          "process",
          "start",
          "cog",
          "gear",
        ],
      },
      {
        key: "orderDelivery" as const,
        icon: allIcons.solid.faTruck,
        title: "order delivery",
        description: "get notified when orders are out for delivery",
        searchKeywords: [
          "order",
          "delivery",
          "deliver",
          "truck",
          "shipping",
          "out",
        ],
      },
      {
        key: "lowStock" as const,
        icon: allIcons.solid.faExclamationTriangle,
        title: "low stock alerts",
        description: "get notified when product inventory is running low",
        searchKeywords: [
          "low",
          "stock",
          "inventory",
          "running",
          "alert",
          "warning",
          "triangle",
        ],
      },
      {
        key: "newProduct" as const,
        icon: allIcons.solid.faBox,
        title: "new products",
        description: "get notified when new products are added to your store",
        searchKeywords: ["new", "product", "products", "added", "store", "box"],
      },
      {
        key: "newClient" as const,
        icon: allIcons.solid.faUsers,
        title: "new clients",
        description: "get notified when new customers register",
        searchKeywords: [
          "new",
          "client",
          "clients",
          "customer",
          "customers",
          "register",
          "users",
        ],
      },
      {
        key: "accountAutoAccept" as const,
        icon: allIcons.solid.faUserPlus,
        title: "account auto accept",
        description:
          "automatically accept extra account requests without manual approval",
        searchKeywords: [
          "account",
          "auto",
          "accept",
          "automatic",
          "extra",
          "request",
          "approval",
          "user",
          "plus",
        ],
      },
    ],
    []
  );
  // Filter notification settings based on search query using fuzzy search
  const filteredNotificationSettings = useMemo(() => {
    const query = (searchFieldValue?.get || "").toLowerCase().trim();
    if (!query) {
      return notificationSettingsData;
    }
    // Use fuzzy search on title, description, and searchKeywords
    const enrichedData = notificationSettingsData.map((setting) => ({
      ...setting,
      searchableText: `${setting.title} ${
        setting.description
      } ${setting.searchKeywords.join(" ")}`,
    }));
    return filterFuzzySearch(enrichedData, query, [
      "title",
      "description",
      "searchableText",
    ]);
  }, [searchFieldValue?.get, notificationSettingsData]);
  // Detect unsaved changes by comparing current and original notifications
  // Only show changes after the component is initialized with data
  const hasUnsavedChanges = useMemo(() => {
    if (!isInited.get) return false; // Don't show changes until data is loaded
    const list: (keyof NonNullable<SnapBuy.Store["notify"]>)[] = [
      "newOrder",
      "orderStatusChanged",
      "orderCompleted",
      "orderCancelled",
      "orderProcessing",
      "orderDelivery",
      "lowStock",
      "newProduct",
      "newClient",
      "accountAutoAccept",
    ];
    for (let item of list) {
      if (notifications[item] !== originalNotifications[item]) {
        return true;
      }
    }
    return false;
  }, [notifications, originalNotifications, isInited.get]);
  useAsyncEffect(async () => {
    if (store?.id) {
      const nots = await snapbuyApi.getNotificationSettings(store.id);
      const notificationsData = nots || {};
      setNotifications(notificationsData);
      setOriginalNotifications(notificationsData);
      isInited.set(true);
    }
  }, [store]);
  return (
    <EmptyComponent>
      {!store ? (
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 border-[--biqpod-primary] border-2 border-t-transparent rounded-full w-8 h-8 animate-spin" />
          <p className="text-[--biqpod-text-secondary]">
            <Translate content="Loading store settings..." />
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col h-full overflow-hidden">
          <div className="p-4">
            <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="mb-1 font-medium text-[--biqpod-text]">
                    <Translate content="Browser Notifications" />
                  </h3>
                  <p className="text-[--biqpod-text-secondary] text-sm">
                    {permissionStatus === "granted" && (
                      <EmptyComponent>
                        ✅ <Translate content="Notifications are enabled" />
                      </EmptyComponent>
                    )}
                    {permissionStatus === "denied" && (
                      <EmptyComponent>
                        ❌ <Translate content="Notifications are blocked" />
                      </EmptyComponent>
                    )}
                    {permissionStatus === "default" && (
                      <EmptyComponent>
                        ⏳ <Translate content="Notifications not configured" />
                      </EmptyComponent>
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
          {/* Search Input */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Field
                inputName="notification-search"
                placeholder="Search notification settings..."
                className="rounded-2xl"
              />
              <div className="top-1/2 right-3 absolute flex justify-center items-center w-5 h-5 -translate-y-1/2 pointer-events-none">
                <Icon
                  icon={allIcons.solid.faSearch}
                  iconClassName="text-[--biqpod-text-secondary] text-sm opacity-60"
                />
              </div>
            </div>
          </div>
          <Line />
          {/* Search Results Info */}
          {searchFieldValue?.get && (
            <div className="bg-[--biqpod-gray-opacity] px-4 py-2">
              <p className="text-[--biqpod-text-secondary] text-sm">
                {filteredNotificationSettings.length > 0 ? (
                  <Translate
                    content={`Showing ${filteredNotificationSettings.length} of ${notificationSettingsData.length} notification settings`}
                  />
                ) : (
                  <Translate content="No matching notification settings found" />
                )}
              </p>
            </div>
          )}
          {/* Permission Status */}
          {/* Notification Settings */}
          <Scroll className="h-full">
            <div className="space-y-0">
              {filteredNotificationSettings.length > 0 ? (
                filteredNotificationSettings.map((setting) => (
                  <NotificationToggle
                    key={setting.key}
                    icon={setting.icon}
                    title={setting.title}
                    description={setting.description}
                    enabled={notifications[setting.key] || false}
                    onChange={(enabled) =>
                      updateNotificationSetting(setting.key, enabled)
                    }
                    searchQuery={searchFieldValue?.get || ""}
                  />
                ))
              ) : (
                <div className="flex flex-col justify-center items-center gap-3 p-8 text-center">
                  <Icon
                    icon={allIcons.solid.faSearch}
                    iconClassName="text-4xl text-[--biqpod-text-secondary]"
                  />
                  <div>
                    <h3 className="mb-1 font-medium text-[--biqpod-text]">
                      <Translate content="No results found" />
                    </h3>
                    <p className="text-[--biqpod-text-secondary] text-sm">
                      <Translate content="Try adjusting your search terms" />
                    </p>
                  </div>
                  <Button
                    onClick={() => setFieldValue("notification-search", "")}
                    className="px-3 py-1 text-sm"
                    icon={allIcons.solid.faTimes}
                  >
                    <Translate content="Clear search" />
                  </Button>
                </div>
              )}
            </div>
          </Scroll>
          <Line />
          {/* Save/Cancel Buttons */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.4,
                }}
                className={tw(
                  "flex flex-col p-4",
                  !hasUnsavedChanges && "overflow-hidden"
                )}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="bg-[--biqpod-warning-opacity] mb-3 p-3 border-[--biqpod-warning] border-l-4 rounded-lg"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex items-center text-[--biqpod-warning] text-sm"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className="mr-2"
                    >
                      <Icon icon={allIcons.solid.faExclamationTriangle} />
                    </motion.div>
                    <Translate content="You have unsaved changes" />
                  </motion.p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={resetNotificationSettings}
                      disabled={isLoading}
                      className="bg-[--biqpod-gray] disabled:opacity-50 hover:shadow-lg w-full text-[--biqpod-text] transition-all duration-200"
                      icon={allIcons.solid.faUndo}
                    >
                      <Translate content="Cancel" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex-1"
                  >
                    <Button
                      onClick={() => execAction("save-notification-settings")}
                      disabled={isLoading}
                      className="relative disabled:opacity-50 hover:shadow-lg w-full overflow-hidden transition-all duration-200"
                      icon={
                        isLoading
                          ? allIcons.solid.faSpinner
                          : allIcons.solid.faSave
                      }
                    >
                      <motion.span
                        animate={{ opacity: isLoading ? 0.7 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Translate content="Save Changes" />
                      </motion.span>
                      <AnimatePresence>
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex justify-center items-center bg-[--biqpod-primary]"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Icon
                                icon={allIcons.solid.faSpinner}
                                iconClassName="text-white"
                              />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
            <Line />
          </AnimatePresence>
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
              <div className="flex items-center gap-3 bg-[--biqpod-primary-background] shadow-lg p-4 border border-[--biqpod-borders] border-solid rounded-lg">
                <Icon
                  icon={allIcons.solid.faSpinner}
                  iconClassName="animate-spin text-[--biqpod-primary]"
                />
                <span className="text-[--biqpod-text]">
                  <Translate content="updating settings..." />
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </EmptyComponent>
  );
};
