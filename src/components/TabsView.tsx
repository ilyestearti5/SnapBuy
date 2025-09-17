import { useState, ReactNode, useEffect } from "react";
import {
  Button,
  EmptyComponent,
  Icon,
  IconProps,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon: IconProps["icon"];
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number; // Badge to display (e.g., notification count)
}
interface TabsViewProps<T extends string = string> {
  tabs: TabItem<T>[];
  defaultTab?: T;
  onTabChange?: (tabId: T) => void;
  position?: "top" | "bottom";
}
export function TabsView<T extends string = string>({
  tabs,
  defaultTab,
  onTabChange,
  position = "top",
}: TabsViewProps<T>) {
  const [activeTab, setActiveTab] = useState<T>(defaultTab || tabs[0]?.id);
  // Update active tab if defaultTab changes
  useEffect(() => {
    if (defaultTab && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  const handleTabChange = (tabId: T) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.disabled) return;
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  return (
    <div className={tw("flex flex-col h-full")}>
      {/* Tab Navigation */}
      {position === "top" && (
        <EmptyComponent>
          <div
            className={tw(
              "flex gap-1 justify-center bg-[--biqpod-secondary-background] p-2"
            )}
          >
            {tabs.map((tab) => {
              const isUsed = tab.id === activeTab;
              return (
                <div key={tab.id} className="relative">
                  <Button
                    onClick={() => {
                      handleTabChange(tab.id);
                    }}
                    className={tw(
                      "w-fit flex-1 flex items-center justify-center h-[40px] bg-[--biqpod-secondary] text-[--biqpod-secondary-content] transition-[max-width] rounded-full max-w-[40px]",
                      isUsed && "max-w-[150px]",
                      !isUsed &&
                        "text-[--biqpod-text-color] bg-[--biqpod-gray-opacity]"
                    )}
                  >
                    <div className="flex justify-center items-center">
                      <Icon icon={tab.icon} />
                      <span
                        className={tw(
                          "inline-block overflow-hidden transition-[filter,max-width,margin] duration-500",
                          isUsed && "max-w-[150px] ml-2 blur-0",
                          !isUsed && "max-w-[0px] ml-0 blur-md"
                        )}
                      >
                        <Translate content={tab.label} />
                      </span>
                    </div>
                  </Button>
                  {tab.badge && (
                    <div className="-top-1 -right-1 absolute flex justify-center items-center bg-red-500 shadow-lg border-2 border-white rounded-full min-w-[18px] h-[18px] font-bold text-white text-xs animate-pulse">
                      {typeof tab.badge === "number" && tab.badge > 99
                        ? "99+"
                        : tab.badge}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Line />
        </EmptyComponent>
      )}
      {/* Tab Content */}
      <div className={tw("flex-1 overflow-hidden w-full")}>
        {currentTab?.content}
      </div>
      {position === "bottom" && (
        <EmptyComponent>
          <Line />

          <div
            className={tw(
              "flex gap-1 justify-center bg-[--biqpod-secondary-background] p-2"
            )}
          >
            {tabs.map((tab) => {
              const isUsed = tab.id === activeTab;
              return (
                <div key={tab.id} className="relative">
                  <Button
                    onClick={() => {
                      handleTabChange(tab.id);
                    }}
                    className={tw(
                      "w-fit flex-1 flex items-center justify-center h-[40px] bg-[--biqpod-primary] text-[--biqpod-primary-content] transition-[max-width] rounded-full max-w-[40px]",
                      isUsed && "max-w-[150px]",
                      !isUsed &&
                        "text-[--biqpod-text-color] bg-[--biqpod-gray-opacity]"
                    )}
                  >
                    <div className="flex justify-center items-center">
                      <Icon icon={tab.icon} />
                      <span
                        className={tw(
                          "inline-block overflow-hidden transition-[filter,max-width,margin] duration-500",
                          isUsed && "max-w-[150px] ml-2 blur-0",
                          !isUsed && "max-w-[0px] ml-0 blur-md"
                        )}
                      >
                        <Translate content={tab.label} />
                      </span>
                    </div>
                  </Button>
                  {tab.badge && (
                    <div className="-top-1 -right-1 absolute flex justify-center items-center bg-red-500 shadow-lg border-2 border-white rounded-full min-w-[18px] h-[18px] font-bold text-white text-xs animate-pulse">
                      {typeof tab.badge === "number" && tab.badge > 99
                        ? "99+"
                        : tab.badge}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </EmptyComponent>
      )}
    </div>
  );
}
