import { initMyCloud } from "@biqpod/app/ui/apis";
import { Biqpod } from "@biqpod/app/ui/types";
import { randomItem } from "@biqpod/app/ui/utils";
export const cloud = initMyCloud({
  apiKey: "AIzaSyB0XSUnBSOaIWp-37u2N4ib5bY8-09Zeq0",
  authDomain: "water-fetch.firebaseapp.com",
  databaseURL: "https://water-fetch-default-rtdb.firebaseio.com",
  projectId: "water-fetch",
  storageBucket: "water-fetch.appspot.com",
  messagingSenderId: "911813185967",
  appId: "1:911813185967:web:4447a361eeaddd00315f5a",
  measurementId: "G-8GB7LZPHVX",
  functions: {
    devUri: (fnId) => `http://localhost:3000/invoke/${fnId}`,
    prodUri: (fnId) => {
      return `https://functions-3nrx.onrender.com/invoke/${fnId}`;
      const { value } = randomItem(
        [
          `https://functions-3nrx.onrender.com`,
          // "https://closed-maddie-biqpod-08b5b50b.koyeb.app",
        ].map((origin) => {
          return `${origin}/invoke/${fnId}`;
        })
      );
      return value || `https://functions-3nrx.onrender.com/invoke/${fnId}`;
    },
  },
});
// this is needed in the project for default informations
cloud.setAsMain();
export const { nosql: db, functions, auth, storage, ai } = cloud.app;
export const {
  getDoc,
  getDocs,
  getCollections,
  createDoc,
  upsertDoc: setDoc,
  deleteDoc,
  onCollectionSnapshot,
  onDocSnapshot,
  onAutoSnapshot,
} = cloud.app.nosql;
export const {
  signIn,
  signOut,
  generateToken,
  onAuthStateChanged,
  deleteUser,
  signInWithCustomToken,
  getCurrentAuth,
} = cloud.app.auth;
export const {
  upsertFile: uploadFile,
  deleteFile,
  getDownloadURL,
  getFileContent: getContent,
} = cloud.app.storage;
export const settings: Biqpod.System.Setting.Type[] = [
  {
    settingId: "commercer/openTime.date",
    synced: true,
    value: "00:00",
    name: "Open Store At",
    config: {
      format: "time",
    },
    desc: "Set the time when the store will be opened",
  },
  {
    settingId: "commercer/closeTime.date",
    synced: true,
    name: "Close Store At",
    value: "23:59",
    config: {
      format: "time",
    },
    desc: "Set the time when the store will be closed",
  },
  {
    settingId: "commercer/currency.string",
    synced: true,
    value: "DZD",
    name: "Store Currency",
    desc: "Set the currency of the store",
  },
  {
    settingId: "commercer/taxRate.number",
    synced: true,
    value: 0,
    name: "Tax Rate (%)",
    config: {
      format: "number",
      min: 0,
      max: 100,
      step: 0.01,
    },
    desc: "Set the default tax rate percentage for orders",
  },
  {
    settingId: "commercer/allowGuestCheckout.boolean",
    synced: true,
    value: true,
    name: "Allow Guest Checkout",
    config: {
      format: "boolean",
    },
    desc: "Enable or disable guest checkout for customers",
  },
  {
    settingId: "commercer/lowStockThreshold.number",
    synced: true,
    value: 5,
    name: "Low Stock Threshold",
    config: {
      format: "number",
      min: 1,
      step: 1,
    },
    desc: "Set the threshold for low stock notifications",
  },
  {
    settingId: "commercer/supportEmail.string",
    synced: true,
    value: "support@example.com",
    name: "Support Email",
    config: {
      format: "email",
    },
    desc: "Set the support email address for customer inquiries",
  },
  {
    settingId: "commercer/enableReviews.boolean",
    synced: true,
    value: true,
    name: "Enable Product Reviews",
    config: {
      format: "boolean",
    },
    desc: "Allow customers to leave product reviews",
  },
  {
    settingId: "commercer/minOrderAmount.number",
    synced: true,
    value: 0,
    name: "Minimum Order Amount",
    config: {
      format: "number",
      min: 0,
      step: 0.01,
    },
    desc: "Set the minimum order amount required for checkout",
  },
  {
    settingId: "commercer/freeShippingThreshold.number",
    synced: true,
    value: 1000,
    name: "Free Shipping Threshold",
    config: {
      format: "number",
      min: 0,
      step: 0.01,
    },
    desc: "Set the order amount above which shipping is free",
  },
  {
    settingId: "commercer/enableWishlist.boolean",
    synced: true,
    value: true,
    name: "Enable Wishlist",
    config: {
      format: "boolean",
    },
    desc: "Allow customers to add products to a wishlist",
  },
  {
    settingId: "commercer/orderCancellationPeriod.number",
    synced: true,
    value: 24,
    name: "Order Cancellation Period (hours)",
    config: {
      format: "number",
      min: 1,
      step: 1,
    },
    desc: "Set the period (in hours) during which an order can be cancelled",
  },
  {
    settingId: "commercer/enableNotifications.boolean",
    synced: true,
    value: true,
    name: "Enable Notifications",
    config: {
      format: "boolean",
    },
    desc: "Enable or disable notifications for customers",
  },
  {
    settingId: "ads/facebook/pixelId.string",
    synced: true,
    value: "",
    name: "Facebook Pixel ID",
    desc: "Set the Facebook Pixel ID for tracking and analytics",
    config: {
      hint: "e.g. 1234567890",
    },
  },
  {
    settingId: "ads/google/analyticsId.string",
    synced: true,
    value: "",
    name: "Google Analytics ID",
    desc: "Set the Google Analytics ID for tracking and analytics",
  },
  {
    settingId: "ads/google/adMobId.string",
    synced: true,
    value: "",
    name: "Google AdMob ID",
    desc: "Set the Google AdMob ID for in-app advertising",
  },
  {
    settingId: "ads/twitter/adsId.string",
    synced: true,
    value: "",
    name: "Twitter Ads ID",
    desc: "Set the Twitter Ads ID for tracking and analytics",
  },
  {
    settingId: "ads/linkedin/partnerId.string",
    synced: true,
    value: "",
    name: "LinkedIn Partner ID",
    desc: "Set the LinkedIn Partner ID for tracking and analytics",
  },
  {
    // tiktok
    settingId: "ads/tiktok/adsId.string",
    synced: true,
    value: "",
    name: "TikTok Ads ID",
    desc: "Set the TikTok Ads ID for tracking and analytics",
  },
];
