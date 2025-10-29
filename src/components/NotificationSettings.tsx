import React, { useState, useEffect } from "react";
import {
  Button,
  Icon,
  Scroll,
  Translate,
  BooleanField,
  IconProps,
  EmptyComponent,
  Field,
  Line,
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
import { Biqpod } from "@biqpod/app/ui/types";
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -2,
    scale: 1.01,
    transition: {
      duration: 0.2,
    },
  },
};
const toggleVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
  hover: {
    x: 4,
    transition: {
      duration: 0.2,
    },
  },
};
const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    },
  },
  hover: {
    scale: 1.2,
    transition: {
      duration: 0.2,
    },
  },
};
const searchResultsVariants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
    },
  },
};
const floatingButtonVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: {
      duration: 0.3,
    },
  },
};
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
      <span key={i} className="font-bold text-[--biqpod-primary]">
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
    <motion.div
      className="flex justify-between items-center px-4 py-3 border-[--biqpod-border] border-b"
      variants={toggleVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="flex justify-center items-center bg-[--biqpod-primary-opacity] rounded-full w-8 h-8"
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Icon icon={icon} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.h4
            className="font-medium text-[--biqpod-text] capitalize"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <HighlightText text={title} searchQuery={searchQuery} />
          </motion.h4>
          <motion.p
            className="w-3/4 text-[--biqpod-text-secondary] text-sm"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <HighlightText text={description} searchQuery={searchQuery} />
          </motion.p>
        </motion.div>
      </div>
      <motion.label
        className="inline-flex relative items-center cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
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
      </motion.label>
    </motion.div>
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
    return await snapbuyApi.store.get(storeId);
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
    Required<Biqpod.Snapbuy.Store>["notify"]
  >({});
  const [originalNotifications, setOriginalNotifications] = useState<
    Required<Biqpod.Snapbuy.Store>["notify"]
  >({});
  const updateNotificationSetting = async (
    setting: keyof NonNullable<Biqpod.Snapbuy.Store["notify"]>,
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
        body: "This is a test notification from Biqpod.Snapbuy!",
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
        await snapbuyApi.store.update(storeId, {
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
    const list: (keyof NonNullable<Biqpod.Snapbuy.Store["notify"]>)[] = [
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
        <motion.div
          className="p-6 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mx-auto mb-4 border-[--biqpod-primary] border-2 border-t-transparent rounded-full w-8 h-8"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
          <motion.p
            className="text-[--biqpod-text-secondary]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Translate content="Loading store settings..." />
          </motion.p>
        </motion.div>
      ) : (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="px-5 py-2"
          >
            <motion.div
              className="bg-[--biqpod-gray-opacity] px-4 py-1 rounded-xl"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="flex justify-between items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-2"
                >
                  <motion.h3
                    className="mb-1 font-medium text-[--biqpod-text]"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Translate content="Browser Notifications" />
                  </motion.h3>
                  <motion.p
                    className="text-[--biqpod-text-secondary] text-sm"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
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
                  </motion.p>
                </motion.div>
                <motion.div
                  initial={{ x: 20, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
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
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
          {/* Search Input */}
          <Line />
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-2 py-1"
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <motion.div className="relative">
              <Field
                inputName="notification-search"
                placeholder="Search notification settings..."
                className="rounded-2xl"
              />
              <motion.div
                className="top-1/2 right-3 absolute flex justify-center items-center -translate-y-1/2 pointer-events-none transform"
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <Icon
                  icon={allIcons.solid.faSearch}
                  iconClassName="text-[--biqpod-text-secondary] text-sm opacity-60"
                />
              </motion.div>
            </motion.div>
          </motion.div>
          <Line />
          {/* Search Results Info */}
          <AnimatePresence>
            {searchFieldValue?.get && (
              <EmptyComponent>
                <motion.div
                  className="bg-[--biqpod-gray-opacity] m-2 px-4 py-2 rounded-2xl"
                  variants={searchResultsVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.p
                    className="text-[--biqpod-text-secondary] text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {filteredNotificationSettings.length > 0 ? (
                      <Translate
                        content={`Showing ${filteredNotificationSettings.length} of ${notificationSettingsData.length} notification settings`}
                      />
                    ) : (
                      <Translate content="No matching notification settings found" />
                    )}
                  </motion.p>
                </motion.div>
                <Line />
              </EmptyComponent>
            )}
          </AnimatePresence>
          {/* Permission Status */}
          {/* Notification Settings */}
          <Scroll className="h-full">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredNotificationSettings.length > 0 ? (
                <AnimatePresence mode="wait">
                  {filteredNotificationSettings.map((setting, index) => (
                    <motion.div
                      key={setting.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                      }}
                      layout
                    >
                      <NotificationToggle
                        icon={setting.icon}
                        title={setting.title}
                        description={setting.description}
                        enabled={notifications[setting.key] || false}
                        onChange={(enabled) =>
                          updateNotificationSetting(setting.key, enabled)
                        }
                        searchQuery={searchFieldValue?.get || ""}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div
                  className="flex flex-col justify-center items-center gap-3 p-8 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.2,
                    }}
                  >
                    <Icon
                      icon={allIcons.solid.faSearch}
                      iconClassName="text-4xl text-[--biqpod-text-secondary]"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.h3
                      className="mb-1 font-medium text-[--biqpod-text]"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Translate content="No results found" />
                    </motion.h3>
                    <motion.p
                      className="text-[--biqpod-text-secondary] text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Translate content="Try adjusting your search terms" />
                    </motion.p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setFieldValue("notification-search", "")}
                      className="px-3 py-1 text-sm"
                      icon={allIcons.solid.faTimes}
                    >
                      <Translate content="Clear search" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </Scroll>
          {/* Save/Cancel Buttons */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                variants={floatingButtonVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={tw(
                  "flex flex-col",
                  !hasUnsavedChanges && "overflow-hidden"
                )}
              >
                <Line />
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="bg-[--biqpod-warning-opacity] p-3 border-[--biqpod-warning] border-l-4"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex items-center text-[--biqpod-warning] text-sm"
                  >
                    <motion.div
                      animate={{
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
                <Line />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex gap-3 p-2"
                >
                  <Button
                    onClick={resetNotificationSettings}
                    disabled={isLoading}
                    className="bg-[--biqpod-gray-opacity] disabled:opacity-50 hover:shadow-lg w-full text-[--biqpod-text] transition-all duration-200"
                    icon={allIcons.solid.faUndo}
                  >
                    <Translate content="Cancel" />
                  </Button>
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
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
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
            )}
          </AnimatePresence>
          {/* Info Section */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="absolute inset-0 flex justify-center items-center bg-black/10 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="flex items-center gap-3 bg-[--biqpod-primary-background] shadow-lg p-4 border border-[--biqpod-borders] border-solid rounded-lg"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  >
                    <Icon
                      icon={allIcons.solid.faSpinner}
                      iconClassName="text-[--biqpod-primary]"
                    />
                  </motion.div>
                  <motion.span
                    className="text-[--biqpod-text]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Translate content="updating settings..." />
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </EmptyComponent>
  );
};
