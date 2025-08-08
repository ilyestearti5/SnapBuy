# 🔔 Notification Testing Guide for SnapBuy Desktop

## Overview

This guide will help you test and troubleshoot notification functionality on desktop in the SnapBuy application.

## Quick Testing

### 1. Using the Floating Tester

- Look for the blue bell icon in the bottom-right corner of the screen
- Click it to expand the testing panel
- Use the "Quick Test" button for immediate testing

### 2. Using the Navigation Header

- Click the bell icon in the top navigation bar
- This will open the full notification testing center
- Also automatically runs a quick test

### 3. Using Browser Console

Open the browser developer tools (F12) and run:

```javascript
// Quick notification test
window.testNotification();

// Show debug information
window.notificationDebug();

// Apply notification fixes
window.fixNotifications();

// Test after applying fixes
window.testNotificationFixes();
```

## Troubleshooting Common Issues

### ❌ No Notifications Appearing

**Check Browser Settings:**

1. **Chrome:**

   - Go to Settings > Privacy and security > Site Settings > Notifications
   - Ensure SnapBuy is allowed to send notifications
   - Check that "Sites can ask to send notifications" is enabled

2. **Firefox:**

   - Go to Settings > Privacy & Security > Permissions > Notifications
   - Find your site and ensure it's set to "Allow"

3. **Edge:**
   - Go to Settings > Site permissions > Notifications
   - Ensure notifications are enabled for the site

**Check System Settings:**

**Windows:**

1. Open Settings > System > Notifications & actions
2. Ensure "Get notifications from apps and other senders" is ON
3. Check if Focus assist is blocking notifications
4. Verify your browser is listed and enabled in notification senders

**macOS:**

1. Open System Preferences > Notifications
2. Find your browser in the list
3. Ensure "Allow Notifications" is checked
4. Check "Banners" or "Alerts" style is selected

**Linux:**

1. Ensure your desktop environment supports notifications (GNOME, KDE, etc.)
2. Check notification settings in your desktop environment

### ⚠️ Notifications Appear Briefly Then Disappear

This is normal behavior on some systems:

- Windows may show notifications briefly then move them to Action Center
- macOS may show notifications then move them to Notification Center
- Check your system's notification history/center

### 🔧 Advanced Troubleshooting

**Open Browser Developer Tools (F12):**

1. **Console Tab:**

   - Look for notification-related error messages
   - Run `window.testNotification()` and watch for errors

2. **Application Tab:**

   - Check "Service Workers" section
   - Ensure the service worker is registered and running
   - Try "Update" or "Unregister" then refresh the page

3. **Network Tab:**
   - Ensure `/sw.js` loads successfully
   - Check for any network errors

**Permission Issues:**

```javascript
// Check current permission status
console.log("Permission:", Notification.permission);

// Request permission manually
Notification.requestPermission().then((permission) => {
  console.log("New permission:", permission);
});
```

## Testing Different Notification Types

### 1. Basic Notification

```javascript
new Notification("Test Title", {
  body: "Test message",
  icon: "/assets/snapbuy.png",
});
```

### 2. Notification with Actions

```javascript
new Notification("Test with Actions", {
  body: "This notification has action buttons",
  actions: [
    { action: "view", title: "View" },
    { action: "dismiss", title: "Dismiss" },
  ],
});
```

### 3. Service Worker Notification

```javascript
navigator.serviceWorker.ready.then((registration) => {
  registration.showNotification("Service Worker Test", {
    body: "This comes from the service worker",
    icon: "/assets/snapbuy.png",
  });
});
```

## Notification Features in SnapBuy

### Available Notification Types:

- 🛒 New Orders
- 🔄 Order Status Changes
- ✅ Order Completed
- ❌ Order Cancelled
- 🔧 Order Processing
- 🚚 Order Delivery
- ⚠️ Low Stock Alerts
- 📦 New Products
- 👥 New Clients

### Testing Business Notifications:

1. Go to Notification Settings in the app
2. Enable different notification types
3. Simulate events (create test orders, update stock, etc.)
4. Verify notifications appear for enabled types

## Best Practices for Users

1. **Always grant permission** when prompted
2. **Keep the browser updated** for best notification support
3. **Check system Do Not Disturb settings** if notifications stop working
4. **Test after browser updates** as notification behavior can change
5. **Use Chrome or Edge** for best notification compatibility on Windows

## Common Error Messages and Solutions

### "Notifications not supported"

- **Solution:** Use a modern browser (Chrome, Firefox, Edge)
- **Minimum versions:** Chrome 50+, Firefox 44+, Edge 14+

### "Permission denied"

- **Solution:** Enable notifications in browser settings
- **Reset:** Clear site data and refresh to re-request permission

### "Service worker registration failed"

- **Solution:** Check if `/sw.js` file exists and is accessible
- **Network issues:** Ensure good internet connection

### "Notification constructor is not defined"

- **Solution:** This indicates the browser doesn't support notifications
- **Workaround:** Use a different browser or update current browser

## Developer Console Commands

```javascript
// Test basic notification support
console.log("Supported:", "Notification" in window);

// Check permission
console.log("Permission:", Notification.permission);

// Request permission
await Notification.requestPermission();

// Test service worker
navigator.serviceWorker.getRegistration().then((reg) => {
  console.log("SW registered:", !!reg);
});

// Show debug info
window.notificationDebug();

// Quick test
window.testNotification();
```

## Contact Support

If notifications still don't work after following this guide:

1. Copy the output from `window.notificationDebug()`
2. Take a screenshot of any error messages in the browser console
3. Note your operating system and browser version
4. Include details about what you were doing when the issue occurred

---

_Last updated: ${new Date().toLocaleDateString()}_
