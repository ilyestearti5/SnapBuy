import { useParams } from "react-router";
import {
  getTab,
  setTab,
  setTemp,
  useAsyncMemo,
  useCopyState,
  useAction,
  execAction,
  isLoading,
  showToast,
  useUser,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi, CreateOrderOptions } from "../apis";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  Icon,
  IconProps,
  TabContent,
  Translate,
} from "@biqpod/app/ui/components";
import { fuzzySearch, tw, setFocused } from "@biqpod/app/ui/utils";
import { useCartTotalCount } from "../routes/Clients/CartHooks";
import { Geolocation } from "@capacitor/geolocation";
import { isWeb } from "@biqpod/app/ui/app";
import { getAddressFromCoords } from "../getAddressFromCoords";
import { Nothing } from "@biqpod/app/ui/types";
import { NotificationTester } from "../components/NotificationTester";
import { FloatingNotificationTester } from "../components/FloatingNotificationTester";
import { quickNotificationTest } from "../utils/quickNotificationTest";
import "../utils/desktopNotificationFixes"; // Auto-applies fixes when imported
import {
  useFullCart,
  addToCart,
  deleteCart,
  removeCart,
  initCart,
} from "../apis/snapbuy";
// Custom Button Component
const Button = ({ children, className, style, onClick, ...props }: any) => (
  <button
    className={`px-4 py-2 font-medium transition-all duration-200 ${
      className || ""
    }`}
    style={style}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);
// Custom Line Component
const Line = () => <hr className="bg-gray-300 h-[1px]" />;
// Icon symbols using allIcons
const icons = {
  fire: allIcons.solid.faFire,
  user: allIcons.solid.faUser,
  image: allIcons.solid.faImage,
  star: allIcons.solid.faStar,
  shoppingBag: allIcons.solid.faShoppingBag,
  heart: allIcons.solid.faHeart,
  gift: allIcons.solid.faGift,
  crown: allIcons.solid.faCrown,
  gem: allIcons.solid.faGem,
  globe: allIcons.solid.faGlobe,
  camera: allIcons.solid.faCamera,
  share: allIcons.solid.faShare,
  tag: allIcons.solid.faTag,
  search: allIcons.solid.faSearch,
  shoppingCart: allIcons.solid.faShoppingCart,
};
// Optimized utility functions for repeated logic
const getProductPrice = (product: SnapBuy.Product): number => {
  return product.type === "single"
    ? product.single?.client || 0
    : Math.min(...(product.multiple?.prices?.map((p) => p.price) || [0]));
};
const getProductPriceDisplay = (product: SnapBuy.Product): string => {
  const price = getProductPrice(product);
  return product.type === "single" ? `${price} DA` : `From ${price} DA`;
};
const getDiscountedPrice = (
  originalPrice: number,
  discountRate: number = 1.3
): string => {
  return (originalPrice * discountRate).toFixed(2);
};
// Memoized scroll functions to prevent recreating on every render
const createScrollFunction = (
  ref: React.RefObject<HTMLDivElement>,
  scrollAmount: number,
  checkFunction: () => void
) => {
  return () => {
    if (ref.current) {
      ref.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkFunction, 300);
    }
  };
};
// Constants for repeated style values
const BRAND_COLOR = "#89CFF0";
const INTER_FONT = "Inter, sans-serif";
const PLAYFAIR_FONT = "Playfair Display, serif";
const MONTSERRAT_FONT = "Montserrat, sans-serif";
const ROBOTO_FONT = "Roboto, sans-serif";
// Common style objects
const COMMON_STYLES = {
  brandButton: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
    fontFamily: INTER_FONT,
  },
  brandText: {
    color: BRAND_COLOR,
    fontFamily: INTER_FONT,
  },
  interFont: {
    fontFamily: INTER_FONT,
  },
  playfairFont: {
    fontFamily: PLAYFAIR_FONT,
  },
  brandGradient: {
    background: `linear-gradient(to right, ${BRAND_COLOR}, #5DADE2)`,
  },
  brandBackgroundOnly: {
    backgroundColor: BRAND_COLOR,
  },
};
interface CollectionProductsProps {
  collection: SnapBuy.Collection;
  storeId: string;
}
const CollectionProducts = ({
  collection,
  storeId,
}: CollectionProductsProps) => {
  const collectionProducts = useAsyncMemo(async () => {
    if (!collection.id) return null;
    return snapbuyApi.getProductsOfCollection(collection.id);
  }, [collection.id]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const checkScrollability = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);
  // Memoized scroll functions
  const scrollLeft = useMemo(
    () => createScrollFunction(scrollContainerRef, -320, checkScrollability),
    [checkScrollability]
  );
  const scrollRight = useMemo(
    () => createScrollFunction(scrollContainerRef, 320, checkScrollability),
    [checkScrollability]
  );
  useEffect(() => {
    checkScrollability();
  }, [collectionProducts, checkScrollability]);
  if (!collectionProducts || collectionProducts.length === 0) {
    return null;
  }
  return (
    <div key={collection.id} className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-full w-12 h-12 overflow-hidden">
            <img
              src={collection.photo}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2
            className="font-bold text-gray-900 text-3xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {collection.name}
          </h2>
        </div>
        <Button
          className="px-6 py-2 border-2 hover:border-blue-400 rounded-full font-medium text-white transition-all duration-200"
          style={COMMON_STYLES.brandButton}
        >
          <Translate content="View All" />
        </Button>
      </div>
      <div className="relative">
        {/* Left Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="top-1/2 left-2 z-10 absolute flex justify-center items-center bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 transition-all -translate-y-1/2 duration-200 transform"
            style={{ backdropFilter: "blur(4px)" }}
          >
            <Icon
              icon={allIcons.solid.faChevronLeft}
              iconClassName="text-gray-600"
            />
          </button>
        )}
        {/* Right Navigation Button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="top-1/2 right-2 z-10 absolute flex justify-center items-center bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 transition-all -translate-y-1/2 duration-200 transform"
            style={{ backdropFilter: "blur(4px)" }}
          >
            <Icon
              icon={allIcons.solid.faChevronRight}
              iconClassName="text-gray-600"
            />
          </button>
        )}
        <div
          ref={scrollContainerRef}
          className="relative flex items-center gap-4 pb-4 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
          onScroll={checkScrollability}
        >
          {collectionProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0">
              <ProductCard product={product} storeId={storeId} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// Product Card Component with Auto-Sliding Photos
const ProductCard = ({
  product,
  storeId,
}: {
  product: SnapBuy.Product;
  storeId: string;
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  // Memoized values for performance
  const photos = useMemo(() => product.photos || [], [product.photos]);
  const hasMultiplePhotos = useMemo(() => photos.length > 1, [photos.length]);
  const priceDisplay = useMemo(
    () => getProductPriceDisplay(product),
    [product]
  );
  // Get current cart count for this product
  const currentCartCount =
    useFullCart(storeId).find((item) => item.prodId === product.id)?.count || 0;
  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (product.id && storeId) {
      addToCart(storeId, product.id, currentCartCount + 1);
    }
  };
  // Auto-slide photos every 3 seconds
  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) =>
        prevIndex === photos.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length, hasMultiplePhotos]);
  return (
    <div className="bg-gray-100 border border-gray-300 border-solid w-[300px] overflow-hidden transition-all duration-300 cursor-pointer">
      <div className="relative">
        {photos.length > 0 ? (
          <div className="relative w-full h-48 overflow-hidden">
            {/* Photo Container */}
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{
                width: `${photos.length * 100}%`,
                transform: `translateX(-${
                  currentPhotoIndex * (100 / photos.length)
                }%)`,
              }}
            >
              {photos.map((photo, index) => {
                // Distance from current photo (for clarity)
                // const left = currentPhotoIndex - index;
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full h-48"
                    style={{
                      width: `${100 / photos.length}%`,
                    }}
                  >
                    <img
                      src={photo}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-contain transition-transform duration-300"
                    />
                  </div>
                );
              })}
            </div>
            {/* Photo Counter */}
            {hasMultiplePhotos && (
              <div className="top-2 right-2 absolute bg-black/50 px-2 py-1 rounded-full text-white text-xs">
                {currentPhotoIndex + 1}/{photos.length}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center bg-gradient-to-br from-gray-200 to-gray-300 w-full h-48">
            <Icon icon={icons.image} iconClassName="text-4xl text-gray-400" />
          </div>
        )}
        {/* Limited Badge */}
        {product.limited && (
          <div className="top-2 left-2 absolute bg-red-500 px-2 py-1 rounded-full font-bold text-white text-xs">
            <Translate content="Limited" />
          </div>
        )}
        {/* Favorite Button */}
        {
          <div
            onClick={() => {
              setIsFavorite(!isFavorite);
            }}
            className={tw(
              `absolute top-1 text-red-700 right-0 p-2 rounded-full transition-all duration-300`,
              product.photos?.length && product.photos.length > 1 && "right-12"
            )}
          >
            <Icon
              icon={
                isFavorite ? allIcons.solid.faHeart : allIcons.regular.faHeart
              }
              iconClassName="text-lg"
            />
          </div>
        }
      </div>
      {/* Product Info */}
      <div className="p-4 border-gray-300 border-t border-solid">
        <h3
          className="mb-2 font-semibold text-gray-800 text-lg line-clamp-2"
          style={COMMON_STYLES.interFont}
        >
          {product.name}
        </h3>
        <div className="flex justify-between items-center">
          <span
            className="font-bold text-xl"
            style={{ fontFamily: MONTSERRAT_FONT, color: BRAND_COLOR }}
          >
            {priceDisplay}
          </span>
          <Button
            className="px-4 py-2 border-2 hover:border-blue-400 rounded-full w-fit text-white text-sm transition-all duration-200"
            style={COMMON_STYLES.brandButton}
            onClick={handleAddToCart}
          >
            {currentCartCount > 0 ? (
              <>
                <Icon
                  icon={allIcons.solid.faCheck}
                  iconClassName="text-xs mr-1"
                />
                <Translate content="Added" /> ({currentCartCount})
              </>
            ) : (
              <Translate content="Add to Cart" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
// Search Results Product Card Component - Namshi-style compact layout
const SearchProductCard = ({
  product,
  storeId,
}: {
  product: SnapBuy.Product;
  storeId: string;
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  // Memoized values for performance
  const photos = useMemo(() => product.photos || [], [product.photos]);
  const hasMultiplePhotos = useMemo(() => photos.length > 1, [photos.length]);
  const priceDisplay = useMemo(
    () => getProductPriceDisplay(product),
    [product]
  );
  // Get current cart count for this product
  const currentCartCount =
    useFullCart(storeId).find((item) => item.prodId === product.id)?.count || 0;
  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (product.id && storeId) {
      addToCart(storeId, product.id, currentCartCount + 1);
    }
  };
  // Auto-slide photos every 3 seconds
  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) =>
        prevIndex === photos.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length, hasMultiplePhotos]);
  return (
    <div className="group flex flex-col bg-gray-50 border border-gray-200 border-solid rounded-lg w-full overflow-hidden transition-all duration-300 cursor-pointer">
      <div className="relative">
        {photos.length > 0 ? (
          <div className="relative w-full h-48 overflow-hidden">
            {/* Photo Container */}
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{
                width: `${photos.length * 100}%`,
                transform: `translateX(-${
                  currentPhotoIndex * (100 / photos.length)
                }%)`,
              }}
            >
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full h-48"
                  style={{
                    width: `${100 / photos.length}%`,
                  }}
                >
                  <img
                    src={photo}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-contain transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
            {/* Photo Counter */}
            {hasMultiplePhotos && (
              <div className="top-2 left-2 absolute bg-black/70 px-2 py-1 rounded text-white text-xs">
                {currentPhotoIndex + 1}/{photos.length}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center bg-gray-100 w-full h-48">
            <Icon icon={icons.image} iconClassName="text-3xl text-gray-400" />
          </div>
        )}
        {/* Limited Badge */}
        {product.limited && (
          <div className="top-2 right-2 absolute bg-red-500 px-2 py-1 rounded font-bold text-white text-xs">
            <Translate content="Limited" />
          </div>
        )}
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="right-2 bottom-2 absolute"
        >
          <Icon
            icon={
              isFavorite ? allIcons.solid.faHeart : allIcons.regular.faHeart
            }
            iconClassName={tw(
              "text-sm transition-colors duration-300",
              isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"
            )}
          />
        </button>
      </div>
      <div>
        <Line />
      </div>
      {/* Product Info */}
      <div className="p-3">
        {/* Brand/Category */}
        <div className="mb-1">
          <span
            className="text-gray-500 text-xs uppercase tracking-wide"
            style={COMMON_STYLES.interFont}
          >
            SnapBuy
          </span>
        </div>
        {/* Product Name */}
        <h3
          className="mb-2 font-medium text-gray-900 group-hover:text-[#89CFF0] text-sm line-clamp-2 transition-colors duration-200"
          style={{ fontFamily: ROBOTO_FONT }}
        >
          {product.name}
        </h3>
        {/* Price */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="font-bold text-gray-900 text-base"
            style={{ fontFamily: MONTSERRAT_FONT }}
          >
            {priceDisplay}
          </span>
        </div>
        {/* Free Delivery Badge */}
        <div className="flex items-center gap-1 mb-2 text-green-600 text-xs">
          <Icon icon={allIcons.solid.faTruck} iconClassName="text-xs" />
          <span style={COMMON_STYLES.interFont}>
            <Translate content="Free Delivery" />
          </span>
        </div>
        {/* Action Button */}
        <Button
          className="px-3 py-1.5 border-2 hover:border-blue-400 rounded w-full font-medium text-white text-xs transition-colors duration-200"
          style={COMMON_STYLES.brandButton}
          onClick={handleAddToCart}
        >
          {currentCartCount > 0 ? (
            <>
              <Icon
                icon={allIcons.solid.faCheck}
                iconClassName="text-xs mr-1"
              />
              <Translate content="Added" /> ({currentCartCount})
            </>
          ) : (
            <Translate content="Add to Cart" />
          )}
        </Button>
      </div>
    </div>
  );
};
// Custom Cart Component
const CustomCartView = ({ storeId }: { storeId: string }) => {
  const cartItems = useFullCart(storeId);
  const user = useUser();
  // Form state
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  // Location state
  const [latitude, setLatitude] = useState<Nothing | number>(null);
  const [longitude, setLongitude] = useState<Nothing | number>(null);
  // Get products for cart items
  const cartProducts = useAsyncMemo(async () => {
    if (!cartItems.length || !storeId) return [];
    const allProducts = await snapbuyApi.getProductsOf(storeId);
    if (!allProducts) return [];
    return cartItems
      .map((cartItem) => {
        const product = allProducts.find((p) => p.id === cartItem.prodId);
        return {
          ...cartItem,
          product: product,
        };
      })
      .filter((item) => item.product);
  }, [cartItems, storeId]);
  const totalPrice = useMemo(() => {
    if (!cartProducts) return 0;
    return cartProducts.reduce((total, item) => {
      if (!item.product) return total;
      const price = getProductPrice(item.product);
      return total + price * item.count;
    }, 0);
  }, [cartProducts]);
  // Form values
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [showWilayaDropdown, setShowWilayaDropdown] = useState(false);
  const [selectedWilayaIndex, setSelectedWilayaIndex] = useState(-1);
  const wilayaDropdownRef = useRef<HTMLDivElement>(null);
  // Algerian Wilayas list
  const algerianWilayas = [
    "01 - Adrar",
    "02 - Chlef",
    "03 - Laghouat",
    "04 - Oum El Bouaghi",
    "05 - Batna",
    "06 - Béjaïa",
    "07 - Biskra",
    "08 - Béchar",
    "09 - Blida",
    "10 - Bouira",
    "11 - Tamanrasset",
    "12 - Tébessa",
    "13 - Tlemcen",
    "14 - Tiaret",
    "15 - Tizi Ouzou",
    "16 - Alger",
    "17 - Djelfa",
    "18 - Jijel",
    "19 - Sétif",
    "20 - Saïda",
    "21 - Skikda",
    "22 - Sidi Bel Abbès",
    "23 - Annaba",
    "24 - Guelma",
    "25 - Constantine",
    "26 - Médéa",
    "27 - Mostaganem",
    "28 - M'Sila",
    "29 - Mascara",
    "30 - Ouargla",
    "31 - Oran",
    "32 - El Bayadh",
    "33 - Illizi",
    "34 - Bordj Bou Arréridj",
    "35 - Boumerdès",
    "36 - El Tarf",
    "37 - Tindouf",
    "38 - Tissemsilt",
    "39 - El Oued",
    "40 - Khenchela",
    "41 - Souk Ahras",
    "42 - Tipaza",
    "43 - Mila",
    "44 - Aïn Defla",
    "45 - Naâma",
    "46 - Aïn Témouchent",
    "47 - Ghardaïa",
    "48 - Relizane",
    "49 - Timimoun",
    "50 - Bordj Badji Mokhtar",
    "51 - Ouled Djellal",
    "52 - Béni Abbès",
    "53 - In Salah",
    "54 - In Guezzam",
    "55 - Touggourt",
    "56 - Djanet",
    "57 - El M'Ghair",
    "58 - El Meniaa",
  ];
  // Initialize form with user data
  useEffect(() => {
    setFirstname(user?.firstname || "");
    setLastname(user?.lastname || "");
    const phoneNumber = user?.phone || localStorage.getItem("phone") || "";
    setPhone(phoneNumber);
  }, [user]);
  // Auto-detect location action
  const locationAction = useAction(
    "auto-detect-location",
    async () => {
      try {
        if (isWeb) {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const coords = position.coords;
                setLatitude(coords.latitude);
                setLongitude(coords.longitude);
                try {
                  const addressInfo = await getAddressFromCoords(
                    coords.latitude,
                    coords.longitude
                  );
                  if (addressInfo.wilaya) {
                    setWilaya(addressInfo.wilaya);
                  }
                  if (addressInfo.fullAddress) {
                    setAddress(addressInfo.fullAddress);
                  }
                } catch (err) {}
                resolve(coords);
              },
              (error) => {
                showToast("Geolocation error: " + error.message, "error");
                reject(new Error("Geolocation error: " + error.message));
              }
            );
          });
        } else {
          let permStatus = await Geolocation.checkPermissions();
          if (permStatus.location !== "granted") {
            permStatus = await Geolocation.requestPermissions();
            if (permStatus.location !== "granted") {
              showToast("Location permission denied", "error");
              return;
            }
          }
          const position = await Geolocation.getCurrentPosition();
          const coords = position.coords;
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          try {
            const addressInfo = await getAddressFromCoords(
              coords.latitude,
              coords.longitude
            );
            if (addressInfo.wilaya) {
              setWilaya(addressInfo.wilaya);
            }
            if (addressInfo.fullAddress) {
              setAddress(addressInfo.fullAddress);
            }
          } catch (err) {}
        }
        showToast("Location detected successfully", "success");
      } catch (error) {
        showToast("Failed to detect location", "error");
      }
    },
    []
  );
  // Create order action
  const handleCreateOrder = async () => {
    setIsSubmittingOrder(true);
    try {
      if (!firstname) {
        setFocused("client-firstname");
        showToast("Enter Your First Name", "info");
        return;
      }
      if (!lastname) {
        setFocused("client-lastname");
        showToast("Enter Your Last Name", "info");
        return;
      }
      if (!phone) {
        setFocused("client-phone");
        showToast("Enter Your Phone Number", "info");
        return;
      }
      if (!address) {
        setFocused("client-address");
        showToast("Enter Your Address", "info");
        return;
      }
      if (!wilaya) {
        setFocused("client-wilaya");
        showToast("Enter Your Wilaya", "info");
        return;
      }
      const carts = cartItems.reduce((acc, item) => {
        acc[item.prodId] = { count: item.count };
        return acc;
      }, {} as any);
      localStorage.setItem("phone", phone);
      const place: any = {
        address,
        wilaya,
      };
      if (latitude) place.latitude = latitude;
      if (longitude) place.longitude = longitude;
      const options: CreateOrderOptions = {
        products: carts,
        client: {
          firstname,
          lastname,
          phone,
          id: crypto.randomUUID(),
        },
        place,
        delivery: false,
        metaData: {},
      };
      await snapbuyApi.createOrder(options);
      showToast("Order Created Successfully", "success");
      deleteCart(storeId);
      setShowShippingForm(false);
      setTab("store", "home");
    } catch (error) {
      showToast("Failed to create order", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };
  const handleQuantityChange = (prodId: string, newCount: number) => {
    if (newCount <= 0) {
      removeCart(storeId, prodId);
    } else {
      addToCart(storeId, prodId, newCount);
    }
  };
  const handleMinusClick = (
    prodId: string,
    currentCount: number,
    productName: string
  ) => {
    if (currentCount === 1) {
      // Show confirmation dialog when removing the last item
      setProductToDelete({ prodId, productName });
      setShowDeleteConfirmation(true);
    } else {
      // Decrease quantity normally
      handleQuantityChange(prodId, currentCount - 1);
    }
  };
  const confirmDeleteProduct = () => {
    if (productToDelete) {
      removeCart(storeId, productToDelete.prodId);
      setShowDeleteConfirmation(false);
      setProductToDelete(null);
    }
  };
  const cancelDeleteProduct = () => {
    setShowDeleteConfirmation(false);
    setProductToDelete(null);
  };
  const handleRemoveItem = (prodId: string) => {
    removeCart(storeId, prodId);
  };
  // Shipping form state
  const [showShippingForm, setShowShippingForm] = useState(false);
  // Confirmation dialog state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    prodId: string;
    productName: string;
  } | null>(null);
  // Filter wilaya based on search
  const filteredWilayas = useMemo(() => {
    if (!wilaya) return algerianWilayas;
    return algerianWilayas.filter((w) =>
      w.toLowerCase().includes(wilaya.toLowerCase())
    );
  }, [wilaya, algerianWilayas]);
  // Handle wilaya selection
  const handleWilayaSelect = (selectedWilaya: string) => {
    // Extract just the name part (after " - ")
    const wilayaName = selectedWilaya.split(" - ")[1] || selectedWilaya;
    setWilaya(wilayaName);
    setShowWilayaDropdown(false);
    setSelectedWilayaIndex(-1);
  };
  // Handle wilaya input change
  const handleWilayaChange = (value: string) => {
    setWilaya(value);
    setShowWilayaDropdown(true);
    setSelectedWilayaIndex(-1);
  };
  // Handle keyboard navigation for wilaya dropdown
  const handleWilayaKeyDown = (e: React.KeyboardEvent) => {
    if (!showWilayaDropdown) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedWilayaIndex((prev) =>
          prev < filteredWilayas.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedWilayaIndex((prev) =>
          prev > 0 ? prev - 1 : filteredWilayas.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedWilayaIndex >= 0) {
          handleWilayaSelect(filteredWilayas[selectedWilayaIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowWilayaDropdown(false);
        setSelectedWilayaIndex(-1);
        break;
    }
  };
  // Scroll selected item into view
  useEffect(() => {
    if (selectedWilayaIndex >= 0 && wilayaDropdownRef.current) {
      const selectedElement = wilayaDropdownRef.current.children[
        selectedWilayaIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedWilayaIndex]);
  const isLocationLoading = isLoading(locationAction);
  if (!cartProducts || cartProducts.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto px-4 py-16 max-w-7xl text-center">
          <div className="flex flex-col justify-center items-center gap-6">
            <Icon
              icon={icons.shoppingCart}
              iconClassName="text-6xl text-gray-400"
            />
            <h2
              className="font-bold text-gray-900 text-2xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              <Translate content="Your cart is empty" />
            </h2>
            <p
              className="text-gray-600"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Translate content="Add some products to get started" />
            </p>
            <Button
              className="px-6 py-3 border-2 rounded-lg font-semibold text-white transition-all duration-200"
              style={{
                backgroundColor: "#89CFF0",
                borderColor: "#89CFF0",
                fontFamily: "Inter, sans-serif",
              }}
              onClick={() => setTab("store", "home")}
            >
              <Translate content="Continue Shopping" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto px-6 py-6 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setTab("store", "home")}
              className="hover:underline"
              style={{
                fontFamily: "Inter, sans-serif",
                color: "#89CFF0",
              }}
            >
              <Translate content="Home" />
            </button>
            <span className="text-gray-400">{">"}</span>
            <span
              className="text-gray-600"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Translate content="Cart" />
            </span>
          </div>
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-gray-200 border-b">
          <div className="flex items-center gap-4">
            <h1
              className="font-bold text-gray-900 text-2xl"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Cart ({cartProducts?.length || 0} item
              {cartProducts?.length !== 1 ? "s" : ""})
            </h1>
            <Button
              className="px-4 py-2 border-2 rounded-md font-medium text-gray-600 hover:text-gray-800 transition-all duration-200"
              style={{
                fontFamily: "Inter, sans-serif",
                borderColor: "#e5e7eb",
                backgroundColor: "white",
              }}
              onClick={() => setTab("store", "home")}
            >
              <Translate content="Continue Shopping" />
            </Button>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md font-medium text-white transition-all duration-200"
            style={{
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#89CFF0",
              borderColor: "#89CFF0",
            }}
            onClick={() => setShowShippingForm(true)}
            disabled={isSubmittingOrder}
          >
            <Translate content="Checkout" />
          </Button>
        </div>
        {/* Cart Items */}
        <div className="space-y-4">
          {cartProducts.map((item) => {
            // Optimize repeated calculations for each cart item
            const productPrice = item.product
              ? getProductPrice(item.product)
              : 0;
            const discountedPriceStr = getDiscountedPrice(productPrice);
            const totalItemPrice = (productPrice * item.count).toFixed(2);
            return (
              <div key={item.prodId} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.product?.photos?.[0] || ""}
                      alt={item.product?.name || ""}
                      className="rounded-md w-20 h-20 object-cover"
                    />
                  </div>
                  {/* Product Details */}
                  <div className="flex-grow">
                    <h3
                      className="mb-1 font-semibold text-gray-900 text-base"
                      style={COMMON_STYLES.interFont}
                    >
                      {item.product?.name}
                    </h3>
                    {/* Product specifications */}
                    <div className="space-y-1 text-gray-600 text-sm">
                      <div style={COMMON_STYLES.interFont}>
                        <span className="font-medium">Fit:</span>{" "}
                        <span>Male Fit</span>
                      </div>
                      <div style={COMMON_STYLES.interFont}>
                        <span className="font-medium">Style:</span>{" "}
                        <span>Classic T-Shirt</span>
                      </div>
                      <div style={COMMON_STYLES.interFont}>
                        <span className="font-medium">Size:</span>{" "}
                        <span>Small</span>
                      </div>
                      <div style={COMMON_STYLES.interFont}>
                        <span className="font-medium">Color:</span>{" "}
                        <span>White</span>
                      </div>
                    </div>
                  </div>
                  {/* Price */}
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <div
                        className="font-bold text-red-500 text-lg"
                        style={COMMON_STYLES.interFont}
                      >
                        {productPrice.toFixed(2)} DA{" "}
                        <span className="text-sm">each</span>
                      </div>
                      <div
                        className="text-gray-500 text-sm line-through"
                        style={COMMON_STYLES.interFont}
                      >
                        {discountedPriceStr} DA
                      </div>
                    </div>
                    <div
                      className="font-bold text-red-500 text-xl"
                      style={COMMON_STYLES.interFont}
                    >
                      {totalItemPrice} DA
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-3 border-gray-200 border-t">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleRemoveItem(item.prodId)}
                      className="font-medium hover:text-blue-800 text-sm underline"
                      style={COMMON_STYLES.brandText}
                    >
                      <Translate content="Remove" />
                    </button>
                    <button
                      className="font-medium hover:text-blue-800 text-sm underline"
                      style={COMMON_STYLES.brandText}
                    >
                      <Translate content="Update" />
                    </button>
                  </div>
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleMinusClick(
                          item.prodId,
                          item.count,
                          item.product?.name || "Product"
                        )
                      }
                      className="flex justify-center items-center bg-white hover:bg-gray-50 border border-gray-300 rounded w-8 h-8"
                    >
                      <Icon
                        icon={allIcons.solid.faMinus}
                        iconClassName="text-xs text-gray-600"
                      />
                    </button>
                    <span
                      className="w-8 font-medium text-center"
                      style={COMMON_STYLES.interFont}
                    >
                      {item.count}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.prodId, item.count + 1)
                      }
                      className="flex justify-center items-center hover:bg-blue-700 rounded w-8 h-8 text-white"
                      style={COMMON_STYLES.brandBackgroundOnly}
                    >
                      <Icon
                        icon={allIcons.solid.faPlus}
                        iconClassName="text-xs"
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Cart Summary */}
        <div className="bg-gray-50 mt-6 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span
              className="font-semibold text-gray-900 text-lg"
              style={COMMON_STYLES.interFont}
            >
              <Translate content="Total" />
            </span>
            <span
              className="font-bold text-2xl"
              style={COMMON_STYLES.brandText}
            >
              {totalPrice.toFixed(2)} DA
            </span>
          </div>
        </div>
        {/* Shipping Information Form */}
        {showShippingForm && (
          <div className="mt-8 pt-8 border-gray-200 border-t">
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2
                  className="font-bold text-gray-900 text-xl"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Translate content="Shipping Information" />
                </h2>
                <button
                  onClick={() => setShowShippingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={allIcons.solid.faTimes} iconClassName="text-xl" />
                </button>
              </div>
              {/* Form Grid */}
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                {/* First Name */}
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="First Name" />
                  </label>
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    placeholder="Enter your first name"
                  />
                </div>
                {/* Last Name */}
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Last Name" />
                  </label>
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    placeholder="Enter your last name"
                  />
                </div>
                {/* Phone */}
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Phone Number" />
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    placeholder="Enter your phone number"
                  />
                </div>
                {/* Wilaya */}
                <div className="relative">
                  <label
                    className="block mb-1 font-medium text-gray-700 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Wilaya" />
                  </label>
                  <input
                    type="text"
                    value={wilaya}
                    onChange={(e) => handleWilayaChange(e.target.value)}
                    onKeyDown={handleWilayaKeyDown}
                    onFocus={() => setShowWilayaDropdown(true)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    placeholder="Select or type wilaya..."
                    autoComplete="off"
                  />
                  {/* Wilaya Dropdown */}
                  {showWilayaDropdown && filteredWilayas.length > 0 && (
                    <div
                      ref={wilayaDropdownRef}
                      className="z-10 absolute bg-white shadow-lg mt-1 border border-gray-300 rounded-md w-full max-h-60 overflow-y-auto"
                    >
                      {filteredWilayas.map((wilayaOption, index) => (
                        <div
                          key={wilayaOption}
                          onClick={() => handleWilayaSelect(wilayaOption)}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                            index === selectedWilayaIndex ? "bg-blue-50" : ""
                          }`}
                          style={{
                            fontFamily: "Inter, sans-serif",
                            backgroundColor:
                              index === selectedWilayaIndex
                                ? "#e0f2fe"
                                : undefined,
                          }}
                        >
                          {wilayaOption}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Address/Place - Full Width */}
                <div className="md:col-span-2">
                  <label
                    className="block mb-1 font-medium text-gray-700 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Address" />
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      placeholder="Enter your full address"
                    />
                    <button
                      onClick={() => {
                        execAction("");
                      }}
                      disabled={isLocationLoading}
                      className="self-start hover:bg-gray-50 px-3 py-2 border border-gray-300 rounded-md transition-colors duration-200"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      title="Auto-detect location"
                    >
                      {isLocationLoading ? (
                        <Icon
                          icon={allIcons.solid.faSpinner}
                          iconClassName="text-sm animate-spin"
                        />
                      ) : (
                        <Icon
                          icon={allIcons.solid.faLocationArrow}
                          iconClassName="text-sm"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 transition-all duration-200"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  onClick={() => setShowShippingForm(false)}
                >
                  <Translate content="Cancel" />
                </Button>
                <Button
                  className="flex-1 px-4 py-2 rounded-md font-medium text-white transition-all duration-200"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "#89CFF0",
                    borderColor: "#89CFF0",
                  }}
                  onClick={handleCreateOrder}
                  disabled={isSubmittingOrder}
                >
                  {isSubmittingOrder ? (
                    <>
                      <Icon
                        icon={allIcons.solid.faSpinner}
                        iconClassName="mr-2 animate-spin"
                      />
                      <Translate content="Processing..." />
                    </>
                  ) : (
                    <Translate content="Place Order" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{
                  duration: 0.4,
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                className="bg-white shadow-xl mx-4 p-6 rounded-xl w-full max-w-sm"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                    className="flex justify-center items-center bg-red-100 mx-auto mb-4 rounded-full w-12 h-12"
                  >
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mb-2 font-semibold text-gray-900 text-lg"
                  >
                    Remove Product
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="mb-6 text-gray-600"
                  >
                    Are you sure you want to remove "
                    {productToDelete?.productName}" from your cart?
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="flex space-x-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={cancelDeleteProduct}
                      className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg ${COMMON_STYLES.interFont} text-gray-700 hover:bg-gray-50 transition-all duration-200`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmDeleteProduct}
                      className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg ${COMMON_STYLES.interFont} hover:bg-red-700 transition-all duration-200`}
                    >
                      Remove
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export const Test = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<SnapBuy.Collection | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<SnapBuy.Pack | null>(null);
  // Search placeholder cycling with typing animation
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  // Sort options
  const sortOptions = [
    { value: "recommended", label: <Translate content="Recommended" /> },
    {
      value: "price-low-high",
      label: <Translate content="Price Low to High" />,
    },
    {
      value: "price-high-low",
      label: <Translate content="Price High to Low" />,
    },
    { value: "newest", label: <Translate content="Newest" /> },
    { value: "name-a-z", label: <Translate content="Name A to Z" /> },
    { value: "name-z-a", label: <Translate content="Name Z to A" /> },
  ];
  // Filter expansion states
  const [expandedFilters, setExpandedFilters] = useState<{
    [key: string]: boolean;
  }>({
    brand: false,
    category: false,
    size: false,
    colour: false,
    price: false,
    delivery: false,
  });
  // Applied filters (these are used for actual filtering)
  const [appliedBrands, setAppliedBrands] = useState<string[]>([]);
  const [appliedSizes, setAppliedSizes] = useState<string[]>([]);
  const [appliedColors, setAppliedColors] = useState<string[]>([]);
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | "">("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | "">("");
  const [appliedDeliveryTypes, setAppliedDeliveryTypes] = useState<string[]>(
    []
  );
  // Initialize cart
  initCart();
  // Get cart count for badge
  const cartItemCount = useCartTotalCount(storeId);
  // Pending filters (these are modified in the UI but not yet applied)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState<string[]>(
    []
  );
  const toggleFilter = (filterName: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };
  // Apply filters function
  const applyFilters = () => {
    setAppliedBrands(selectedBrands);
    setAppliedSizes(selectedSizes);
    setAppliedColors(selectedColors);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setAppliedDeliveryTypes(selectedDeliveryTypes);
  };
  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedDeliveryTypes([]);
    setAppliedBrands([]);
    setAppliedSizes([]);
    setAppliedColors([]);
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setAppliedDeliveryTypes([]);
  };
  // Check if there are pending changes
  const hasPendingChanges = useMemo(() => {
    return (
      JSON.stringify(selectedBrands) !== JSON.stringify(appliedBrands) ||
      JSON.stringify(selectedSizes) !== JSON.stringify(appliedSizes) ||
      JSON.stringify(selectedColors) !== JSON.stringify(appliedColors) ||
      minPrice !== appliedMinPrice ||
      maxPrice !== appliedMaxPrice ||
      JSON.stringify(selectedDeliveryTypes) !==
        JSON.stringify(appliedDeliveryTypes)
    );
  }, [
    selectedBrands,
    appliedBrands,
    selectedSizes,
    appliedSizes,
    selectedColors,
    appliedColors,
    minPrice,
    appliedMinPrice,
    maxPrice,
    appliedMaxPrice,
    selectedDeliveryTypes,
    appliedDeliveryTypes,
  ]);
  const toggleBrandFilter = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };
  const toggleSizeFilter = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };
  const toggleColorFilter = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };
  const toggleDeliveryFilter = (deliveryType: string) => {
    setSelectedDeliveryTypes((prev) =>
      prev.includes(deliveryType)
        ? prev.filter((d) => d !== deliveryType)
        : [...prev, deliveryType]
    );
  };
  // Ref for featured products scrolling
  const featuredProductsRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [canScrollFeaturedLeft, setCanScrollFeaturedLeft] = useState(false);
  const [canScrollFeaturedRight, setCanScrollFeaturedRight] = useState(true);
  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const checkFeaturedScrollability = () => {
    if (featuredProductsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        featuredProductsRef.current;
      setCanScrollFeaturedLeft(scrollLeft > 0);
      setCanScrollFeaturedRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };
  const scrollFeaturedLeft = () => {
    if (featuredProductsRef.current) {
      featuredProductsRef.current.scrollBy({
        left: -320,
        behavior: "smooth",
      });
      // Check scrollability after animation
      setTimeout(checkFeaturedScrollability, 300);
    }
  };
  const scrollFeaturedRight = () => {
    if (featuredProductsRef.current) {
      featuredProductsRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      });
      // Check scrollability after animation
      setTimeout(checkFeaturedScrollability, 300);
    }
  };
  // Hero banner images
  const bannerImages = useMemo(() => {
    return [
      "https://f.nooncdn.com/mpcms/EN0111/assets/66236654-4b65-4a1d-87f0-a89323fad3c1.png?format=webp",
      "https://f.nooncdn.com/mpcms/EN0111/assets/6a55b066-cad8-40e0-a90c-02ba219d67f7.jpg?format=webp",
      "https://f.nooncdn.com/mpcms/EN0112/assets/761a6007-9ef7-4af3-8bb9-e3ffceecae1d.png?format=webp",
    ];
  }, []);
  // Auto-slide banner images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);
  const store = useAsyncMemo(async () => {
    return snapbuyApi.getStore(storeId);
  }, [storeId]);
  // Fetch collections for this store
  const collections = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.getCollections(storeId);
  }, [storeId]);
  // Fetch products for this store
  const products = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.getProductsOf(storeId);
  }, [storeId]);
  // Fetch brands for this store
  const brands = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.getAllBrands(storeId);
  }, [storeId]);
  // Fetch offers/packs for this store
  const offers = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.getPacks(storeId);
  }, [storeId]);
  // Get featured products (first 8 products)
  const featuredProducts = useMemo(() => {
    return products?.slice(0, 8) || [];
  }, [products]);
  // Check featured products scrollability when they change
  useEffect(() => {
    checkFeaturedScrollability();
  }, [featuredProducts]);
  const searchValue = useCopyState("");
  // Dynamic search placeholders based on store data
  const searchPlaceholders = useMemo(() => {
    const placeholders: string[] = [];
    // Add brand names
    if (brands && brands.length > 0) {
      brands.slice(0, 4).forEach((brand) => {
        if (brand.name) {
          placeholders.push(brand.name);
        }
      });
    }
    // Add collection names
    if (collections && collections.length > 0) {
      collections.slice(0, 3).forEach((collection) => {
        if (collection.name) {
          placeholders.push(collection.name);
        }
      });
    }
    // Add some popular product names
    if (products && products.length > 0) {
      products.slice(0, 3).forEach((product) => {
        if (product.name) {
          placeholders.push(product.name.split(" ").slice(0, 2).join(" "));
        }
      });
    }
    // Fallback placeholders if no data available
    if (placeholders.length === 0) {
      return ["Products", "Brands", "Collections", "Offers"];
    }
    return placeholders;
  }, [brands, collections, products]);
  // Typing animation effect
  useEffect(() => {
    if (searchPlaceholders.length === 0) return;
    const currentPlaceholder = searchPlaceholders[currentPlaceholderIndex];
    let currentIndex = 0;
    setTypedText("");
    setIsTyping(true);
    const typingInterval = setInterval(() => {
      if (currentIndex <= currentPlaceholder.length) {
        setTypedText(currentPlaceholder.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        // Wait 2 seconds before moving to next placeholder
        setTimeout(() => {
          setCurrentPlaceholderIndex((prev) =>
            prev === searchPlaceholders.length - 1 ? 0 : prev + 1
          );
        }, 2000);
      }
    }, 100); // Type one character every 100ms
    return () => clearInterval(typingInterval);
  }, [currentPlaceholderIndex, searchPlaceholders]);
  // Filtered products based on all applied filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter((product) =>
      fuzzySearch(searchValue.get, product.name || "")
    );
    // Filter by brand
    if (appliedBrands.length > 0) {
      filtered = filtered.filter((product) =>
        appliedBrands.includes(product.brandId || "")
      );
    }
    // Filter by size (from product.metaData array)
    if (appliedSizes.length > 0) {
      filtered = filtered.filter((product) => {
        const sizesField = product.metaData?.find(
          (field) => field.key === "sizes"
        );
        if (!sizesField || !Array.isArray(sizesField.value)) return false;
        const productSizes = sizesField.value as string[];
        return appliedSizes.some((size) => productSizes.includes(size));
      });
    }
    // Filter by color (from product.metaData array)
    if (appliedColors.length > 0) {
      filtered = filtered.filter((product) => {
        const colorsField = product.metaData?.find(
          (field) => field.key === "colors"
        );
        if (!colorsField || !Array.isArray(colorsField.value)) return false;
        const productColors = colorsField.value as string[];
        return appliedColors.some((color) =>
          productColors.some((productColor: string) =>
            productColor.toLowerCase().includes(color.toLowerCase())
          )
        );
      });
    }
    // Filter by price range (min/max)
    if (appliedMinPrice !== "" || appliedMaxPrice !== "") {
      filtered = filtered.filter((product) => {
        const price =
          product.type === "single"
            ? product.single?.client || 0
            : Math.min(
                ...(product.multiple?.prices?.map((p) => p.price) || [0])
              );
        const min = appliedMinPrice === "" ? 0 : Number(appliedMinPrice);
        const max = appliedMaxPrice === "" ? Infinity : Number(appliedMaxPrice);
        return price >= min && price <= max;
      });
    }
    // Filter by delivery type (assuming all products have free delivery for now)
    if (appliedDeliveryTypes.length > 0) {
      // For now, all products are considered to have both free and express delivery
      // This could be enhanced with actual delivery data from the product
    }
    // Apply sorting
    switch (sortBy) {
      case "price-low-high":
        filtered = filtered.sort((a, b) => {
          const priceA = getProductPrice(a);
          const priceB = getProductPrice(b);
          return priceA - priceB;
        });
        break;
      case "price-high-low":
        filtered = filtered.sort((a, b) => {
          const priceA = getProductPrice(a);
          const priceB = getProductPrice(b);
          return priceB - priceA;
        });
        break;
      case "newest":
        filtered = filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case "name-a-z":
        filtered = filtered.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case "name-z-a":
        filtered = filtered.sort((a, b) =>
          (b.name || "").localeCompare(a.name || "")
        );
        break;
      case "recommended":
      default:
        // Keep original order (could be enhanced with recommendation algorithm)
        break;
    }
    return filtered;
  }, [
    products,
    searchValue.get,
    appliedBrands,
    appliedSizes,
    appliedColors,
    appliedMinPrice,
    appliedMaxPrice,
    appliedDeliveryTypes,
    sortBy,
  ]);
  // Filtered products for selected collection
  const collectionProducts = useMemo(() => {
    if (!products || !selectedCollection || !selectedCollection.products)
      return [];
    return products.filter(
      (product) => selectedCollection.products?.includes(product.id!) || false
    );
  }, [products, selectedCollection]);
  // Filtered products for selected offer
  const offerProducts = useMemo(() => {
    if (!products || !selectedOffer || !selectedOffer.products) return [];
    return products.filter(
      (product) =>
        selectedOffer.products?.some((p) => p.prodId === product.id) || false
    );
  }, [products, selectedOffer]);
  // Get unique sizes and colors from all products for filter options
  const availableSizes = useMemo(() => {
    if (!products) return [];
    const sizes = new Set<string>();
    products.forEach((product) => {
      const sizesField = product.metaData?.find(
        (field) => field.key === "sizes"
      );
      if (sizesField && Array.isArray(sizesField.value)) {
        (sizesField.value as string[]).forEach((size: string) =>
          sizes.add(size)
        );
      }
    });
    return Array.from(sizes).sort();
  }, [products]);
  const availableColors = useMemo(() => {
    if (!products) return [];
    const colors = new Set<string>();
    products.forEach((product) => {
      const colorsField = product.metaData?.find(
        (field) => field.key === "colors"
      );
      if (colorsField && Array.isArray(colorsField.value)) {
        (colorsField.value as string[]).forEach((color: string) =>
          colors.add(color)
        );
      }
    });
    return Array.from(colors).sort();
  }, [products]);
  const tab = getTab("store");
  useEffect(() => {
    if (!tab) {
      setTab("store", "home");
    }
    // Sync searchValue with URL
  }, [tab]);
  // Color gradients for collections
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Offers Banner - Show if there are offers */}
      <TabContent identifier="store" value="home">
        {offers && offers.length > 0 && (
          <div
            className="py-3"
            style={{
              background: "linear-gradient(to right, #89CFF0, #5DADE2)",
            }}
          >
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex justify-center items-center gap-4 text-white">
                <span className="text-2xl animate-bounce">🔥</span>
                <span
                  className="font-bold text-lg"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  SPECIAL OFFERS AVAILABLE - {offers.length} PACK
                  {offers.length > 1 ? "S" : ""} ON SALE!
                </span>
                <span className="text-2xl animate-bounce">🔥</span>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="top-0 z-50 sticky bg-white shadow-sm border-b">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1
                  className="font-bold text-gray-900 text-2xl uppercase tracking-wide"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  {store?.name || "SnapBuy"}
                </h1>
              </div>
              <nav
                className="flex items-center gap-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {/* Search Button */}
                <button
                  onClick={() => {
                    setShowSearch((s) => !s);
                  }}
                  className="flex-1 hover:bg-gray-100 rounded-full w-[40px] h-[40px] text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Icon
                    icon={showSearch ? allIcons.solid.faXmark : icons.search}
                    iconClassName={tw(
                      "text-xl transition-transform",
                      showSearch && "rotate-90"
                    )}
                  />
                </button>
                {/* Cart Button */}
                <button
                  onClick={() => setTab("store", "cart")}
                  className="relative flex justify-center items-center hover:bg-gray-100 rounded-full w-[40px] h-[40px] text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Icon icon={icons.shoppingCart} iconClassName="text-xl" />
                  {cartItemCount > 0 && (
                    <span
                      className="top-0 right-0 absolute flex justify-center items-center bg-red-500 rounded-full min-w-[20px] h-5 font-bold text-white text-xs"
                      style={{ transform: "translate(25%, -25%)" }}
                    >
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </button>
                {/* Notification Test Button */}
                <button
                  onClick={async () => {
                    setTab("store", "notification-test");
                    // Also run a quick test
                    setTimeout(() => quickNotificationTest(), 500);
                  }}
                  className="flex justify-center items-center hover:bg-gray-100 rounded-full w-[40px] h-[40px] text-gray-700 hover:text-gray-900 transition-colors"
                  title="Test Notifications"
                >
                  <Icon icon={allIcons.solid.faBell} iconClassName="text-xl" />
                </button>
              </nav>
            </div>
          </div>
        </header>
        {/* Search Section - Only show when showSearch is true */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-gray-100 py-8"
            >
              <div className="mx-auto px-4 max-w-7xl">
                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="relative mx-auto max-w-2xl">
                    <input
                      value={searchValue.get}
                      onChange={(e) => searchValue.set(e.target.value)}
                      type="text"
                      placeholder={`Search For ${typedText}${
                        isTyping ? "|" : ""
                      }`}
                      className="px-4 py-3 pr-12 rounded-lg ring-2 ring-gray-400 w-full text-lg"
                      style={{
                        fontFamily: "Inter, sans-serif",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#89CFF0")}
                      onBlur={(e) => (e.target.style.borderColor = "")}
                      autoFocus
                    />
                    <button
                      className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2 transform"
                      onClick={() => {
                        setTemp("search-for-product", searchValue.get);
                        setTab("store", "searched-products");
                      }}
                    >
                      <Icon icon={icons.search} iconClassName="text-xl" />
                    </button>
                    <button
                      onClick={() => setShowSearch(false)}
                      className="top-1/2 right-12 absolute text-gray-400 hover:text-gray-600 text-sm -translate-y-1/2 transform"
                    >
                      <Translate content="Cancel" />
                    </button>
                  </div>
                </motion.div>
                {/* Category Tabs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  className="flex justify-center mb-6"
                >
                  <div className="flex space-x-8">
                    <button className="pb-2 hover:border-gray-300 border-transparent border-b-2 font-medium text-gray-600 hover:text-gray-900">
                      <Translate content="All" />
                    </button>
                    <button className="pb-2 border-gray-900 border-b-2 font-medium text-gray-900">
                      <Translate content="Women" />
                    </button>
                    <button className="pb-2 hover:border-gray-300 border-transparent border-b-2 font-medium text-gray-600 hover:text-gray-900">
                      <Translate content="Men" />
                    </button>
                    <button className="pb-2 hover:border-gray-300 border-transparent border-b-2 font-medium text-gray-600 hover:text-gray-900">
                      <Translate content="Kids" />
                    </button>
                  </div>
                </motion.div>
                {/* Trending Searches */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                  className="text-center"
                >
                  <h3 className="mb-4 font-semibold text-gray-900 text-lg">
                    <Translate content="Trending Searches" />
                  </h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[
                      "mango",
                      "bag",
                      "tote bag",
                      "dresses",
                      "wallet",
                      "sunglasses",
                      "top",
                      "watch",
                      "linen",
                      "bags",
                    ].map((term, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.4 + index * 0.05,
                          ease: "easeOut",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 bg-white hover:bg-gray-50 px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-full text-gray-700 transition-colors"
                        style={{ fontFamily: "Inter, sans-serif" }}
                        onClick={() => {
                          // Handle trending search click
                        }}
                      >
                        <Icon icon={allIcons.solid.faChartLine} />
                        {term}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Hero Banner */}
        <div className="relative h-96 overflow-hidden">
          {/* Banner Images Container */}
          <div
            className="flex h-full transition-transform duration-1000 ease-in-out"
            style={{
              width: `${bannerImages.length * 100}%`,
              transform: `translateX(-${
                currentBannerIndex * (100 / bannerImages.length)
              }%)`,
            }}
          >
            {bannerImages.map((image, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 h-full"
                style={{
                  width: `${100 / bannerImages.length}%`,
                  backgroundImage: `url(${image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              </div>
            ))}
          </div>
          {/* Banner Content Overlay */}
          <div className="absolute inset-0 flex justify-center items-center mx-auto px-4 w-full max-w-7xl">
            <div className="max-w-lg text-center">
              <h2
                className="mb-4 font-bold text-white text-4xl md:text-6xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                <Translate content="Summer" />
                <br />
                <span style={{ color: "#89CFF0" }}>
                  <Translate content="Final Call" />
                </span>
              </h2>
              <p
                className="mb-6 text-white text-xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <Translate content="This Season's Best" />
              </p>
              <Button
                className="px-8 py-3 rounded-none font-medium text-white text-lg tracking-wide"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  backgroundColor: "#89CFF0",
                }}
              >
                <Translate content="Shop Now" />
              </Button>
            </div>
          </div>
          {/* Banner Indicators */}
          <div className="bottom-4 left-1/2 absolute flex space-x-2 -translate-x-1/2 transform">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentBannerIndex === index
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          <div className="hidden md:block top-0 right-0 absolute w-1/2 h-full pointer-events-none">
            <div
              className="flex justify-center items-center h-full"
              style={{
                background:
                  "linear-gradient(to left, rgba(137, 207, 240, 0.3), transparent)",
              }}
            >
              <div className="flex justify-center items-center bg-white/90 shadow-2xl rounded-full w-80 h-80">
                <div style={{ color: "#89CFF0" }}>
                  <Icon icon={icons.user} iconClassName="text-6xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Brands Section */}
        <div className="bg-white py-8">
          <div className="mx-auto px-4 max-w-7xl">
            <h2
              className="mb-6 font-bold text-gray-900 text-2xl text-center"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              BRANDS TO{" "}
              <span className="bg-gradient-to-r from-blue-200 to-blue-300 italic">
                BAG
              </span>
            </h2>
            <div className="flex justify-center gap-3 pb-2 overflow-x-auto scrollbar-hide">
              {brands?.slice(0, 8).map((brand, index) => (
                <div
                  key={brand.id}
                  className={`flex-shrink-0 px-6 py-3 rounded-full transition-all duration-200 cursor-pointer ${
                    index % 5 === 0
                      ? "bg-gradient-to-r from-pink-200 to-pink-300 hover:from-pink-300 hover:to-pink-400"
                      : index % 5 === 1
                      ? "bg-gradient-to-r from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400"
                      : index % 5 === 2
                      ? "bg-gradient-to-r from-purple-200 to-purple-300 hover:from-purple-300 hover:to-purple-400"
                      : index % 5 === 3
                      ? "bg-gradient-to-r from-green-200 to-green-300 hover:from-green-300 hover:to-green-400"
                      : "bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400"
                  }`}
                  onClick={() => {
                    // Handle brand click - could filter products by brand
                  }}
                >
                  <div className="flex items-center gap-3">
                    {brand.photo && (
                      <img
                        src={brand.photo}
                        alt={brand.name}
                        className="h-8 object-contain"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Collections Section */}
        <div className="mx-auto px-4 py-12 max-w-7xl">
          <h2
            className="mb-8 font-bold text-gray-900 text-3xl text-center"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            <Translate content="Shop by Collections" />
          </h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {collections?.map((collection) => {
              return (
                <div
                  key={collection.id}
                  className="flex flex-col gap-2 text-center transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedCollection(collection);
                    setTab("store", "collection");
                  }}
                >
                  <div className="mx-auto rounded-full w-16 h-16 overflow-hidden">
                    <img
                      src={collection.photo}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3
                    className="font-semibold text-gray-800 group-hover:text-gray-900 text-sm transition-colors"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {collection.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
        {/* Featured Products Section */}
        {featuredProducts && featuredProducts.length > 0 && (
          <div className="bg-white mx-auto px-4 py-12 max-w-7xl">
            <h2
              className="mb-8 font-bold text-gray-900 text-3xl text-center"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              <Translate content="Featured Products" />
            </h2>
            <div className="relative">
              {/* Left Navigation Button */}
              {canScrollFeaturedLeft && (
                <button
                  onClick={scrollFeaturedLeft}
                  className="top-1/2 left-2 z-10 absolute flex justify-center items-center bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 transition-all -translate-y-1/2 duration-200 transform"
                  style={{ backdropFilter: "blur(4px)" }}
                >
                  <Icon
                    icon={allIcons.solid.faChevronLeft}
                    iconClassName="text-gray-600"
                  />
                </button>
              )}
              {/* Right Navigation Button */}
              {canScrollFeaturedRight && (
                <button
                  onClick={scrollFeaturedRight}
                  className="top-1/2 right-2 z-10 absolute flex justify-center items-center bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 transition-all -translate-y-1/2 duration-200 transform"
                  style={{ backdropFilter: "blur(4px)" }}
                >
                  <Icon
                    icon={allIcons.solid.faChevronRight}
                    iconClassName="text-gray-600"
                  />
                </button>
              )}
              <div
                ref={featuredProductsRef}
                className="relative flex items-center gap-4 pb-4 overflow-x-auto scrollbar-hide"
                style={{ scrollBehavior: "smooth" }}
                onScroll={checkFeaturedScrollability}
              >
                {featuredProducts.map((product) => (
                  <div key={product.id} className="flex-shrink-0">
                    <ProductCard product={product} storeId={storeId || ""} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Collection Products Section */}
        <div className="bg-gray-50 py-16">
          <div className="mx-auto px-4 max-w-7xl">
            {collections?.map((collection) => {
              return (
                <CollectionProducts
                  collection={collection}
                  storeId={storeId || ""}
                  key={collection.id}
                />
              );
            })}
          </div>
        </div>
        {/* Offers Section */}
        {offers && offers.length > 0 && (
          <div
            className="py-8"
            style={{
              background: "linear-gradient(to right, #E3F2FD, #BBDEFB)",
            }}
          >
            <div className="mx-auto px-4 max-w-7xl text-center">
              <h2
                className="mb-8 font-bold text-gray-900 text-4xl md:text-5xl tracking-wider"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                🔥 <Translate content="Special Offers" />
              </h2>
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white hover:shadow-lg border border-gray-300 border-solid transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      setSelectedOffer(offer);
                      setTab("store", "offer");
                    }}
                  >
                    <div
                      className="p-6 text-white"
                      style={{
                        background:
                          "linear-gradient(to right, #89CFF0, #5DADE2)",
                      }}
                    >
                      <h3
                        className="mb-2 font-bold text-2xl"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        {offer.name}
                      </h3>
                      <div className="flex justify-center items-center gap-2">
                        <span className="font-bold text-3xl">
                          {offer.price} DA
                        </span>
                        <Icon icon={icons.tag} iconClassName="text-lg" />
                      </div>
                      <p className="opacity-90 mt-2 text-sm">
                        {offer.products?.length || 0}{" "}
                        <Translate content="Products Included" />
                      </p>
                    </div>
                    <div className="p-4">
                      <Button
                        className="py-3 rounded-full w-full font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(to right, #89CFF0, #5DADE2)",
                        }}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation(); // Prevent parent click
                          setSelectedOffer(offer);
                          setTab("store", "offer");
                        }}
                      >
                        <Translate content="View Offer Details" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Footer */}
        <footer className="bg-white border-gray-200 border-t">
          {/* Newsletter Section */}
          <div className="bg-gray-50 py-8">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex md:flex-row flex-col justify-between items-center gap-6">
                <div>
                  <h3
                    className="mb-2 font-bold text-gray-900 text-2xl"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    <Translate content="Stay in the Loop" />
                  </h3>
                  <p
                    className="text-gray-600"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Be the first to know about new arrivals and exclusive offers" />
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-80"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <Button
                    className="px-6 py-3 rounded-lg font-semibold text-white whitespace-nowrap"
                    style={{ backgroundColor: "#89CFF0" }}
                  >
                    <Translate content="Subscribe" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Main Footer Content */}
          <div className="bg-slate-800 py-12 text-white">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
                {/* Brand Column */}
                <div className="lg:col-span-2">
                  <h2
                    className="mb-4 font-bold text-white text-2xl uppercase tracking-wide"
                    style={{ fontFamily: "Oswald, sans-serif" }}
                  >
                    {store?.name || "SnapBuy"}
                  </h2>
                  <p
                    className="mb-6 text-gray-300 leading-relaxed"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Your ultimate online shopping destination. Discover the latest trends in fashion, beauty, and lifestyle." />
                  </p>
                  {/* Contact Information */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <Icon
                        icon={allIcons.solid.faPhone}
                        iconClassName="text-blue-400"
                      />
                      <div>
                        <p
                          className="font-semibold text-white text-sm"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <Translate content="Call Us" />
                        </p>
                        <a
                          href="tel:+213551234567"
                          className="text-gray-300 hover:text-blue-400 transition-colors"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {store?.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon
                        icon={allIcons.solid.faEnvelope}
                        iconClassName="text-blue-400"
                      />
                      <div>
                        <p
                          className="font-semibold text-white text-sm"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <Translate content="Email Us" />
                        </p>
                        <a
                          href="mailto:support@snapbuy.com"
                          className="text-gray-300 hover:text-blue-400 transition-colors"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          support@snapbuy.com
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Social Media Icons */}
                  <div className="flex items-center gap-3">
                    <span
                      className="font-semibold text-white text-sm uppercase tracking-wide"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <Translate content="Follow Us" />
                    </span>
                    <div className="flex space-x-2">
                      {Object.entries(store?.platforms || {}).map(
                        ([platformId, url]) => {
                          const platformIcons: Record<
                            string,
                            IconProps["icon"]
                          > = {
                            facebook: allIcons.brands.faFacebook,
                            instagram: allIcons.brands.faInstagram,
                            x: allIcons.brands.faTwitter,
                            youtube: allIcons.brands.faYoutube,
                            tiktok: allIcons.brands.faTiktok,
                            pinterest: allIcons.brands.faPinterest,
                            linkedin: allIcons.brands.faLinkedin,
                            snapchat: allIcons.brands.faSnapchatGhost,
                          };
                          return (
                            <button
                              key={platformId}
                              onClick={() => {
                                if (url) {
                                  window.open(url, "_blank");
                                }
                              }}
                              className="flex justify-center items-center bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 text-gray-300 hover:text-white transition-all duration-200"
                            >
                              <Icon
                                icon={platformIcons[platformId]}
                                iconClassName="text-lg"
                              />
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={async () => {
                          if (!store?.name) {
                            return;
                          }
                          const uri = new URL(location.origin);
                          uri.pathname = "/client/stores/" + store.id;
                          navigator.share({
                            title: store?.name,
                            url: uri.toString(),
                          });
                        }}
                        className="flex justify-center items-center bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 text-gray-300 hover:text-white transition-all duration-200"
                      >
                        <Icon icon={icons.share} iconClassName="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Shop Column */}
                <div>
                  <h3
                    className="mb-4 font-semibold text-white text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Shop" />
                  </h3>
                  <ul
                    className="space-y-3 text-gray-300"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Women" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Men" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Kids" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Sale" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="New Arrivals" />
                      </a>
                    </li>
                  </ul>
                </div>
                {/* Customer Service Column */}
                <div>
                  <h3
                    className="mb-4 font-semibold text-white text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Customer Service" />
                  </h3>
                  <ul
                    className="space-y-3 text-gray-300"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Contact Us" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Size Guide" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Returns & Exchanges" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Shipping Info" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Track Your Order" />
                      </a>
                    </li>
                  </ul>
                </div>
                {/* About Column */}
                <div>
                  <h3
                    className="mb-4 font-semibold text-white text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="About" />
                  </h3>
                  <ul
                    className="space-y-3 text-gray-300"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="About Us" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Careers" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Press" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Sustainability" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        <Translate content="Gift Cards" />
                      </a>
                    </li>
                  </ul>
                </div>
                {/* App Download Column */}
                {/* <div>
                  <h3
                    className="mb-4 font-semibold text-gray-900 text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="Download App" />
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="#"
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3 bg-black hover:bg-gray-800 px-4 py-2 rounded-lg text-white transition-colors">
                        <Icon
                          icon={allIcons.brands.faApple}
                          iconClassName="text-2xl"
                        />
                        <div>
                          <div className="text-xs">Download on the</div>
                          <div className="font-semibold text-sm">App Store</div>
                        </div>
                      </div>
                    </a>
                    <a
                      href="#"
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3 bg-black hover:bg-gray-800 px-4 py-2 rounded-lg text-white transition-colors">
                        <Icon
                          icon={allIcons.brands.faGooglePlay}
                          iconClassName="text-2xl"
                        />
                        <div>
                          <div className="text-xs">Get it on</div>
                          <div className="font-semibold text-sm">
                            Google Play
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
          {/* Payment Methods Section */}
          <div className="bg-sky-50 py-6">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex md:flex-row flex-col justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <span
                    className="font-semibold text-gray-900 text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Translate content="We Accept" />
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center items-center bg-white px-3 py-2 border border-gray-200 rounded w-12 h-8">
                      <Icon
                        icon={allIcons.brands.faCcVisa}
                        iconClassName="text-blue-600 text-lg"
                      />
                    </div>
                    <div className="flex justify-center items-center bg-white px-3 py-2 border border-gray-200 rounded w-12 h-8">
                      <Icon
                        icon={allIcons.brands.faCcMastercard}
                        iconClassName="text-red-500 text-lg"
                      />
                    </div>
                    <div className="flex justify-center items-center bg-white px-3 py-2 border border-gray-200 rounded w-12 h-8">
                      <Icon
                        icon={allIcons.brands.faCcPaypal}
                        iconClassName="text-blue-500 text-lg"
                      />
                    </div>
                    <div className="flex justify-center items-center bg-white px-3 py-2 border border-gray-200 rounded w-12 h-8">
                      <Icon
                        icon={allIcons.brands.faApplePay}
                        iconClassName="text-gray-800 text-lg"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    <Translate content="Privacy Policy" />
                  </a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    <Translate content="Terms of Service" />
                  </a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    <Translate content="Cookie Policy" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* Copyright Section */}
          <div className="bg-gray-100 py-4">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex md:flex-row flex-col justify-between items-center gap-4">
                <p
                  className="text-gray-600 text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  &copy; 2024 {store?.name || "SnapBuy"}.{" "}
                  <Translate content="All rights reserved." />
                </p>
                <p
                  className="text-gray-600 text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Translate content="Made with" /> ❤️{" "}
                  <Translate content="for fashion lovers" />
                </p>
              </div>
            </div>
          </div>
        </footer>
      </TabContent>
      <TabContent identifier="store" value="searched-products">
        <div className="bg-white min-h-screen">
          {/* Breadcrumb Navigation */}
          <div className="bg-gray-50 py-3 border-gray-200 border-b">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <a
                  onClick={() => {
                    setTab("store", "home");
                  }}
                  className="hover:text-blue-600 transition-colors"
                >
                  <Translate content="Home" />
                </a>
                <Icon
                  icon={allIcons.solid.faChevronRight}
                  iconClassName="text-xs"
                />
                <span
                  className="font-medium text-gray-900"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Translate content="Search Results" />
                </span>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="mx-auto px-4 py-6 max-w-7xl">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1
                  className="mb-2 font-bold text-gray-900 text-3xl"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {store?.name} -{" "}
                  <span
                    className="lowercase"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {searchValue.get}
                  </span>
                </h1>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <span style={{ fontFamily: "Roboto, sans-serif" }}>
                    <Translate content="Showing" /> {filteredProducts.length}{" "}
                    <Translate content="Results" />
                  </span>
                </div>
              </div>
              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <span
                  className="text-gray-600 text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Translate content="Sort by" />
                </span>
                <div ref={sortDropdownRef} className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex justify-between items-center bg-white hover:bg-gray-50 px-4 py-2 border border-gray-300 hover:border-gray-400 focus:border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 text-sm text-left transition-colors"
                  >
                    <span>
                      {sortOptions.find((option) => option.value === sortBy)
                        ?.label || "Recommended"}
                    </span>
                    <Icon
                      icon={
                        showSortDropdown
                          ? allIcons.solid.faChevronUp
                          : allIcons.solid.faChevronDown
                      }
                      iconClassName="text-gray-400 text-xs ml-2 transition-transform duration-200"
                    />
                  </button>
                  <AnimatePresence>
                    {showSortDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="top-full left-0 z-50 absolute bg-white shadow-lg mt-1 border border-gray-200 rounded-lg w-48 overflow-hidden"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                              sortBy === option.value
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{option.label}</span>
                              {sortBy === option.value && (
                                <Icon
                                  icon={allIcons.solid.faCheck}
                                  iconClassName="text-blue-600 text-xs"
                                />
                              )}
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              {/* Sidebar Filters */}
              <aside className="flex-shrink-0 w-64">
                <div className="top-6 sticky bg-white p-6 border border-gray-200 rounded-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <h2 className="mb-4 font-bold text-gray-900 text-lg uppercase">
                    All Filters
                  </h2>
                  {/* Brand Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleFilter("brand")}
                      className="flex justify-between items-center py-2 w-full font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                    >
                      <span>
                        Brand
                        {appliedBrands.length > 0 && (
                          <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-full text-blue-800 text-xs">
                            {appliedBrands.length}
                          </span>
                        )}
                      </span>
                      <Icon
                        icon={
                          expandedFilters.brand
                            ? allIcons.solid.faChevronUp
                            : allIcons.solid.faChevronDown
                        }
                        iconClassName="text-sm transition-transform duration-200"
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFilters.brand && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 mt-3">
                            {brands && brands.length > 0 ? (
                              <>
                                {/* Select All / Clear All controls */}
                                <div className="flex justify-between items-center pb-2 border-gray-200 border-b">
                                  <button
                                    onClick={() =>
                                      setSelectedBrands(
                                        brands.map((b) => b.id!)
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-800 text-xs transition-colors"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    onClick={() => setSelectedBrands([])}
                                    className="text-gray-500 hover:text-gray-700 text-xs transition-colors"
                                  >
                                    Clear All
                                  </button>
                                </div>
                                {brands.map((brand) => {
                                  // Count products for this brand
                                  const productCount =
                                    products?.filter(
                                      (product) => product.brandId === brand.id
                                    ).length || 0;
                                  return (
                                    <label
                                      key={brand.id}
                                      className="flex justify-between items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          className="border-gray-300 rounded"
                                          checked={selectedBrands.includes(
                                            brand.id!
                                          )}
                                          onChange={() =>
                                            toggleBrandFilter(brand.id!)
                                          }
                                        />
                                        <span className="text-gray-700 text-sm">
                                          {brand.name}
                                        </span>
                                      </div>
                                      <span className="text-gray-500 text-xs">
                                        ({productCount})
                                      </span>
                                    </label>
                                  );
                                })}
                              </>
                            ) : (
                              <div className="py-2 text-gray-500 text-sm">
                                No brands available
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Size Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleFilter("size")}
                      className="flex justify-between items-center py-2 w-full font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                    >
                      <span>
                        Size
                        {appliedSizes.length > 0 && (
                          <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-full text-blue-800 text-xs">
                            {appliedSizes.length}
                          </span>
                        )}
                      </span>
                      <Icon
                        icon={
                          expandedFilters.size
                            ? allIcons.solid.faChevronUp
                            : allIcons.solid.faChevronDown
                        }
                        iconClassName="text-sm transition-transform duration-200"
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFilters.size && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="gap-2 grid grid-cols-3 mt-3">
                            {availableSizes.map((size) => (
                              <button
                                key={size}
                                onClick={() => toggleSizeFilter(size)}
                                className={`px-3 py-2 border rounded text-sm text-center transition-colors ${
                                  selectedSizes.includes(size)
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Color Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleFilter("colour")}
                      className="flex justify-between items-center py-2 w-full font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                    >
                      <span>
                        Colour
                        {appliedColors.length > 0 && (
                          <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-full text-blue-800 text-xs">
                            {appliedColors.length}
                          </span>
                        )}
                      </span>
                      <Icon
                        icon={
                          expandedFilters.colour
                            ? allIcons.solid.faChevronUp
                            : allIcons.solid.faChevronDown
                        }
                        iconClassName="text-sm transition-transform duration-200"
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFilters.colour && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="gap-2 grid grid-cols-6 mt-3">
                            {availableColors.map((colorName) => {
                              // Color mapping for common color names
                              const colorMap: Record<string, string> = {
                                red: "#ef4444",
                                blue: "#3b82f6",
                                green: "#10b981",
                                yellow: "#f59e0b",
                                purple: "#8b5cf6",
                                pink: "#ec4899",
                                black: "#000000",
                                white: "#ffffff",
                                gray: "#6b7280",
                                grey: "#6b7280",
                                brown: "#92400e",
                                orange: "#ea580c",
                                teal: "#0d9488",
                                navy: "#1e3a8a",
                                maroon: "#7f1d1d",
                                lime: "#65a30d",
                                cyan: "#0891b2",
                                indigo: "#4338ca",
                              };
                              const colorValue =
                                colorMap[colorName.toLowerCase()] || "#6b7280";
                              const isSelected =
                                selectedColors.includes(colorName);
                              return (
                                <button
                                  key={colorName}
                                  onClick={() => toggleColorFilter(colorName)}
                                  className={`border rounded-full w-8 h-8 transition-all ${
                                    isSelected
                                      ? "border-blue-600 border-2 shadow-lg"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                  style={{ backgroundColor: colorValue }}
                                  title={colorName}
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Price Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleFilter("price")}
                      className="flex justify-between items-center py-2 w-full font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                    >
                      <span>
                        Price
                        {(appliedMinPrice !== "" || appliedMaxPrice !== "") && (
                          <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-full text-blue-800 text-xs">
                            {appliedMinPrice !== "" || appliedMaxPrice !== ""
                              ? "1"
                              : "0"}
                          </span>
                        )}
                      </span>
                      <Icon
                        icon={
                          expandedFilters.price
                            ? allIcons.solid.faChevronUp
                            : allIcons.solid.faChevronDown
                        }
                        iconClassName="text-sm transition-transform duration-200"
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFilters.price && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 mt-3">
                            <div className="gap-2 grid grid-cols-2">
                              <div>
                                <label className="block mb-1 text-gray-600 text-xs">
                                  Min Price (DA)
                                </label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={minPrice}
                                  onChange={(e) =>
                                    setMinPrice(
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                    )
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-gray-600 text-xs">
                                  Max Price (DA)
                                </label>
                                <input
                                  type="number"
                                  placeholder="∞"
                                  value={maxPrice}
                                  onChange={(e) =>
                                    setMaxPrice(
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                    )
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm"
                                />
                              </div>
                            </div>
                            {(minPrice !== "" || maxPrice !== "") && (
                              <button
                                onClick={() => {
                                  setMinPrice("");
                                  setMaxPrice("");
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs transition-colors"
                              >
                                Clear Price Filter
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Delivery Type Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleFilter("delivery")}
                      className="flex justify-between items-center py-2 w-full font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                    >
                      <span>
                        Delivery Type
                        {appliedDeliveryTypes.length > 0 && (
                          <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-full text-blue-800 text-xs">
                            {appliedDeliveryTypes.length}
                          </span>
                        )}
                      </span>
                      <Icon
                        icon={
                          expandedFilters.delivery
                            ? allIcons.solid.faChevronUp
                            : allIcons.solid.faChevronDown
                        }
                        iconClassName="text-sm transition-transform duration-200"
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFilters.delivery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="border-gray-300 rounded"
                                checked={selectedDeliveryTypes.includes("free")}
                                onChange={() => toggleDeliveryFilter("free")}
                              />
                              <span className="text-gray-700 text-sm">
                                Free delivery
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="border-gray-300 rounded"
                                checked={selectedDeliveryTypes.includes(
                                  "express"
                                )}
                                onChange={() => toggleDeliveryFilter("express")}
                              />
                              <span className="text-gray-700 text-sm">
                                Express delivery
                              </span>
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Apply Filter and Clear All Buttons */}
                  <div className="space-y-3 mt-8 pt-6 border-gray-200 border-t">
                    <button
                      onClick={applyFilters}
                      disabled={!hasPendingChanges}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        hasPendingChanges
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Apply Filters
                      {hasPendingChanges && (
                        <span className="opacity-75 ml-2 text-xs">
                          (Changes pending)
                        </span>
                      )}
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="bg-gray-50 hover:bg-gray-100 px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg w-full font-medium text-gray-700 hover:text-gray-900 text-sm transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </aside>
              {/* Products Grid */}
              <main className="flex-1">
                {filteredProducts.length === 0 ? (
                  /* No Results Found */
                  <div className="flex flex-col items-center gap-6 bg-gray-50 p-12 rounded-lg text-center">
                    <div className="bg-white shadow-lg p-8 rounded-full">
                      <Icon
                        icon={allIcons.solid.faSearch}
                        iconClassName="text-6xl text-gray-400"
                      />
                    </div>
                    <div>
                      <h3 className="mb-2 font-bold text-gray-900 text-2xl">
                        <Translate content="No Products Found" />
                      </h3>
                      <p className="text-gray-600 text-lg">
                        <Translate content="Sorry, no products matching" /> "
                        {searchValue.get}"
                      </p>
                      <p className="mt-2 text-gray-500 text-sm">
                        <Translate content="Try adjusting your search terms" />
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        searchValue.set("");
                        setTab("store", "home");
                      }}
                      className="px-8 py-3 rounded font-semibold text-white"
                      style={{ backgroundColor: "#89CFF0" }}
                    >
                      <Icon
                        icon={allIcons.solid.faArrowLeft}
                        iconClassName="mr-2"
                      />
                      <Translate content="Back to Home" />
                    </Button>
                  </div>
                ) : (
                  /* Products Grid */
                  <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <SearchProductCard
                          product={product}
                          storeId={storeId || ""}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </TabContent>
      <TabContent identifier="store" value="collection">
        <div className="bg-white min-h-screen">
          {/* Breadcrumb Navigation */}
          <div className="bg-gray-50 py-3 border-gray-200 border-b">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <a
                  onClick={() => {
                    setTab("store", "home");
                  }}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Home
                </a>
                <Icon
                  icon={allIcons.solid.faChevronRight}
                  iconClassName="text-xs"
                />
                <span className="font-medium text-gray-900">
                  {selectedCollection?.name || (
                    <Translate content="Collection" />
                  )}
                </span>
              </div>
            </div>
          </div>
          {/* Collection Header */}
          <div className="mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center gap-6 mb-8">
              <div className="rounded-full w-24 h-24 overflow-hidden">
                <img
                  src={selectedCollection?.photo}
                  alt={selectedCollection?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="mb-2 font-bold text-gray-900 text-4xl">
                  {selectedCollection?.name}
                </h1>
                <p className="text-gray-600 text-lg">
                  <Translate content="Discover" /> {collectionProducts.length}{" "}
                  <Translate content="amazing products in this collection" />
                </p>
              </div>
            </div>
            {/* Products Grid */}
            {collectionProducts.length === 0 ? (
              /* No Products Found */
              <div className="flex flex-col items-center gap-6 bg-gray-50 p-12 rounded-lg text-center">
                <div className="bg-white shadow-lg p-8 rounded-full">
                  <Icon
                    icon={allIcons.solid.faShoppingBag}
                    iconClassName="text-6xl text-gray-400"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-gray-900 text-2xl">
                    <Translate content="No Products Found" />
                  </h3>
                  <p className="text-gray-600 text-lg">
                    <Translate content="This collection has no products yet" />
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setTab("store", "home");
                  }}
                  className="px-8 py-3 rounded font-semibold text-white"
                  style={{ backgroundColor: "#89CFF0" }}
                >
                  <Icon
                    icon={allIcons.solid.faArrowLeft}
                    iconClassName="mr-2"
                  />
                  Back to Home
                </Button>
              </div>
            ) : (
              /* Products Grid */
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {collectionProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SearchProductCard
                      product={product}
                      storeId={storeId || ""}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabContent>
      <TabContent identifier="store" value="offer">
        <div className="bg-white min-h-screen">
          {/* Breadcrumb Navigation */}
          <div className="bg-gray-50 py-3 border-gray-200 border-b">
            <div className="mx-auto px-4 max-w-7xl">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <a
                  onClick={() => {
                    setTab("store", "home");
                  }}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Home
                </a>
                <Icon
                  icon={allIcons.solid.faChevronRight}
                  iconClassName="text-xs"
                />
                <span className="font-medium text-gray-900">
                  {selectedOffer?.name || <Translate content="Offer" />}
                </span>
              </div>
            </div>
          </div>
          {/* Offer Header */}
          <div className="mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center gap-6 mb-8">
              <div
                className="flex justify-center items-center rounded-full w-24 h-24 font-bold text-white text-2xl"
                style={{
                  background: "linear-gradient(to right, #89CFF0, #5DADE2)",
                }}
              >
                🔥
              </div>
              <div>
                <h1 className="mb-2 font-bold text-gray-900 text-4xl">
                  {selectedOffer?.name}
                </h1>
                <div className="flex items-center gap-4 mb-2">
                  <span
                    className="font-bold text-3xl"
                    style={{ color: "#89CFF0" }}
                  >
                    {selectedOffer?.price} DA
                  </span>
                  <Icon
                    icon={icons.tag}
                    iconClassName="text-2xl text-[#89CFF0]"
                  />
                </div>
                <p className="text-gray-600 text-lg">
                  <Translate content="Special offer including" />{" "}
                  {offerProducts.length}{" "}
                  <Translate content="amazing products" />
                </p>
              </div>
            </div>
            {/* Products Grid */}
            {offerProducts.length === 0 ? (
              /* No Products Found */
              <div className="flex flex-col items-center gap-6 bg-gray-50 p-12 rounded-lg text-center">
                <div className="bg-white shadow-lg p-8 rounded-full">
                  <Icon
                    icon={icons.tag}
                    iconClassName="text-6xl text-gray-400"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-gray-900 text-2xl">
                    <Translate content="No Products Found" />
                  </h3>
                  <p className="text-gray-600 text-lg">
                    <Translate content="This offer has no products yet" />
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setTab("store", "home");
                  }}
                  className="px-8 py-3 rounded font-semibold text-white"
                  style={{ backgroundColor: "#89CFF0" }}
                >
                  <Icon
                    icon={allIcons.solid.faArrowLeft}
                    iconClassName="mr-2"
                  />
                  Back to Home
                </Button>
              </div>
            ) : (
              /* Products Grid */
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {offerProducts.map((product, index) => {
                  // Find the product details from the offer
                  const offerProduct = selectedOffer?.products?.find(
                    (p) => p.prodId === product.id
                  );
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="relative">
                        <SearchProductCard
                          product={product}
                          storeId={storeId || ""}
                        />
                        {/* Offer Badge */}
                        <div className="top-2 right-2 absolute bg-red-500 px-2 py-1 rounded-full font-bold text-white text-xs">
                          Pack: {offerProduct?.count}x
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {/* Offer Summary */}
            {offerProducts.length > 0 && (
              <div className="bg-gray-50 mt-12 p-6 rounded-lg">
                <h3 className="mb-4 font-bold text-gray-900 text-xl">
                  Offer Summary
                </h3>
                <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                  <div className="text-center">
                    <div
                      className="font-bold text-2xl"
                      style={{ color: "#89CFF0" }}
                    >
                      {offerProducts.length}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Products Included
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="font-bold text-2xl"
                      style={{ color: "#89CFF0" }}
                    >
                      {selectedOffer?.products?.reduce(
                        (sum, p) => sum + (p.count || 1),
                        0
                      ) || 0}
                    </div>
                    <div className="text-gray-600 text-sm">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="font-bold text-2xl"
                      style={{ color: "#89CFF0" }}
                    >
                      {selectedOffer?.price} DA
                    </div>
                    <div className="text-gray-600 text-sm">Special Price</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </TabContent>
      <TabContent identifier="store" value="cart">
        <CustomCartView storeId={store?.id || ""} />
      </TabContent>
      <TabContent identifier="store" value="notification-test">
        <div className="bg-gray-50 py-6 min-h-screen">
          <NotificationTester />
        </div>
      </TabContent>
      {/* Floating Notification Tester - Always visible for easy testing */}
      <FloatingNotificationTester />
    </div>
  );
};
