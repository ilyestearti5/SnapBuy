// Example of how to use the NotificationSettings component in your app
import { NotificationSettings } from "../components/NotificationSettings";
import { showPopup } from "@biqpod/app/ui/hooks";
import { Translate } from "@biqpod/app/ui/components";
// Example 1: Show as popup
export const openNotificationSettings = () => {
  showPopup(<NotificationSettings />);
};
// Example 2: Use in settings page
export const SettingsPage = () => {
  return (
    <div className="p-6">
      <h1 className="mb-6 font-bold text-2xl">
        <Translate content="Store Settings" />
      </h1>
      {/* Other settings sections */}
      <div className="mb-8">
        <h2 className="mb-4 font-medium text-lg">
          <Translate content="General Settings" />
        </h2>
        {/* Your general settings here */}
      </div>
      {/* Notification Settings Section */}
      <div className="mb-8">
        <NotificationSettings />
      </div>
      {/* Other settings sections */}
      <div className="mb-8">
        <h2 className="mb-4 font-medium text-lg">
          <Translate content="Payment Settings" />
        </h2>
        {/* Your payment settings here */}
      </div>
    </div>
  );
};
// Example 3: Quick toggle in header/menu
export const QuickNotificationToggle = () => {
  const handleOpenSettings = () => {
    openNotificationSettings();
  };
  return (
    <button
      onClick={handleOpenSettings}
      className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg"
      title="Notification Settings"
    >
      🔔 <Translate content="Notifications" />
    </button>
  );
};
