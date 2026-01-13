import storePhoto from "../assets/store.png";
import discord from "../assets/platforms/discord.png";
import facebook from "../assets/platforms/facebook.png";
import instagram from "../assets/platforms/instagram.png";
import snapchat from "../assets/platforms/snapchat.png";
import tiktok from "../assets/platforms/tiktok.png";
import x from "../assets/platforms/x.png";
import reddit from "../assets/platforms/reddit.png";
import telegram from "../assets/platforms/telegram.png";
import linkedin from "../assets/platforms/linkedin.png";
import pinterest from "../assets/platforms/pinterest.png";
import youtube from "../assets/platforms/youtube.png";
import unknown from "../assets/platforms/unknown.png";
import chrome from "../assets/platforms/chrome.png";
import safari from "../assets/platforms/safari.png";
import clientPhoto from "../assets/clients.png";
import feedbackPhoto from "../assets/feedback.png";
import deliveryPhoto from "../assets/delivery.png";
import androidPhoto from "../assets/android.png";
import integrationsPhoto from "../assets/integrations.png";
import edge from "../assets/platforms/edge.png";
import { allIcons } from "@biqpod/app/ui/apis";
import { IconProps } from "@biqpod/app/ui/components";
import { ColorIds } from "@biqpod/app/ui/hooks";
import { Biqpod, SettingValueType } from "@biqpod/app/ui/types";
import productsPhoto from "../assets/products.png";
import shoppingPhoto from "../assets/shopping.png";
import overviewPhoto from "../assets/overview.png";
import settingsPhoto from "../assets/settings.png";
import { mergeArray } from "@biqpod/app/ui/shared";
export const platformsPhotos: Partial<
  Record<Biqpod.Snapbuy.Basic.Platform, string>
> = {
  discord,
  facebook,
  instagram,
  snapchat,
  tiktok,
  x,
  reddit,
  telegram,
  linkedin,
  pinterest,
  youtube,
  unknown,
  chrome,
  safari,
  edge,
};
export const getImageByPlatform = (string?: Biqpod.Snapbuy.Basic.Platform) => {
  return (string && platformsPhotos[string]) || unknown;
};
export const colors: Record<string, string> = {
  pending: "#F59E0B", // Yellow
  completed: "#10B981", // Green
  processing: "#3B82F6", // Blue
  done: "#047857", // Dark Green
  cancelled: "#EF4444", // Red
  delivery: "#129999",
};
export const orderStatusIcons: Record<string, IconProps["icon"]> = {
  pending: allIcons.solid.faClock,
  completed: allIcons.solid.faCheckCircle,
  processing: allIcons.solid.faCog,
  done: allIcons.solid.faCheckDouble,
  cancelled: allIcons.solid.faBan,
  delivery: allIcons.solid.faCar,
};
export const roleIcons: Record<
  Biqpod.Snapbuy.Basic.DeliveryCompanyRole,
  IconProps["icon"]
> = {
  customer: allIcons.solid.faUser,
  admin: allIcons.solid.faUserTie,
  finance: allIcons.solid.faMoneyBill,
  warehouse_operator: allIcons.solid.faBox,
  delivery_agent: allIcons.solid.faTruck,
  support: allIcons.solid.faHeadset,
  franchise_partner: allIcons.solid.faHandshake,
  merchant: allIcons.solid.faStore,
};
export const roleColors: Record<
  Biqpod.Snapbuy.Basic.DeliveryCompanyRole,
  string
> = {
  customer: "#4CAF50",
  admin: "#2196F3",
  finance: "#FF9800",
  warehouse_operator: "#FF5722",
  delivery_agent: "#9C27B0",
  support: "#3F51B5",
  franchise_partner: "#009688",
  merchant: "#FFEB3B",
};
export const DAYS_LEFT = 7;
export const tabServices = mergeArray(
  {
    name: "Stores",
    link: "/store",
    photo: storePhoto,
  },
  {
    name: "Client",
    link: "/client",
    photo: clientPhoto,
  },
  {
    name: "Deliveries",
    link: "/deliveries",
    photo: deliveryPhoto,
  },
  import.meta.env.DEV && {
    name: "Development",
    link: "/test",
    photo:
      "https://cdn1.iconfinder.com/data/icons/3d-web-design/512/11._Developer.png",
  }
);
export const extraTabs = [
  {
    name: "feedbacks",
    link: "/feedbacks",
    photo: feedbackPhoto,
  },
  {
    name: "documentation",
    link: "/documentation",
    photo:
      "https://cdn3d.iconscout.com/3d/premium/thumb/document-correct-3d-icon-png-download-5360809.png",
  },
  {
    name: "developer",
    link: "/developer",
    photo:
      "https://cdn1.iconfinder.com/data/icons/3d-web-design/512/11._Developer.png",
  },
];
if (import.meta.env.DEV) {
  extraTabs.push({
    name: "agent",
    link: "/agent",
    photo:
      "https://cdn3d.iconscout.com/3d/premium/thumb/robot-reading-a-book-3d-icon-png-download-11431719.png",
  });
}
export const appTabs = [
  {
    name: "Android",
    url: "https://drive.google.com/thumbnail?id=11I8jEbzcbvnOzOfrHpv8Ut87EQWoExBS",
    photo: androidPhoto,
  },
];
export const rolsInList: {
  content: string;
  value: Biqpod.Snapbuy.Basic.DeliveryCompanyRole;
}[] = [
  { content: "🏭 Warehouse Operator", value: "warehouse_operator" },
  { content: "🚚 Delivery Agent", value: "delivery_agent" },
];
export const userTabs = [
  {
    name: "dashboard",
    link: `/store/{storeId}/dashboard`,
    photo: overviewPhoto,
  },
  {
    name: "catalog",
    link: `/store/{storeId}/catalog`,
    photo: productsPhoto,
  },
  {
    name: "sales",
    link: `/store/{storeId}/sales`,
    photo: shoppingPhoto,
  },
  {
    name: "templates",
    link: `/store/{storeId}/templates`,
    photo:
      "https://cdn3d.iconscout.com/3d/premium/thumb/template-3d-icon-png-download-8316799.png",
  },
  {
    name: "configuration",
    link: `/store/{storeId}/configuration`,
    photo: settingsPhoto,
  },
  {
    name: "integrations",
    link: `/store/{storeId}/integrations`,
    photo: integrationsPhoto,
  },
];
export const clientTabs: Tab[] = [
  {
    name: "orders",
    icon: allIcons.solid.faShoppingCart,
    link: "/client/orders",
  },
  {
    name: "products",
    icon: allIcons.solid.faBox,
    link: "/client/stores",
  },
];
export const types: {
  id: keyof SettingValueType;
  name: string;
  description: string;
}[] = [
  { id: "array", name: "📚 Array", description: "A list of values" },
  { id: "boolean", name: "✅ Boolean", description: "True or false value" },
  { id: "color", name: "🎨 Color", description: "Color picker" },
  { id: "date", name: "📅 Date", description: "Date picker" },
  { id: "enum", name: "🔢 Enum", description: "Enumeration of values" },
  { id: "filter", name: "🔍 Filter", description: "Filter criteria" },
  { id: "number", name: "🔢 Number", description: "Numeric value" },
  { id: "pin", name: "🔢 PIN", description: "PIN code input" },
  { id: "range", name: "🎚️ Range", description: "Range slider" },
  { id: "string", name: "🔤 String", description: "Text value" },
];
export const colorsInListWithNames: { colorId: ColorIds; name: string }[] = [
  { colorId: "borders", name: "Borders" },
  { colorId: "primary.content", name: "Order Button Text" },
  { colorId: "primary", name: "Order Button" },
  { colorId: "secondary.background", name: "Background" },
  { colorId: "secondary", name: "Secondary" },
  { colorId: "shadow.color", name: "Shadow" },
  { colorId: "text.color", name: "Text" },
  { colorId: "field.background", name: "Inputs" },
];
export const arraySeparator = ",;,";
export const images = {
  pricing:
    "https://cdn3d.iconscout.com/3d/premium/thumb/price-tag-3d-icon-download-in-png-blend-fbx-gltf-file-formats--label-sale-discount-shopping-pack-e-commerce-icons-5326821.png?f=webp",
  settings:
    "https://static.vecteezy.com/system/resources/previews/047/248/352/non_2x/setting-3d-setting-icon-3d-setting-symbol-3d-setting-image-free-png.png",
  googleDrive:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png",
};
export const sharSocialMedia = [
  {
    name: "Facebook",
    icon: allIcons.brands.faFacebook,
    link: "https://web.facebook.com/share_channel/?type=reshare&link={link}&app_id=87741124305&source_surface=external_reshare&display=popup&hashtag#",
  },
  {
    name: "Twitter",
    icon: allIcons.brands.faTwitter,
    link: "https://twitter.com/intent/tweet?url={link}",
  },
  {
    name: "LinkedIn",
    icon: allIcons.brands.faLinkedin,
    link: "https://www.linkedin.com/shareArticle?mini=true&url={link}",
  },
  {
    name: "WhatsApp",
    icon: allIcons.brands.faWhatsapp,
    link: "https://api.whatsapp.com/send?text={link}",
  },
  {
    name: "Telegram",
    icon: allIcons.brands.faTelegram,
    link: "https://t.me/share/url?url={link}",
  },
  {
    name: "Instagram",
    icon: allIcons.brands.faInstagram,
    link: "https://www.instagram.com/?url={link}",
  },
  {
    name: "Snapchat",
    icon: allIcons.brands.faSnapchatGhost,
    link: "https://snapchat.com/share?text={link}",
  },
  {
    name: "Pinterest",
    icon: allIcons.brands.faPinterest,
    link: "https://pinterest.com/pin/create/button/?url={link}",
  },
];
// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
export const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
  hover: {
    y: -5,
    transition: {
      duration: 0.3,
    },
  },
};
export const headerVariants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};
export const buttonVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    transition: {
      duration: 0.1,
    },
  },
};
export const tokenContainerVariants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.4,
    },
  },
};
export const tokenVariants = {
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
};
export const codeBlockVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};
export const errorVariants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
    },
  },
};
