import React, { useState } from "react";
import { Icon } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  quickNotificationTest,
  showNotificationDebugInfo,
} from "../utils/quickNotificationTest";
import { DesktopNotificationFixer } from "../utils/desktopNotificationFixes";

export const FloatingNotificationTester: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="right-4 bottom-4 z-[9999] fixed">
      {isExpanded ? (
        // Expanded panel
        <div className="bg-white shadow-2xl border border-gray-200 rounded-lg w-80 overflow-hidden">
          <div className="flex justify-between items-center bg-blue-600 p-3 text-white">
            <div className="flex items-center gap-2">
              <Icon icon={allIcons.solid.faBell} className="text-sm" />
              <span className="font-medium text-sm">Notification Tester</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="hover:bg-blue-700 p-1 rounded text-white"
              >
                <Icon icon={allIcons.solid.faMinus} className="text-xs" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="hover:bg-blue-700 p-1 rounded text-white"
              >
                <Icon icon={allIcons.solid.faTimes} className="text-xs" />
              </button>
            </div>
          </div>
          <div className="space-y-2 p-3">
            <button
              onClick={quickNotificationTest}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded w-full font-medium text-white text-sm text-left transition-colors"
            >
              <Icon icon={allIcons.solid.faPlay} className="text-xs" />
              Quick Test
            </button>

            <button
              onClick={() =>
                DesktopNotificationFixer.testNotificationAfterFixes()
              }
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded w-full font-medium text-white text-sm text-left transition-colors"
            >
              <Icon icon={allIcons.solid.faWrench} className="text-xs" />
              Test with Fixes
            </button>

            <button
              onClick={showNotificationDebugInfo}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded w-full font-medium text-white text-sm text-left transition-colors"
            >
              <Icon icon={allIcons.solid.faInfoCircle} className="text-xs" />
              Debug Info
            </button>

            <button
              onClick={async () => {
                try {
                  await Notification.requestPermission();
                  await quickNotificationTest();
                } catch (error) {
                  console.error("Permission test failed:", error);
                }
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded w-full font-medium text-white text-sm text-left transition-colors"
            >
              <Icon icon={allIcons.solid.faShieldAlt} className="text-xs" />
              Request Permission
            </button>

            <div className="pt-2 border-gray-200 border-t">
              <p className="text-gray-600 text-xs">
                💡 If notifications don't appear, check your browser and system
                settings.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Collapsed button
        <button
          onClick={() => setIsExpanded(true)}
          className="flex justify-center items-center bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full w-12 h-12 text-white hover:scale-110 transition-all duration-200"
          title="Test Notifications"
        >
          <Icon icon={allIcons.solid.faBell} className="text-lg" />
        </button>
      )}
    </div>
  );
};
