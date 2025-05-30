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
import { allIcons } from "@biqpod/app/ui/apis";
import { IconProps } from "@biqpod/app/ui/components";
import { getTemp, setTemp } from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { useMemo } from "react";
import { useLocation } from "react-router";
export function fuzzyRankedSearch<T>(
  query: string,
  items: T[],
  labelKey: keyof T
): T[] {
  const normalize = (str: string): string => str.toLowerCase();
  const normalizedQuery = normalize(query);
  const ranked: { item: T; score: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = item[labelKey];
    if (typeof label !== "string") continue;
    const normalizedText = normalize(label);
    let score = 0;
    let lastMatchIndex = -1;
    let matched = true;
    for (let j = 0; j < normalizedQuery.length; j++) {
      const char = normalizedQuery[j];
      const index = normalizedText.indexOf(char, lastMatchIndex + 1);
      if (index === -1) {
        matched = false;
        break;
      }
      score += 10 - index;
      if (index === lastMatchIndex + 1) score += 5;
      lastMatchIndex = index;
    }
    if (!matched) continue;
    if (normalizedText.startsWith(normalizedQuery)) {
      score += 100;
    }
    // Insert in descending order
    let insertIndex = ranked.length;
    while (insertIndex > 0 && score > ranked[insertIndex - 1].score) {
      insertIndex--;
    }
    ranked.splice(insertIndex, 0, { item, score });
  }
  return ranked.map(({ item }) => item);
}
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
export const rolsInList: {
  content: string;
  value: SnapBuy.DeliveryCompanyRole;
}[] = [
  { content: "🏭 Warehouse Operator", value: "warehouse_operator" },
  { content: "🚚 Delivery Agent", value: "delivery_agent" },
];
export const translations = [
  {
    word: "Dark%20/%20Light",
    en: "Dark / Light",
    fr: "Sombre / Clair",
    ar: "داكن / فاتح",
  },
  {
    word: "this%20page%20will%20be%20available%20soon",
    en: "this page will be available soon",
    fr: "cette page sera bientôt disponible",
    ar: "هذه الصفحة ستكون متاحة قريبا",
  },
  {
    word: "10%20products",
    en: "10 Products",
    fr: "10 Produits",
    ar: "10 منتجات",
  },
  {
    word: "50%20products",
    en: "50 Products",
    fr: "50 Produits",
    ar: "50 منتجًا",
  },
  {
    word: "400%20orders%20%2F%20week",
    en: "400 Orders / Week",
    fr: "400 commandes / semaine",
    ar: "400 طلب / أسبوع",
  },
  {
    word: "1000%20orders%20%2F%20week",
    en: "1000 Orders / Week",
    fr: "1000 commandes / semaine",
    ar: "1000 طلب / أسبوع",
  },
  { word: "-", en: "-", fr: "-", ar: "-" },
  { word: "account", en: "account", fr: "compte", ar: "حساب" },
  { word: "add", en: "add", fr: "ajouter", ar: "إضافة" },
  {
    word: "add%20store",
    en: "add store",
    fr: "ajouter un magasin",
    ar: "إضافة متجر",
  },
  { word: "ads", en: "ads", fr: "annonces", ar: "إعلانات" },
  { word: "available", en: "available", fr: "disponible", ar: "متاح" },
  { word: "basic", en: "basic", fr: "basique", ar: "أساسي" },
  { word: "cancel", en: "cancel", fr: "annuler", ar: "إلغاء" },
  {
    word: "change%20language",
    en: "change language",
    fr: "changer de langue",
    ar: "تغيير اللغة",
  },
  { word: "client", en: "client", fr: "client", ar: "عميل" },
  { word: "company", en: "company", fr: "entreprise", ar: "شركة" },
  { word: "completed", en: "completed", fr: "terminé", ar: "مكتمل" },
  { word: "created%20at", en: "created at", fr: "créé à", ar: "تاريخ الإنشاء" },
  {
    word: "current%20plan",
    en: "current plan",
    fr: "plan actuel",
    ar: "الخطة الحالية",
  },
  {
    word: "dark%20mode",
    en: "dark mode",
    fr: "mode sombre",
    ar: "الوضع الداكن",
  },
  { word: "deliveries", en: "deliveries", fr: "livraisons", ar: "التسليمات" },
  { word: "done", en: "done", fr: "terminé", ar: "تم" },
  { word: "feedbacks", en: "feedbacks", fr: "commentaires", ar: "ملاحظات" },
  {
    word: "fetch%20more",
    en: "fetch more",
    fr: "charger plus",
    ar: "جلب المزيد",
  },
  { word: "follow", en: "follow", fr: "suivre", ar: "متابعة" },
  { word: "home", en: "Home", fr: "accueil", ar: "الرئيسية" },
  {
    word: "join%20feed",
    en: "join feed",
    fr: "rejoindre le fil",
    ar: "الانضمام إلى الموجز",
  },
  { word: "key", en: "key", fr: "clé", ar: "مفتاح" },
  { word: "logout", en: "Logout", fr: "déconnexion", ar: "تسجيل الخروج" },
  {
    word: "manage%20account",
    en: "manage account",
    fr: "gérer le compte",
    ar: "إدارة الحساب",
  },
  { word: "more", en: "more", fr: "plus", ar: "المزيد" },
  {
    word: "no%20key%20ther%20is",
    en: "no key ther is",
    fr: "pas de clé",
    ar: "لا يوجد مفتاح",
  },
  {
    word: "no%20products%20found",
    en: "no products found",
    fr: "aucun produit trouvé",
    ar: "لم يتم العثور على منتجات",
  },
  {
    word: "no%20stores%20found",
    en: "no stores found",
    fr: "aucun magasin trouvé",
    ar: "لم يتم العثور على متاجر",
  },
  {
    word: "notifications",
    en: "notifications",
    fr: "notifications",
    ar: "الإشعارات",
  },
  { word: "offers", en: "offers", fr: "offres", ar: "العروض" },
  { word: "orders", en: "orders", fr: "commandes", ar: "الطلبات" },
  {
    word: "orders%20placed%20today",
    en: "orders placed today",
    fr: "commandes passées aujourd'hui",
    ar: "الطلبات المقدمة اليوم",
  },
  { word: "overview", en: "overview", fr: "aperçu", ar: "نظرة عامة" },
  { word: "pending", en: "pending", fr: "en attente", ar: "قيد الانتظار" },
  { word: "plans", en: "Plans", fr: "plans", ar: "الخطط" },
  { word: "pro", en: "pro", fr: "pro", ar: "احترافي" },
  { word: "products", en: "products", fr: "produits", ar: "المنتجات" },
  { word: "profile", en: "profile", fr: "profil", ar: "الملف الشخصي" },
  { word: "promoted", en: "promoted", fr: "promu", ar: "مروج" },
  { word: "promotion", en: "promotion", fr: "promotion", ar: "ترويج" },
  {
    word: "sales%20this%20week",
    en: "sales this week",
    fr: "ventes cette semaine",
    ar: "مبيعات هذا الأسبوع",
  },
  { word: "services", en: "services", fr: "services", ar: "الخدمات" },
  { word: "settings", en: "settings", fr: "paramètres", ar: "الإعدادات" },
  { word: "status", en: "status", fr: "statut", ar: "الحالة" },
  { word: "store", en: "store", fr: "magasin", ar: "متجر" },
  { word: "store%20of", en: "store of", fr: "magasin de", ar: "متجر لـ" },
  { word: "stores", en: "stores", fr: "magasins", ar: "المتاجر" },
  {
    word: "today's%20orders",
    en: "today's orders",
    fr: "commandes d'aujourd'hui",
    ar: "طلبات اليوم",
  },
  {
    word: "total%20sales",
    en: "Total Sales",
    fr: "ventes totales",
    ar: "إجمالي المبيعات",
  },
  {
    word: "unfollow",
    en: "unfollow",
    fr: "ne plus suivre",
    ar: "إلغاء المتابعة",
  },
  {
    word: "unlimited%20orders%20%2F%20week",
    en: "Unlimited Orders / Week",
    fr: "Commandes illimitées / semaine",
    ar: "طلبات غير محدودة / أسبوع",
  },
  {
    word: "unlimited%20products",
    en: "Unlimited Products",
    fr: "Produits illimités",
    ar: "منتجات غير محدودة",
  },
  {
    word: "edit%20profile",
    en: "edit profile",
    fr: "modifier le profil",
    ar: "تعديل الملف الشخصي",
  },
  {
    word: "save%20changes",
    en: "save changes",
    fr: "enregistrer les modifications",
    ar: "حفظ التغييرات",
  },
  {
    word: "delete%20item",
    en: "delete item",
    fr: "supprimer l'élément",
    ar: "حذف العنصر",
  },
  {
    word: "add%20item",
    en: "add item",
    fr: "ajouter un élément",
    ar: "إضافة عنصر",
  },
  { word: "search", en: "search", fr: "rechercher", ar: "بحث" },
  { word: "filter", en: "filter", fr: "filtrer", ar: "تصفية" },
  { word: "sort%20by", en: "sort by", fr: "trier par", ar: "الترتيب حسب" },
  {
    word: "upload%20image",
    en: "upload image",
    fr: "télécharger l'image",
    ar: "تحميل صورة",
  },
  {
    word: "view%20details",
    en: "view details",
    fr: "voir les détails",
    ar: "عرض التفاصيل",
  },
  { word: "share", en: "share", fr: "partager", ar: "مشاركة" },
  { word: "login", en: "login", fr: "connexion", ar: "تسجيل الدخول" },
  { word: "email", en: "email", fr: "e-mail", ar: "بريد إلكتروني" },
  { word: "password", en: "password", fr: "mot de passe", ar: "كلمة المرور" },
  { word: "sign%20up", en: "sign up", fr: "s'inscrire", ar: "اشتراك" },
  {
    word: "biq%20pod%20for%20payment%20proccess%20and%20charge%20by%20what%20evry%20you%20want",
    en: "biq pod for payment proccess and charge by what evry you want",
    fr: "Biq Pod pour le traitement des paiements et la facturation selon vos souhaits",
    ar: "Biq Pod لمعالجة الدفع والتحصيل بأي طريقة تريدها",
  },
  {
    word: "power%20save%20pays",
    en: "power save pays",
    fr: "Power Save Pays",
    ar: "توفير الطاقة يدفع",
  },
  {
    word: "login%20into%20biq%20pod",
    en: "login into Biq Pod",
    fr: "se connecter à Biq Pod",
    ar: "تسجيل الدخول إلى Biq Pod",
  },
  { word: "history", en: "history", fr: "historique", ar: "السجل" },
  {
    word: "don't%20have%20an%20account%3F",
    en: "don't have an account?",
    fr: "vous n'avez pas de compte ?",
    ar: "ليس لديك حساب؟",
  },
  { word: "payouts", en: "payouts", fr: "versements", ar: "الدفعات" },
  {
    word: "see%20all%20historys",
    en: "see all historys",
    fr: "voir tous les historiques",
    ar: "عرض جميع السجلات",
  },
  {
    word: "confirm%20password",
    en: "confirm password",
    fr: "confirmer le mot de passe",
    ar: "تأكيد كلمة المرور",
  },
  {
    word: "sigin%20into%20biq%20pod",
    en: "sigin into Biq Pod",
    fr: "se connecter à Biq Pod",
    ar: "تسجيل الدخول إلى Biq Pod",
  },
  { word: "signup", en: "signup", fr: "inscription", ar: "التسجيل" },
  {
    word: "already%20have%20one%3F",
    en: "already have one?",
    fr: "déjà un compte ?",
    ar: "هل لديك حساب بالفعل؟",
  },
  {
    word: "description%20%3A%20",
    en: "description : ",
    fr: "description : ",
    ar: "الوصف : ",
  },
  {
    word: "add%20to%20cart",
    en: "add to cart",
    fr: "ajouter au panier",
    ar: "أضف إلى السلة",
  },
  { word: "", en: "", fr: "", ar: "" },
  { word: "see", en: "see", fr: "voir", ar: "رؤية" },
  {
    word: "send%20order",
    en: "send order",
    fr: "envoyer la commande",
    ar: "إرسال الطلب",
  },
  { word: "cart", en: "cart", fr: "panier", ar: "السلة" },
  { word: "complete", en: "complete", fr: "terminer", ar: "إكمال" },
  { word: "firstname", en: "firstname", fr: "prénom", ar: "الاسم الأول" },
  {
    word: "enter%20your%20firstname",
    en: "Enter Your Firstname",
    fr: "Entrez votre prénom",
    ar: "أدخل اسمك الأول",
  },
  { word: "lastname", en: "lastname", fr: "nom de famille", ar: "اسم العائلة" },
  {
    word: "enter%20your%20lastname",
    en: "Enter Your Lastname",
    fr: "Entrez votre nom de famille",
    ar: "أدخل اسمك الأخير",
  },
  { word: "phone", en: "phone", fr: "téléphone", ar: "الهاتف" },
  {
    word: "enter%20your%20phone%20number",
    en: "Enter Your Phone Number",
    fr: "Entrez votre numéro de téléphone",
    ar: "أدخل رقم هاتفك",
  },
  {
    word: "enter%20your%20key",
    en: "Enter Your Key",
    fr: "Entrez votre clé",
    ar: "أدخل مفتاحك",
  },
  { word: "address", en: "address", fr: "adresse", ar: "العنوان" },
  {
    word: "enter%20your%20address",
    en: "Enter Your Address",
    fr: "Entrez votre adresse",
    ar: "أدخل عنوانك",
  },
  { word: "wilaya", en: "wilaya", fr: "wilaya", ar: "الولاية" },
  {
    word: "enter%20your%20wilaya",
    en: "Enter Your Wilaya",
    fr: "Entrez votre wilaya",
    ar: "أدخل ولايتك",
  },
  { word: "auto", en: "auto", fr: "auto", ar: "تلقائي" },
  {
    word: "create%20order",
    en: "create order",
    fr: "créer une commande",
    ar: "إنشاء طلب",
  },
  {
    word: "empty%20cart",
    en: "empty cart",
    fr: "panier vide",
    ar: "سلة فارغة",
  },
  {
    word: "send%20feedback",
    en: "Send Feedback",
    fr: "Envoyer un commentaire",
    ar: "إرسال ملاحظات",
  },
  {
    word: "choos%20language",
    en: "Choos Language",
    fr: "Choisir la langue",
    ar: "اختر اللغة",
  },
  {
    word: "search%20product",
    en: "Search Product",
    fr: "Rechercher un produit",
    ar: "البحث عن منتج",
  },
  { word: "messenger", en: "Messenger", fr: "Messenger", ar: "ماسنجر" },
  { word: "twitter", en: "Twitter", fr: "Twitter", ar: "تويتر" },
  { word: "instagram", en: "Instagram", fr: "Instagram", ar: "انستغرام" },
  { word: "discord", en: "Discord", fr: "Discord", ar: "ديسكورد" },
  { word: "snapchat", en: "Snapchat", fr: "Snapchat", ar: "سناب شات" },
  {
    word: "search%20order",
    en: "Search Order",
    fr: "Rechercher une commande",
    ar: "البحث عن طلب",
  },
  {
    word: "view%20client",
    en: "View Client",
    fr: "Voir le client",
    ar: "عرض العميل",
  },
  {
    word: "view%20order",
    en: "View Order",
    fr: "Voir la commande",
    ar: "عرض الطلب",
  },
  {
    word: "change%20status",
    en: "Change Status",
    fr: "Changer le statut",
    ar: "تغيير الحالة",
  },
  { word: "print", en: "Print", fr: "Imprimer", ar: "طباعة" },
  { word: "copy%20id", en: "Copy ID", fr: "Copier l'ID", ar: "نسخ المعرف" },
  {
    word: "change%20to%20null",
    en: "change to null",
    fr: "passer à nul",
    ar: "تغيير إلى لا شيء",
  },
  { word: "invoice", en: "invoice", fr: "facture", ar: "فاتورة" },
  {
    word: "open%20in%20maps",
    en: "open in maps",
    fr: "ouvrir dans les cartes",
    ar: "فتح في الخرائط",
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
