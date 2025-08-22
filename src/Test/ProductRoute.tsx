import { useParams } from "react-router";
import {
  useAsyncMemo,
  useCopyState,
  useAction,
  isLoading,
  execAction,
  showToast,
  useUser,
  getTemp,
  setLightColor,
  setDarkColor,
  setDefaultColor,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi, CreateOrderOptions } from "../apis";
import { useState, useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import { Icon, Translate } from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "../routes/Clients/AddProductToCart";
import { colorsInListWithNames } from "../utils";
import { Nothing } from "@biqpod/app/ui/types";
import { isWeb } from "@biqpod/app/ui/app";
import { getAddressFromCoords } from "../getAddressFromCoords";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { getPrice } from "../utils";
import { initPixels } from "../Links/pixles";
// Custom Loading Component
const LoadingSpinner = () => (
  <div className="inline-block border-2 border-gray-300 border-t-blue-600 rounded-full w-6 h-6 animate-spin"></div>
);
// Custom Checkbox Component
const Checkbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) => (
  <label className="group flex items-center gap-3 cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
          checked
            ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-200"
            : "bg-white border-gray-300 group-hover:border-blue-300 shadow-sm"
        }`}
      >
        {checked && (
          <Icon
            icon={icons.check}
            iconClassName="text-white text-sm animate-in zoom-in duration-200"
          />
        )}
      </div>
    </div>
    <span
      className={`text-sm font-medium transition-colors ${
        checked ? "text-blue-700" : "text-gray-700"
      }`}
    >
      {label}
    </span>
  </label>
);
// Custom Input Field Component
const InputField = ({
  placeholder,
  value,
  onChange,
  type = "text",
  multiLines = false,
  className = "",
  ...props
}: any) => {
  if (multiLines) {
    return (
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`px-4 py-3 border-2 border-gray-200 focus:border-blue-400 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-full text-gray-900 transition-all duration-300 resize-none shadow-sm hover:shadow-md focus:shadow-lg bg-white ${className}`}
        rows={3}
        {...props}
      />
    );
  }
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`px-4 py-3 border-2 border-gray-200 focus:border-blue-400 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-full text-gray-900 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg bg-white ${className}`}
      {...props}
    />
  );
};
// Custom Button Component - matching index.tsx style
const Button = ({
  children,
  className,
  style,
  onClick,
  disabled,
  ...props
}: any) => (
  <button
    className={`px-4 py-2 font-medium transition-all duration-200 ${
      className || ""
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    style={style}
    onClick={onClick}
    disabled={disabled}
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
  location: allIcons.solid.faLocationDot,
  plus: allIcons.solid.faPlus,
  minus: allIcons.solid.faMinus,
  check: allIcons.solid.faCheck,
  times: allIcons.solid.faXmark,
  chevronLeft: allIcons.solid.faChevronLeft,
  chevronRight: allIcons.solid.faChevronRight,
  truck: allIcons.solid.faTruck,
  shield: allIcons.solid.faShield,
  returnIcon: allIcons.solid.faUndo,
};
// Product Image Gallery Component with Auto-Sliding
const ProductImageGallery = ({ photos }: { photos: string[] }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const hasMultiplePhotos = photos.length > 1;
  // Auto-slide photos every 4 seconds
  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) =>
        prevIndex === photos.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [photos.length, hasMultiplePhotos]);
  const nextPhoto = () => {
    setCurrentPhotoIndex((prevIndex) =>
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    );
  };
  const prevPhoto = () => {
    setCurrentPhotoIndex((prevIndex) =>
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
  };
  if (photos.length === 0) {
    return (
      <div className="flex justify-center items-center bg-gray-200 w-full h-96">
        <Icon icon={icons.image} iconClassName="text-6xl text-gray-400" />
      </div>
    );
  }
  return (
    <div className="relative bg-white w-full h-96 overflow-hidden">
      {/* Main Image Container */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out cursor-pointer"
        style={{
          width: `${photos.length * 100}%`,
          transform: `translateX(-${
            currentPhotoIndex * (100 / photos.length)
          }%)`,
        }}
        onClick={() => setIsZoomed(!isZoomed)}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full"
            style={{ width: `${100 / photos.length}%` }}
          >
            <img
              src={photo}
              alt={`Product image ${index + 1}`}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                isZoomed ? "scale-110" : "hover:scale-105"
              }`}
            />
          </div>
        ))}
      </div>
      {/* Navigation Arrows */}
      {hasMultiplePhotos && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            className="top-1/2 left-4 absolute flex justify-center items-center bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 transition-all -translate-y-1/2 duration-200 transform"
          >
            <Icon icon={icons.chevronLeft} iconClassName="text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            className="top-1/2 right-4 absolute flex justify-center items-center bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 transition-all -translate-y-1/2 duration-200 transform"
          >
            <Icon icon={icons.chevronRight} iconClassName="text-gray-600" />
          </button>
        </>
      )}
      {/* Photo Counter */}
      {hasMultiplePhotos && (
        <div className="top-4 right-4 absolute bg-black/50 px-3 py-1 rounded-full text-white text-sm">
          {currentPhotoIndex + 1}/{photos.length}
        </div>
      )}
      {/* Thumbnail Navigation */}
      {hasMultiplePhotos && (
        <div className="bottom-4 left-1/2 absolute flex space-x-2 -translate-x-1/2 transform">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhotoIndex(index);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentPhotoIndex === index
                  ? "bg-white"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
// Quantity Selector Component
const QuantitySelector = ({
  count,
  setCount,
}: {
  count: any;
  setCount: any;
}) => {
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner p-3 border border-gray-200 rounded-2xl">
      <button
        onClick={() => setCount(Math.max(1, (count.get || 1) - 1))}
        className="group flex justify-center items-center bg-white hover:bg-red-50 shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-red-300 rounded-full w-12 h-12 hover:scale-105 active:scale-95 transition-all duration-300 transform"
      >
        <Icon
          icon={icons.minus}
          iconClassName="text-gray-600 group-hover:text-red-500 transition-colors text-lg"
        />
      </button>
      <div className="flex-1 bg-white shadow-sm px-4 py-2 border-2 border-gray-200 rounded-xl text-center">
        <input
          type="number"
          min="1"
          max="500"
          value={count.get || 1}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setCount(1);
              return;
            }
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 1) {
              setCount(1);
              return;
            }
            const newValue = Math.min(500, numValue);
            setCount(newValue);
          }}
          placeholder="1"
          className="bg-transparent border-none focus:outline-none w-full font-bold text-gray-800 text-2xl text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
        />
        <div className="font-medium text-gray-500 text-xs">
          <Translate content="quantity caps" />
        </div>
      </div>
      <button
        onClick={() => setCount(Math.min(500, (count.get || 0) + 1))}
        className="group flex justify-center items-center bg-white hover:bg-green-50 shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-green-300 rounded-full w-12 h-12 hover:scale-105 active:scale-95 transition-all duration-300 transform"
      >
        <Icon
          icon={icons.plus}
          iconClassName="text-gray-600 group-hover:text-green-500 transition-colors text-lg"
        />
      </button>
    </div>
  );
};
// Form Field Component
const FormField = ({
  label,
  placeholder,
  multiLines = false,
  maxLength,
  inputMode,
  value,
  onChange,
}: any) => {
  return (
    <div className="space-y-3">
      <label className="block font-semibold text-gray-800 text-sm uppercase tracking-wide">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>
      <div className="relative">
        <InputField
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          multiLines={multiLines}
          maxLength={maxLength}
          inputMode={inputMode}
          type={inputMode === "numeric" ? "tel" : "text"}
        />
        {/* Input Focus Ring Effect */}
        <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 rounded-xl transition-all duration-300 pointer-events-none"></div>
      </div>
      {maxLength && value && (
        <div className="flex justify-end text-gray-400 text-xs">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};
export const ProductRoute = () => {
  const prodId = useParams<{ prodId: string }>().prodId;
  const [isFavorite, setIsFavorite] = useState(false);
  const count = useCopyState(1);
  const deliveryState = useCopyState<boolean | null>(false);
  const latitude = useCopyState<Nothing | number>(null);
  const longitude = useCopyState<Nothing | number>(null);
  // Form state
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const product = useAsyncMemo(async () => {
    return await snapbuyApi.getProduct(prodId);
  }, [prodId]);
  const { getColor } = useSearchParams();
  useEffect(() => {
    for (const colorItem of colorsInListWithNames) {
      const colorId = colorItem.colorId;
      const color = getColor(colorId);
      if (color) {
        setDarkColor(colorId, color);
        setLightColor(colorId, color);
        setDefaultColor(colorId, color);
      }
    }
  }, [getColor]);
  const store = useAsyncMemo(async () => {
    if (!product?.storeId) return undefined;
    return snapbuyApi.getStore(product?.storeId!);
  }, [product]);
  const price = useMemo(() => {
    return getPrice(product, 1).total;
  }, [product]);
  const pixels = initPixels(store);
  const user = useUser();
  const formStructor: any[] = []; // Removed forms functionality
  useEffect(() => {
    pixels?.view(product);
  }, [pixels, product]);
  useEffect(() => {
    setFirstname(user?.firstname || "");
    setLastname(user?.lastname || "");
    const phoneNumber = user?.phone || localStorage.getItem("phone") || "";
    setPhone(phoneNumber);
  }, [user]);
  useEffect(() => {
    if (count.get === 0) {
      count.set(1);
    }
  }, [count.get]);
  // Auto-detect location action
  const locationAction = useAction(
    "auto-detect-location-in-product",
    () => {
      return new Promise(async (resolve, reject) => {
        try {
          if (isWeb) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude: lat, longitude: lon } = position.coords;
                const { fullAddress, wilaya: detectedWilaya } =
                  await getAddressFromCoords(lat, lon);
                latitude.set(lat);
                longitude.set(lon);
                setWilaya(detectedWilaya);
                setAddress(fullAddress);
                resolve(true);
              },
              (error) => {
                showToast("Geolocation error: " + error.message, "error");
                reject(new Error("Geolocation error: " + error.message));
              }
            );
          } else {
            let permStatus: PermissionStatus =
              await Geolocation.checkPermissions();
            if (permStatus.location !== "granted") {
              permStatus = await Geolocation.requestPermissions();
              if (permStatus.location !== "granted") {
                showToast("Location permission denied", "error");
                return reject(new Error("Location permission denied"));
              }
            }
            const position = await Geolocation.getCurrentPosition();
            const { latitude: lat, longitude: lon } = position.coords;
            const { fullAddress, wilaya: detectedWilaya } =
              await getAddressFromCoords(lat, lon);
            latitude.set(lat);
            longitude.set(lon);
            setWilaya(detectedWilaya);
            setAddress(fullAddress);
            resolve(true);
          }
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );
  const loadingLocation = isLoading(locationAction);
  const magic = getTemp<Record<string, any>>("magic-fields");
  // Create order action
  const createOrderAction = useAction(
    "create-order-in-product",
    async () => {
      if (!product) {
        showToast("Product not found", "error");
        return;
      }
      if (!firstname) {
        showToast("Enter Your First Name", "info");
        return;
      }
      if (!lastname) {
        showToast("Enter Your Last Name", "info");
        return;
      }
      if (!phone) {
        showToast("Enter Your Phone Number", "info");
        return;
      }
      if (!address) {
        showToast("Enter Your Address", "info");
        return;
      }
      if (!wilaya) {
        showToast("Enter Your Wilaya", "info");
        return;
      }
      // Basic phone validation
      if (phone.length !== 10 || !/^\d+$/.test(phone)) {
        showToast("Enter Valid Phone Number", "info");
        return;
      }
      const products: SnapBuy.Order["products"] = {
        [product?.id!]: {
          count: count.get || 1,
        },
      };
      localStorage.setItem("phone", phone);
      const place: SnapBuy.Client["place"] = {
        address,
        wilaya,
      };
      if (latitude.get) {
        place.latitude = latitude.get;
      }
      if (longitude.get) {
        place.longitude = longitude.get;
      }
      const metaData: Record<string, any> = {};
      formStructor?.forEach((formId) => {
        metaData[formId.id] = magic?.[formId.id];
      });
      const options: CreateOrderOptions = {
        products,
        client: {
          firstname,
          lastname,
          phone,
          id: crypto.randomUUID(),
          place,
        },
        delivery: deliveryState.get || false,
        metaData,
      };
      const orderInfo = await snapbuyApi.createOrder(options);
      if (!orderInfo?.id) {
        throw "Order Info Incorrect";
      }
      const order = await snapbuyApi.getOrder(orderInfo.id);
      if (order) {
        pixels?.purchase(order);
      }
      showToast("Order Created", "success");
    },
    [
      product,
      firstname,
      lastname,
      phone,
      address,
      wilaya,
      deliveryState.get,
      latitude.get,
      longitude.get,
      formStructor,
      count.get,
      magic,
    ]
  );
  const loadingOrder = isLoading(createOrderAction);
  if (!product) {
    return (
      <div className="flex justify-center items-center bg-gray-50 min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <Icon icon={icons.chevronLeft} iconClassName="text-xl" />
              </button>
              <h1
                className="font-bold text-gray-900 text-xl"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Product Details
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <Icon
                  icon={
                    isFavorite
                      ? allIcons.solid.faHeart
                      : allIcons.regular.faHeart
                  }
                  iconClassName={`text-xl ${
                    isFavorite ? "text-red-500" : "text-gray-600"
                  }`}
                />
              </button>
              <button className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                <Icon
                  icon={icons.share}
                  iconClassName="text-xl text-gray-600"
                />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="gap-8 grid lg:grid-cols-2">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow-lg rounded-xl overflow-hidden"
          >
            <ProductImageGallery photos={product.photos || []} />
          </motion.div>
          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Product Title and Price */}
            <div className="bg-white shadow-lg p-6 rounded-xl">
              <h1
                className="mb-4 font-bold text-gray-900 text-3xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {product.name}
              </h1>
              <div className="flex justify-between items-center mb-4">
                <span
                  className="font-bold text-3xl"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    color: "#89CFF0",
                  }}
                >
                  {price} DA
                </span>
                {product.limited && (
                  <span className="bg-red-500 px-3 py-1 rounded-full font-bold text-white text-sm">
                    LIMITED
                  </span>
                )}
              </div>
              {/* Product Features */}
              <div className="gap-4 grid grid-cols-3 mb-6">
                <div className="flex items-center gap-2 text-green-600">
                  <Icon icon={icons.truck} iconClassName="text-sm" />
                  <span className="text-sm">
                    <Translate content="free delivery" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Icon icon={icons.shield} iconClassName="text-sm" />
                  <span className="text-sm">
                    <Translate content="secure" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <Icon icon={icons.returnIcon} iconClassName="text-sm" />
                  <span className="text-sm">
                    <Translate content="easy returns" />
                  </span>
                </div>
              </div>
              {/* Quantity and Delivery */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    Quantity
                  </label>
                  <QuantitySelector count={count} setCount={count.set} />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={deliveryState.get || false}
                    onChange={(checked) => deliveryState.set(checked)}
                    label="Delivery"
                  />
                </div>
              </div>
            </div>
            {/* Order Form */}
            <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl p-8 border border-gray-100 rounded-2xl">
              <h3
                className="flex items-center gap-3 mb-8 font-bold text-gray-900 text-2xl"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Icon icon={icons.user} iconClassName="text-blue-600 text-lg" />
                Order Information
              </h3>
              <div className="space-y-6">
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <FormField
                    label="First Name"
                    placeholder="Enter Your First Name"
                    value={firstname}
                    onChange={(e: any) => setFirstname(e.target.value)}
                    maxLength={40}
                  />
                  <FormField
                    label="Last Name"
                    placeholder="Enter Your Last Name"
                    value={lastname}
                    onChange={(e: any) => setLastname(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <FormField
                  label="Phone Number"
                  placeholder="0123456789"
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  inputMode="numeric"
                  maxLength={10}
                />
                <FormField
                  label="Address"
                  placeholder="Enter your full address..."
                  value={address}
                  onChange={(e: any) => setAddress(e.target.value)}
                  multiLines={true}
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormField
                      label="Wilaya"
                      placeholder="Select your wilaya"
                      value={wilaya}
                      onChange={(e: any) => setWilaya(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="flex items-center gap-3 bg-gradient-to-r from-blue-500 hover:from-blue-600 to-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl px-6 py-4 rounded-2xl font-semibold text-white hover:scale-105 active:scale-95 transition-all duration-300 transform"
                      onClick={() =>
                        execAction("auto-detect-location-in-product")
                      }
                      disabled={loadingLocation}
                    >
                      <Icon
                        icon={
                          loadingLocation
                            ? allIcons.solid.faCircleNotch
                            : icons.location
                        }
                        iconClassName={tw(
                          "text-lg",
                          loadingLocation && "animate-spin"
                        )}
                      />
                      <span className="font-bold text-sm tracking-wide">
                        {loadingLocation ? "DETECTING..." : "AUTO DETECT"}
                      </span>
                    </Button>
                  </div>
                </div>
                {Boolean(address && wilaya) && (
                  <Button
                    className="flex items-center gap-3 bg-gradient-to-r from-gray-100 hover:from-red-50 to-gray-200 hover:to-red-100 px-4 py-3 border-2 border-gray-200 hover:border-red-200 rounded-xl font-medium text-gray-600 hover:text-red-600 transition-all duration-300"
                    onClick={() => {
                      setWilaya("");
                      setAddress("");
                    }}
                  >
                    <Icon icon={icons.times} iconClassName="text-sm" />
                    <span className="font-semibold text-sm">
                      Clear Location
                    </span>
                  </Button>
                )}
                {/* Custom Form Fields - Removed for simplicity */}
              </div>
            </div>
            {/* Order Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                className="flex justify-center items-center gap-3 bg-gradient-to-r from-blue-500 hover:from-blue-600 to-blue-600 hover:to-blue-700 shadow-lg py-4 rounded-xl w-full font-bold text-white text-lg hover:scale-105 transition-all duration-200 transform"
                onClick={() => execAction("create-order-in-product")}
                disabled={loadingOrder}
              >
                {loadingOrder ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Icon icon={icons.shoppingBag} iconClassName="text-xl" />
                    <span>Create Order - {price} DA</span>
                    <Icon icon={icons.chevronRight} iconClassName="text-lg" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
        {/* Product Description */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white shadow-lg mt-8 p-6 rounded-xl"
        >
          <h3
            className="mb-4 font-bold text-gray-900 text-xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Product Description
          </h3>
          <Line />
          <div className="mt-4">
            <div className="max-w-none prose prose-gray">
              {product?.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {product.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  <Translate content="no description found" />
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Loading Overlay */}
      <AnimatePresence>
        {loadingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50"
          >
            <div className="bg-white shadow-2xl p-8 rounded-xl text-center">
              <LoadingSpinner />
              <p className="mt-4 font-medium text-gray-700">
                Creating your order...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
