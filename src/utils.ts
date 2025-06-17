import storePhoto from "./assets/store.png";
import discord from "./assets/platforms/discord.png";
import facebook from "./assets/platforms/facebook.png";
import instagram from "./assets/platforms/instagram.png";
import snapchat from "./assets/platforms/snapchat.png";
import tiktok from "./assets/platforms/tiktok.png";
import twitter from "./assets/platforms/x.png";
import reddit from "./assets/platforms/reddit.png";
import telegram from "./assets/platforms/telegram.png";
import linkedin from "./assets/platforms/linkedin.png";
import pinterest from "./assets/platforms/pinterest.png";
import youtube from "./assets/platforms/youtube.png";
import unknown from "./assets/platforms/unknown.png";
import chrome from "./assets/platforms/chrome.png";
import safari from "./assets/platforms/safari.png";
import clientPhoto from "./assets/clients.png";
import feedbackPhoto from "./assets/feedback.png";
import offersPhoto from "./assets/offers.png";
import deliveryPhoto from "./assets/delivery.png";
import { allIcons } from "@biqpod/app/ui/apis";
import { IconProps } from "@biqpod/app/ui/components";
import androidPhoto from "./assets/android.png";
import edge from "./assets/platforms/edge.png";
import {
  ColorIds,
  execAction,
  getTemp,
  setTemp,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing, SettingValueType } from "@biqpod/app/ui/types";
import { useMemo } from "react";
import { useLocation } from "react-router";
import productsPhoto from "./assets/products.png";
import shoppingPhoto from "./assets/shopping.png";
import overviewPhoto from "./assets/overview.png";
import formsPhoto from "./assets/forms.png";
export const userTabs = [
  {
    name: "overview",
    link: `/store/{storeId}/overview`,
    photo: overviewPhoto,
  },
  {
    name: "products",
    link: `/store/{storeId}/products`,
    photo: productsPhoto,
  },
  {
    name: "orders",
    link: `/store/{storeId}/orders`,
    photo: shoppingPhoto,
  },
  // {
  //   name: "integrations",
  //   link: `/store/{storeId}/integrations`,
  //   photo: integrationsPhoto,
  // },
  {
    name: "Stores",
    link: `/store/{storeId}/stores`,
    photo: storePhoto,
  },
  {
    name: "Form's",
    link: "/store/{storeId}/forms",
    photo: formsPhoto,
  },
];
export const toId = (value: string) => {
  return value.toLowerCase().replaceAll(/( |\.)+/gi, "-");
};
export const platformsPhotos: Partial<Record<SnapBuy.Platform, string>> = {
  discord,
  facebook,
  instagram,
  snapchat,
  tiktok,
  twitter,
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
export const getImageByPlatform = (string?: SnapBuy.Platform) => {
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
export const icons: Record<string, IconProps["icon"]> = {
  pending: allIcons.solid.faClock,
  completed: allIcons.solid.faCheckCircle,
  processing: allIcons.solid.faCog,
  done: allIcons.solid.faCheckDouble,
  cancelled: allIcons.solid.faBan,
  delivery: allIcons.solid.faCar,
};
export const getStringTimeLeave = (from: Date | number, to: Date | number) => {
  const fromTime = new Date(from);
  const toTime = new Date(to);
  const timeDifference = Math.floor(
    (toTime.getTime() - fromTime.getTime()) / 1000
  );
  let time = "";
  if (timeDifference < 60) {
    time = `${timeDifference} sec${timeDifference > 1 ? "s" : ""}`;
  } else if (timeDifference < 3600) {
    const minutes = Math.floor(timeDifference / 60);
    time = `${minutes} min${minutes > 1 ? "s" : ""}`;
  } else if (timeDifference < 86400) {
    const hours = Math.floor(timeDifference / 3600);
    time = `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (timeDifference < 604800) {
    const days = Math.floor(timeDifference / 86400);
    time = `${days} day${days > 1 ? "s" : ""}`;
  } else if (timeDifference < 2419200) {
    const weeks = Math.floor(timeDifference / 604800);
    time = `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else if (timeDifference < 29030400) {
    const months = Math.floor(timeDifference / 2419200);
    time = `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(timeDifference / 29030400);
    time = `${years} year${years > 1 ? "s" : ""}`;
  }
  return time;
};
export const roleIcons: Record<SnapBuy.DeliveryCompanyRole, IconProps["icon"]> =
  {
    customer: allIcons.solid.faUser,
    admin: allIcons.solid.faUserTie,
    finance: allIcons.solid.faMoneyBill,
    warehouse_operator: allIcons.solid.faBox,
    delivery_agent: allIcons.solid.faTruck,
    support: allIcons.solid.faHeadset,
    franchise_partner: allIcons.solid.faHandshake,
    merchant: allIcons.solid.faStore,
  };
export const roleColors: Record<SnapBuy.DeliveryCompanyRole, string> = {
  customer: "#4CAF50",
  admin: "#2196F3",
  finance: "#FF9800",
  warehouse_operator: "#FF5722",
  delivery_agent: "#9C27B0",
  support: "#3F51B5",
  franchise_partner: "#009688",
  merchant: "#FFEB3B",
};
export const tabServices = [
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
];
export const extraTabs = [
  {
    name: "offers",
    link: "/offers",
    photo: offersPhoto,
  },
  {
    name: "feedbacks",
    link: "/feedbacks",
    photo: feedbackPhoto,
  },
];

export const appTabs = [
  {
    name: "Android",
    url: "https://drive.google.com/uc?export=download&id=11I8jEbzcbvnOzOfrHpv8Ut87EQWoExBS",
    photo: androidPhoto,
  },
];

export const rolsInList: {
  content: string;
  value: SnapBuy.DeliveryCompanyRole;
}[] = [
  { content: "🏭 Warehouse Operator", value: "warehouse_operator" },
  { content: "🚚 Delivery Agent", value: "delivery_agent" },
];
export const translations = [
  {
    en: "Dark / Light",
    fr: "Sombre / Clair",
    ar: "داكن / فاتح",
    word: "Dark%20/%20Light",
  },
  {
    en: "This page will be available soon.",
    fr: "Cette page sera bientôt disponible.",
    ar: "هذه الصفحة ستكون متاحة قريبا.",
    word: "this%20page%20will%20be%20available%20soon",
  },
  {
    en: "10 Products",
    fr: "10 Produits",
    ar: "10 منتجات",
    word: "10%20products",
  },
  {
    en: "50 Products",
    fr: "50 Produits",
    ar: "50 منتجًا",
    word: "50%20products",
  },
  {
    en: "400 Orders / Week",
    fr: "400 Commandes / Semaine",
    ar: "400 طلب / أسبوع",
    word: "400%20orders%20%2F%20week",
  },
  {
    en: "1000 Orders / Week",
    fr: "1000 Commandes / Semaine",
    ar: "1000 طلب / أسبوع",
    word: "1000%20orders%20%2F%20week",
  },
  {
    en: "-",
    fr: "-",
    ar: "-",
    word: "-",
  },
  {
    en: "Account",
    fr: "Compte",
    ar: "الحساب",
    word: "account",
  },
  {
    en: "Add",
    fr: "Ajouter",
    ar: "إضافة",
    word: "add",
  },
  {
    en: "Add Store",
    fr: "Ajouter un magasin",
    ar: "إضافة متجر",
    word: "add%20store",
  },
  {
    en: "Ads",
    fr: "Publicités",
    ar: "إعلانات",
    word: "ads",
  },
  {
    en: "Available",
    fr: "Disponible",
    ar: "متاح",
    word: "available",
  },
  {
    en: "Basic",
    fr: "Basique",
    ar: "أساسي",
    word: "basic",
  },
  {
    en: "Cancel",
    fr: "Annuler",
    ar: "إلغاء",
    word: "cancel",
  },
  {
    en: "Change Language",
    fr: "Changer la langue",
    ar: "تغيير اللغة",
    word: "change%20language",
  },
  {
    en: "Client",
    fr: "Client",
    ar: "عميل",
    word: "client",
  },
  {
    en: "Company",
    fr: "Entreprise",
    ar: "شركة",
    word: "company",
  },
  {
    en: "Completed",
    fr: "Terminé",
    ar: "مكتمل",
    word: "completed",
  },
  {
    en: "Created At",
    fr: "Créé le",
    ar: "تاريخ الإنشاء",
    word: "created%20at",
  },
  {
    en: "Current Plan",
    fr: "Plan actuel",
    ar: "الخطة الحالية",
    word: "current%20plan",
  },
  {
    en: "Dark Mode",
    fr: "Mode sombre",
    ar: "الوضع الداكن",
    word: "dark%20mode",
  },
  {
    en: "Deliveries",
    fr: "Livraisons",
    ar: "توصيلات",
    word: "deliveries",
  },
  {
    en: "Done",
    fr: "Fait",
    ar: "تم",
    word: "done",
  },
  {
    en: "Feedbacks",
    fr: "Commentaires",
    ar: "ملاحظات",
    word: "feedbacks",
  },
  {
    en: "Fetch More",
    fr: "Charger plus",
    ar: "جلب المزيد",
    word: "fetch%20more",
  },
  {
    en: "Follow",
    fr: "Suivre",
    ar: "متابعة",
    word: "follow",
  },
  {
    en: "Home",
    fr: "Accueil",
    ar: "الرئيسية",
    word: "home",
  },
  {
    en: "Join Feed",
    fr: "Rejoindre le fil",
    ar: "الانضمام إلى الخلاصة",
    word: "join%20feed",
  },
  {
    en: "Key",
    fr: "Clé",
    ar: "مفتاح",
    word: "key",
  },
  {
    en: "Logout",
    fr: "Déconnexion",
    ar: "تسجيل الخروج",
    word: "logout",
  },
  {
    en: "Manage Account",
    fr: "Gérer le compte",
    ar: "إدارة الحساب",
    word: "manage%20account",
  },
  {
    en: "More",
    fr: "Plus",
    ar: "المزيد",
    word: "more",
  },
  {
    en: "No key there is",
    fr: "Pas de clé disponible",
    ar: "لا يوجد مفتاح هناك",
    word: "no%20key%20ther%20is",
  },
  {
    en: "No products found",
    fr: "Aucun produit trouvé",
    ar: "لم يتم العثور على منتجات",
    word: "no%20products%20found",
  },
  {
    en: "No stores found",
    fr: "Aucun magasin trouvé",
    ar: "لم يتم العثور على متاجر",
    word: "no%20stores%20found",
  },
  {
    en: "Notifications",
    fr: "Notifications",
    ar: "إشعارات",
    word: "notifications",
  },
  {
    en: "Offers",
    fr: "Offres",
    ar: "عروض",
    word: "offers",
  },
  {
    en: "Orders",
    fr: "Commandes",
    ar: "طلبات",
    word: "orders",
  },
  {
    en: "Orders Placed Today",
    fr: "Commandes passées aujourd'hui",
    ar: "الطلبات المقدمة اليوم",
    word: "orders%20placed%20today",
  },
  {
    en: "Overview",
    fr: "Aperçu",
    ar: "نظرة عامة",
    word: "overview",
  },
  {
    en: "Pending",
    fr: "En attente",
    ar: "معلق",
    word: "pending",
  },
  {
    en: "Plans",
    fr: "Plans",
    ar: "خطط",
    word: "plans",
  },
  {
    en: "Pro",
    fr: "Pro",
    ar: "احترافي",
    word: "pro",
  },
  {
    en: "Products",
    fr: "Produits",
    ar: "منتجات",
    word: "products",
  },
  {
    en: "Profile",
    fr: "Profil",
    ar: "الملف الشخصي",
    word: "profile",
  },
  {
    en: "Promoted",
    fr: "Promu",
    ar: "مروج",
    word: "promoted",
  },
  {
    en: "Promotion",
    fr: "Promotion",
    ar: "ترويج",
    word: "promotion",
  },
  {
    en: "Sales This Week",
    fr: "Ventes cette semaine",
    ar: "مبيعات هذا الأسبوع",
    word: "sales%20this%20week",
  },
  {
    en: "Services",
    fr: "Services",
    ar: "خدمات",
    word: "services",
  },
  {
    en: "Settings",
    fr: "Paramètres",
    ar: "إعدادات",
    word: "settings",
  },
  {
    en: "Status",
    fr: "Statut",
    ar: "الحالة",
    word: "status",
  },
  {
    en: "Store",
    fr: "Magasin",
    ar: "متجر",
    word: "store",
  },
  {
    en: "Store Of",
    fr: "Magasin de",
    ar: "متجر لـ",
    word: "store%20of",
  },
  {
    en: "Stores",
    fr: "Magasins",
    ar: "متاجر",
    word: "stores",
  },
  {
    en: "Today's Orders",
    fr: "Commandes d'aujourd'hui",
    ar: "طلبات اليوم",
    word: "today's%20orders",
  },
  {
    en: "Total Sales",
    fr: "Ventes Totales",
    ar: "إجمالي المبيعات",
    word: "total%20sales",
  },
  {
    en: "Unfollow",
    fr: "Ne plus suivre",
    ar: "إلغاء المتابعة",
    word: "unfollow",
  },
  {
    en: "Unlimited Orders / Week",
    fr: "Commandes illimitées / Semaine",
    ar: "طلبات غير محدودة / أسبوع",
    word: "unlimited%20orders%20%2F%20week",
  },
  {
    en: "Unlimited Products",
    fr: "Produits illimités",
    ar: "منتجات غير محدودة",
    word: "unlimited%20products",
  },
  {
    en: "Edit Profile",
    fr: "Modifier le profil",
    ar: "تعديل الملف الشخصي",
    word: "edit%20profile",
  },
  {
    en: "Save Changes",
    fr: "Enregistrer les modifications",
    ar: "حفظ التغييرات",
    word: "save%20changes",
  },
  {
    en: "Delete Item",
    fr: "Supprimer l'élément",
    ar: "حذف العنصر",
    word: "delete%20item",
  },
  {
    en: "Add Item",
    fr: "Ajouter un élément",
    ar: "إضافة عنصر",
    word: "add%20item",
  },
  {
    en: "Search",
    fr: "Rechercher",
    ar: "بحث",
    word: "search",
  },
  {
    en: "Filter",
    fr: "Filtrer",
    ar: "تصفية",
    word: "filter",
  },
  {
    en: "Sort By",
    fr: "Trier par",
    ar: "ترتيب حسب",
    word: "sort%20by",
  },
  {
    en: "Upload Image",
    fr: "Télécharger une image",
    ar: "تحميل صورة",
    word: "upload%20image",
  },
  {
    en: "View Details",
    fr: "Voir les détails",
    ar: "عرض التفاصيل",
    word: "view%20details",
  },
  {
    en: "Share",
    fr: "Partager",
    ar: "مشاركة",
    word: "share",
  },
  {
    en: "Login",
    fr: "Connexion",
    ar: "تسجيل الدخول",
    word: "login",
  },
  {
    en: "Email",
    fr: "E-mail",
    ar: "البريد الإلكتروني",
    word: "email",
  },
  {
    en: "Password",
    fr: "Mot de passe",
    ar: "كلمة المرور",
    word: "password",
  },
  {
    en: "Sign Up",
    fr: "S'inscrire",
    ar: "التسجيل",
    word: "sign%20up",
  },
  {
    en: "Biq Pod for payment process and charge by what you want",
    fr: "Biq Pod pour le processus de paiement et la facturation selon vos souhaits",
    ar: "Biq Pod لعملية الدفع والفوترة حسب رغبتك",
    word: "biq%20pod%20for%20payment%20proccess%20and%20charge%20by%20what%20evry%20you%20want",
  },
  {
    en: "Power Save Pays",
    fr: "Économies d'énergie paie",
    ar: "مدفوعات توفير الطاقة",
    word: "power%20save%20pays",
  },
  {
    en: "Login into Biq Pod",
    fr: "Se connecter à Biq Pod",
    ar: "تسجيل الدخول إلى Biq Pod",
    word: "login%20into%20biq%20pod",
  },
  {
    en: "History",
    fr: "Historique",
    ar: "السجل",
    word: "history",
  },
  {
    en: "Don't have an account?",
    fr: "Vous n'avez pas de compte ?",
    ar: "ليس لديك حساب؟",
    word: "don't%20have%20an%20account%3F",
  },
  {
    en: "Payouts",
    fr: "Versements",
    ar: "المدفوعات",
    word: "payouts",
  },
  {
    en: "See All Histories",
    fr: "Voir tous les historiques",
    ar: "مشاهدة كل السجلات",
    word: "see%20all%20historys",
  },
  {
    en: "Confirm Password",
    fr: "Confirmer le mot de passe",
    ar: "تأكيد كلمة المرور",
    word: "confirm%20password",
  },
  {
    en: "Sign in to Biq Pod",
    fr: "Se connecter à Biq Pod",
    ar: "تسجيل الدخول إلى Biq Pod",
    word: "sigin%20into%20biq%20pod",
  },
  {
    en: "Signup",
    fr: "S'inscrire",
    ar: "التسجيل",
    word: "signup",
  },
  {
    en: "Already have one?",
    fr: "Vous en avez déjà un ?",
    ar: "هل لديك حساب بالفعل؟",
    word: "already%20have%20one%3F",
  },
  {
    en: "Description:",
    fr: "Description :",
    ar: "الوصف :",
    word: "description%20%3A%20",
  },
  {
    en: "Add to Cart",
    fr: "Ajouter au panier",
    ar: "إضافة إلى السلة",
    word: "add%20to%20cart",
  },
  {
    en: "",
    fr: "",
    ar: "",
    word: "",
  },
  {
    en: "See",
    fr: "Voir",
    ar: "رؤية",
    word: "see",
  },
  {
    en: "Send Order",
    fr: "Envoyer la commande",
    ar: "إرسال الطلب",
    word: "send%20order",
  },
  {
    en: "Cart",
    fr: "Panier",
    ar: "السلة",
    word: "cart",
  },
  {
    en: "Complete",
    fr: "Terminer",
    ar: "إتمام",
    word: "complete",
  },
  {
    en: "First Name",
    fr: "Prénom",
    ar: "الاسم الأول",
    word: "firstname",
  },
  {
    en: "Enter Your First Name",
    fr: "Entrez votre prénom",
    ar: "أدخل اسمك الأول",
    word: "enter%20your%20firstname",
  },
  {
    en: "Last Name",
    fr: "Nom de famille",
    ar: "الاسم الأخير",
    word: "lastname",
  },
  {
    en: "Enter Your Last Name",
    fr: "Entrez votre nom de famille",
    ar: "أدخل اسمك الأخير",
    word: "enter%20your%20lastname",
  },
  {
    en: "Phone",
    fr: "Téléphone",
    ar: "الهاتف",
    word: "phone",
  },
  {
    en: "Enter Your Phone Number",
    fr: "Entrez votre numéro de téléphone",
    ar: "أدخل رقم هاتفك",
    word: "enter%20your%20phone%20number",
  },
  {
    en: "Enter Your Key",
    fr: "Entrez votre clé",
    ar: "أدخل مفتاحك",
    word: "enter%20your%20key",
  },
  {
    en: "Address",
    fr: "Adresse",
    ar: "العنوان",
    word: "address",
  },
  {
    en: "Enter Your Address",
    fr: "Entrez votre adresse",
    ar: "أدخل عنوانك",
    word: "enter%20your%20address",
  },
  {
    en: "Wilaya",
    fr: "Wilaya",
    ar: "الولاية",
    word: "wilaya",
  },
  {
    en: "Enter Your Wilaya",
    fr: "Entrez votre Wilaya",
    ar: "أدخل ولايتك",
    word: "enter%20your%20wilaya",
  },
  {
    en: "Auto",
    fr: "Auto",
    ar: "تلقائي",
    word: "auto",
  },
  {
    en: "Create Order",
    fr: "Créer une commande",
    ar: "إنشاء طلب",
    word: "create%20order",
  },
  {
    en: "Empty Cart",
    fr: "Vider le panier",
    ar: "إفراغ السلة",
    word: "empty%20cart",
  },
  {
    en: "Send Feedback",
    fr: "Envoyer des commentaires",
    ar: "إرسال ملاحظات",
    word: "send%20feedback",
  },
  {
    en: "Choose Language",
    fr: "Choisir la langue",
    ar: "اختيار اللغة",
    word: "choos%20language",
  },
  {
    en: "Search Product",
    fr: "Rechercher un produit",
    ar: "بحث عن منتج",
    word: "search%20product",
  },
  {
    en: "Messenger",
    fr: "Messenger",
    ar: "ماسنجر",
    word: "messenger",
  },
  {
    en: "Twitter",
    fr: "Twitter",
    ar: "تويتر",
    word: "twitter",
  },
  {
    en: "Instagram",
    fr: "Instagram",
    ar: "انستغرام",
    word: "instagram",
  },
  {
    en: "Discord",
    fr: "Discord",
    ar: "ديسكورد",
    word: "discord",
  },
  {
    en: "Snapchat",
    fr: "Snapchat",
    ar: "سناب شات",
    word: "snapchat",
  },
  {
    en: "Search Order",
    fr: "Rechercher une commande",
    ar: "بحث عن طلب",
    word: "search%20order",
  },
  {
    en: "View Client",
    fr: "Voir le client",
    ar: "عرض العميل",
    word: "view%20client",
  },
  {
    en: "View Order",
    fr: "Voir la commande",
    ar: "عرض الطلب",
    word: "view%20order",
  },
  {
    en: "Change Status",
    fr: "Changer le statut",
    ar: "تغيير الحالة",
    word: "change%20status",
  },
  {
    en: "Print",
    fr: "Imprimer",
    ar: "طباعة",
    word: "print",
  },
  {
    en: "Copy ID",
    fr: "Copier l'ID",
    ar: "نسخ المعرف",
    word: "copy%20id",
  },
  {
    en: "Change to Null",
    fr: "Changer en nul",
    ar: "التغيير إلى لا شيء",
    word: "change%20to%20null",
  },
  {
    en: "Invoice",
    fr: "Facture",
    ar: "فاتورة",
    word: "invoice",
  },
  {
    en: "Open in Maps",
    fr: "Ouvrir dans les cartes",
    ar: "فتح في الخرائط",
    word: "open%20in%20maps",
  },
  {
    en: "Modify",
    fr: "Modifier",
    ar: "تعديل",
    word: "modify",
  },
  {
    en: "Remove",
    fr: "Supprimer",
    ar: "إزالة",
    word: "remove",
  },
  {
    en: "See Cart",
    fr: "Voir le panier",
    ar: "مشاهدة السلة",
    word: "see%20cart",
  },
  {
    en: "Apps",
    fr: "Applications",
    ar: "تطبيقات",
    word: "apps",
  },
  {
    en: "Service For",
    fr: "Service pour",
    ar: "خدمة لـ",
    word: "service%20for",
  },
  {
    en: "Android",
    fr: "Android",
    ar: "أندرويد",
    word: "android",
  },
  {
    en: "AI Actions",
    fr: "Actions IA",
    ar: "إجراءات الذكاء الاصطناعي",
    word: "ai%20actions",
  },
  {
    en: "Edit",
    fr: "Modifier",
    ar: "تعديل",
    word: "edit",
  },
  {
    en: "Copy Link",
    fr: "Copier le lien",
    ar: "نسخ الرابط",
    word: "copy%20link",
  },
  {
    en: "Delete",
    fr: "Supprimer",
    ar: "حذف",
    word: "delete",
  },
  {
    en: "Dark?",
    fr: "Sombre ?",
    ar: "داكن؟",
    word: "dark%3F",
  },
  {
    en: "Choose",
    fr: "Choisir",
    ar: "اختر",
    word: "choose",
  },
  {
    en: "Create Link",
    fr: "Créer un lien",
    ar: "إنشاء رابط",
    word: "create%20link",
  },
  {
    en: "Language",
    fr: "Langue",
    ar: "اللغة",
    word: "language",
  },
  {
    en: "Copy & Close",
    fr: "Copier et fermer",
    ar: "نسخ وإغلاق",
    word: "copy%20%26%20close",
  },
  {
    en: "Update Store",
    fr: "Mettre à jour le magasin",
    ar: "تحديث المتجر",
    word: "update%20store",
  },
  {
    en: "Edit Store",
    fr: "Modifier le magasin",
    ar: "تعديل المتجر",
    word: "edit%20store",
  },
  {
    en: "Enter Delivery Price",
    fr: "Entrez le prix de livraison",
    ar: "أدخل سعر التوصيل",
    word: "enter%20delivery%20price",
  },
  {
    en: "Free",
    fr: "Gratuit",
    ar: "مجاني",
    word: "free",
  },
  {
    en: "Give Job!",
    fr: "Donner un travail !",
    ar: "أعط وظيفة!",
    word: "give%20job!",
  },
  {
    en: "Location",
    fr: "Emplacement",
    ar: "الموقع",
    word: "location",
  },
  {
    en: "AI Assistance",
    fr: "Assistance IA",
    ar: "مساعدة الذكاء الاصطناعي",
    word: "ai%20assistance",
  },
  {
    en: "Name",
    fr: "Nom",
    ar: "الاسم",
    word: "name",
  },
  {
    en: "Link",
    fr: "Lien",
    ar: "الرابط",
    word: "link",
  },
  {
    en: "Edit Product",
    fr: "Modifier le produit",
    ar: "تعديل المنتج",
    word: "edit%20product",
  },
  {
    en: "Description",
    fr: "Description",
    ar: "الوصف",
    word: "description",
  },
  {
    en: "Actions",
    fr: "Actions",
    ar: "الإجراءات",
    word: "actions",
  },
  {
    en: "Delete Product",
    fr: "Supprimer le produit",
    ar: "حذف المنتج",
    word: "delete%20product",
  },
  {
    en: "Limited",
    fr: "Limité",
    ar: "محدود",
    word: "limited",
  },
  {
    en: "Enter Name",
    fr: "Entrez le nom",
    ar: "أدخل الاسم",
    word: "enter%20name",
  },
  {
    en: "Category",
    fr: "Catégorie",
    ar: "الفئة",
    word: "category",
  },
  {
    en: "Available",
    fr: "Disponible",
    ar: "متاح",
    word: "avilable",
  },
  {
    en: "Multiple",
    fr: "Plusieurs",
    ar: "متعدد",
    word: "multiple",
  },
  {
    en: "Single",
    fr: "Unique",
    ar: "واحد",
    word: "single",
  },
  {
    en: "Accept",
    fr: "Accepter",
    ar: "قبول",
    word: "accepte",
  },
  {
    en: "Price",
    fr: "Prix",
    ar: "السعر",
    word: "price",
  },
  {
    en: "Continue",
    fr: "Continuer",
    ar: "متابعة",
    word: "continue",
  },
  {
    en: "Enter Quantity",
    fr: "Entrez la quantité",
    ar: "أدخل الكمية",
    word: "enter%20quantity",
  },
  {
    en: "Enter Description",
    fr: "Entrez la description",
    ar: "أدخل الوصف",
    word: "enter%20description",
  },
  {
    en: "Sizes",
    fr: "Tailles",
    ar: "الأحجام",
    word: "sizes",
  },
  {
    en: "Colors",
    fr: "Couleurs",
    ar: "الألوان",
    word: "colors",
  },
  {
    en: "MD",
    fr: "Moyen",
    ar: "متوسط",
    word: "md",
  },
  {
    en: "XL",
    fr: "XL",
    ar: "XL",
    word: "xl",
  },
  {
    en: "LG",
    fr: "Grand",
    ar: "كبير",
    word: "lg",
  },
  {
    en: "SM",
    fr: "Petit",
    ar: "صغير",
    word: "sm",
  },
  {
    en: "2XL",
    fr: "2XL",
    ar: "2XL",
    word: "2xl",
  },
  {
    en: "Keys",
    fr: "Clés",
    ar: "مفاتيح",
    word: "keys",
  },
  {
    en: "3XL",
    fr: "3XL",
    ar: "3XL",
    word: "3xl",
  },
  {
    en: "Write Item...",
    fr: "Écrire un élément...",
    ar: "اكتب العنصر...",
    word: "write%20item...",
  },
  {
    en: "Additional Post Configuration",
    fr: "Configuration de publication supplémentaire",
    ar: "تكوين إضافي للمنشور",
    word: "additionally%20post%20configuration",
  },
  {
    en: "No",
    fr: "Non",
    ar: "لا",
    word: "no",
  },
  {
    en: "Type",
    fr: "Type",
    ar: "النوع",
    word: "type",
  },
  {
    en: "Title",
    fr: "Titre",
    ar: "العنوان",
    word: "title",
  },
  {
    en: "No Sizes",
    fr: "Pas de tailles",
    ar: "لا توجد أحجام",
    word: "no%20sizes",
  },
  {
    en: "Post Details",
    fr: "Détails de la publication",
    ar: "تفاصيل المنشور",
    word: "post%20details",
  },
  {
    en: "No Category",
    fr: "Pas de catégorie",
    ar: "لا توجد فئة",
    word: "no%20category",
  },
  {
    en: "Extra Information",
    fr: "Informations supplémentaires",
    ar: "معلومات إضافية",
    word: "extra%20information",
  },
  {
    en: "Chosen Theme",
    fr: "Thème choisi",
    ar: "السمة المختارة",
    word: "choised%20theme",
  },
  {
    en: "Price:",
    fr: "Prix :",
    ar: "السعر:",
    word: "price%3A",
  },
  {
    en: "No Chosen Theme",
    fr: "Aucun thème choisi",
    ar: "لم يتم اختيار سمة",
    word: "no%20choised%20theme",
  },
  {
    en: "Quantity",
    fr: "Quantité",
    ar: "الكمية",
    word: "quantity",
  },
  {
    en: "Enter Price",
    fr: "Entrez le prix",
    ar: "أدخل السعر",
    word: "enter%20price",
  },
  {
    en: "Add Product",
    fr: "Ajouter un produit",
    ar: "إضافة منتج",
    word: "add%20product",
  },
  {
    en: "Back",
    fr: "Retour",
    ar: "رجوع",
    word: "back",
  },
  {
    en: "Cancelled",
    fr: "Annulé",
    ar: "ملغى",
    word: "cancelled",
  },
  {
    en: "Processing",
    fr: "En cours de traitement",
    ar: "قيد المعالجة",
    word: "processing",
  },
  {
    en: "Yes",
    fr: "Oui",
    ar: "نعم",
    word: "yes",
  },
  {
    en: "See All Carts",
    fr: "Voir tous les paniers",
    ar: "مشاهدة جميع السلات",
    word: "see%20all%20carts",
  },
  {
    en: "Carts",
    fr: "Paniers",
    ar: "سلات",
    word: "carts",
  },
  {
    en: "See Photo",
    fr: "Voir la photo",
    ar: "مشاهدة الصورة",
    word: "see%20photo",
  },
  {
    en: "Add to Favorite",
    fr: "Ajouter aux favoris",
    ar: "إضافة إلى المفضلة",
    word: "add%20to%20favorite",
  },
  {
    en: "TikTok",
    fr: "TikTok",
    ar: "تيك توك",
    word: "tiktok",
  },
];
export const useSub = () => {
  return getTemp<
    {
      isSubscribed: boolean;
    } & Biqpod.Account.Payout
  >("subed");
};
export const initStoreIdSave = () => {
  const loc = useLocation();
  return useMemo(() => {
    if (loc.pathname.startsWith("/store/")) {
      const storeId = loc.pathname.split("/").at(2);
      setTemp("storeId", storeId);
    } else {
      setTemp("storeId", null);
    }
  }, [loc.pathname]);
};
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

export let initialHeight = window.innerHeight;

export const isAndroidWeb = navigator.userAgent.match(
  /Android.*(wv|Chrome)\/(\d+)\.(\d+)(?:\.(\d+))?/gi
);
export const useClientStoreId = () => {
  return getTemp<string>("client-store-id");
};
export const types: {
  id: keyof SettingValueType;
  name: string;
  description: string;
}[] = [
  { id: "array", name: "📚 Array", description: "A list of values" },
  { id: "audio", name: "🎵 Audio", description: "Audio file input" },
  { id: "boolean", name: "✅ Boolean", description: "True or false value" },
  { id: "color", name: "🎨 Color", description: "Color picker" },
  { id: "date", name: "📅 Date", description: "Date picker" },
  { id: "enum", name: "🔢 Enum", description: "Enumeration of values" },
  { id: "file", name: "📁 File", description: "File upload" },
  { id: "filter", name: "🔍 Filter", description: "Filter criteria" },
  { id: "image", name: "🖼️ Image", description: "Image file input" },
  { id: "number", name: "🔢 Number", description: "Numeric value" },
  { id: "object", name: "🧩 Object", description: "Object with properties" },
  { id: "password", name: "🔒 Password", description: "Password input" },
  { id: "pin", name: "🔢 PIN", description: "PIN code input" },
  { id: "range", name: "🎚️ Range", description: "Range slider" },
  { id: "regexp", name: "📝 RegExp", description: "Regular expression" },
  { id: "string", name: "🔤 String", description: "Text value" },
];

export function useFetchMoreAction<T>(
  actionName: string,
  PAGE_SIZE: number,
  callback: (props: {
    next: boolean;
    lastDoc: T | null;
    hasMore: boolean;
  }) => Promise<T[] | Nothing>,
  deps: any[] = []
) {
  const data = useCopyState<T[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<T | null>(null);
  const hasMore = useCopyState(true);
  const action = useAction(
    actionName,
    async (next = false) => {
      const list = await callback({
        next,
        lastDoc: lastDoc.get,
        hasMore: hasMore.get,
      });
      if (!list) {
        return;
      }
      data.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = list.at(-1);
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(list.length === PAGE_SIZE);
    },
    [...deps, lastDoc.get, hasMore.get]
  );
  return {
    data,
    lastDoc,
    hasMore,
    action,
    fetchMore() {
      execAction(actionName, true);
    },
    fetchInit() {
      execAction(actionName, false);
    },
  };
}

export interface ConfigForm<T extends keyof Biqpod.System.Setting.Config> {
  value: Biqpod.System.Setting.Config[T];
  onChange: (value: Biqpod.System.Setting.Config[T]) => void;
}

export const colorIds: ColorIds[] = [
  "primary",
  "secondary",
  "primary.background",
  "primary.content",
  "secondary.background",
  "borders",
  "text.color",
  "shadow.color",
];
