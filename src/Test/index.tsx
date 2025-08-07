import { useParams } from "react-router";
import {
  getTab,
  setTab,
  setTemp,
  useAsyncMemo,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useState, useEffect, useMemo, useRef } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  CircleTip,
  Icon,
  IconProps,
  TabContent,
  Translate,
} from "@biqpod/app/ui/components";
import { fuzzySearch, tw } from "@biqpod/app/ui/utils";
import { motion, AnimatePresence } from "framer-motion";
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
};
interface CollectionProductsProps {
  collection: SnapBuy.Collection;
}
const CollectionProducts = ({ collection }: CollectionProductsProps) => {
  const collectionProducts = useAsyncMemo(async () => {
    if (!collection.id) return null;
    return snapbuyApi.getProductsOfCollection(collection.id);
  }, [collection.id]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };
  useEffect(() => {
    checkScrollability();
  }, [collectionProducts]);
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320, // Width of one product card + gap
        behavior: "smooth",
      });
      // Check scrollability after animation
      setTimeout(checkScrollability, 300);
    }
  };
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320, // Width of one product card + gap
        behavior: "smooth",
      });
      // Check scrollability after animation
      setTimeout(checkScrollability, 300);
    }
  };
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
          className="px-6 py-2 rounded-full font-medium text-white"
          style={{ backgroundColor: "#89CFF0" }}
        >
          View All
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
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// Product Card Component with Auto-Sliding Photos
const ProductCard = ({ product }: { product: SnapBuy.Product }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const photos = product.photos || [];
  const hasMultiplePhotos = photos.length > 1;
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
            LIMITED
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
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {product.name}
        </h3>
        <div className="flex justify-between items-center">
          <span
            className="font-bold text-xl"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#89CFF0" }}
          >
            {product.type === "single"
              ? `${product.single?.price || 0} DA`
              : `From ${Math.min(
                  ...(product.multiple?.prices?.map((p: any) => p.price) || [0])
                )} DA`}
          </span>
          <Button
            className="px-4 py-2 rounded-full w-fit text-white text-sm"
            style={{ backgroundColor: "#89CFF0" }}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};
// Search Results Product Card Component - Namshi-style compact layout
const SearchProductCard = ({ product }: { product: SnapBuy.Product }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const photos = product.photos || [];
  return (
    <div className="group flex flex-col bg-gray-50 border border-gray-200 border-solid rounded-lg w-full overflow-hidden transition-all duration-300 cursor-pointer">
      <div className="relative">
        {photos.length > 0 ? (
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={photos[0]}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            {/* Photo Count Badge */}
            {photos.length > 1 && (
              <div className="top-2 left-2 absolute bg-black/70 px-2 py-1 rounded text-white text-xs">
                +{photos.length - 1} more
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
            <Translate content="limited" />
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
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            SnapBuy
          </span>
        </div>
        {/* Product Name */}
        <h3 className="mb-2 font-medium text-gray-900 group-hover:text-blue-600 text-sm line-clamp-2 transition-colors duration-200">
          {product.name}
        </h3>
        {/* Price */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-bold text-gray-900 text-base">
            {product.type === "single"
              ? `${product.single?.price || 0} DA`
              : `${Math.min(
                  ...(product.multiple?.prices?.map((p: any) => p.price) || [0])
                )} DA`}
          </span>
        </div>
        {/* Free Delivery Badge */}
        <div className="flex items-center gap-1 mb-2 text-green-600 text-xs">
          <Icon icon={allIcons.solid.faTruck} iconClassName="text-xs" />
          <span>Free delivery</span>
        </div>
        {/* Action Button */}
        <Button
          className="px-3 py-1.5 rounded w-full font-medium text-white text-xs transition-colors duration-200"
          style={{ backgroundColor: "#89CFF0" }}
        >
          GET IT TOMORROW
        </Button>
      </div>
    </div>
  );
};
export const Test = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  // Filter expansion states
  const [expandedFilters, setExpandedFilters] = useState<{
    [key: string]: boolean;
  }>({
    brand: false,
    category: false,
    size: false,
    colour: false,
    price: false,
    discount: false,
    delivery: false,
  });

  // Applied filters (these are used for actual filtering)
  const [appliedBrands, setAppliedBrands] = useState<string[]>([]);
  const [appliedSizes, setAppliedSizes] = useState<string[]>([]);
  const [appliedColors, setAppliedColors] = useState<string[]>([]);
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | "">("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | "">("");
  const [appliedDiscounts, setAppliedDiscounts] = useState<string[]>([]);
  const [appliedDeliveryTypes, setAppliedDeliveryTypes] = useState<string[]>(
    []
  );

  // Pending filters (these are modified in the UI but not yet applied)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
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
    setAppliedDiscounts(selectedDiscounts);
    setAppliedDeliveryTypes(selectedDeliveryTypes);
  };

  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedDiscounts([]);
    setSelectedDeliveryTypes([]);
    setAppliedBrands([]);
    setAppliedSizes([]);
    setAppliedColors([]);
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setAppliedDiscounts([]);
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
      JSON.stringify(selectedDiscounts) !== JSON.stringify(appliedDiscounts) ||
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
    selectedDiscounts,
    appliedDiscounts,
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

  const toggleDiscountFilter = (discount: string) => {
    setSelectedDiscounts((prev) =>
      prev.includes(discount)
        ? prev.filter((d) => d !== discount)
        : [...prev, discount]
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
  const [canScrollFeaturedLeft, setCanScrollFeaturedLeft] = useState(false);
  const [canScrollFeaturedRight, setCanScrollFeaturedRight] = useState(true);
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

    // Filter by size (from product.metaData.sizes)
    if (appliedSizes.length > 0) {
      filtered = filtered.filter((product) => {
        const productSizes = product.metaData?.sizes;
        if (!productSizes || typeof productSizes !== "object") return false;
        if (Array.isArray(productSizes)) {
          return appliedSizes.some((size) =>
            (productSizes as string[]).includes(size)
          );
        }
        return false;
      });
    }

    // Filter by color (from product.metaData.colors)
    if (appliedColors.length > 0) {
      filtered = filtered.filter((product) => {
        const productColors = product.metaData?.colors;
        if (!productColors || typeof productColors !== "object") return false;
        if (Array.isArray(productColors)) {
          return appliedColors.some((color) =>
            (productColors as string[]).some((productColor: string) =>
              productColor.toLowerCase().includes(color.toLowerCase())
            )
          );
        }
        return false;
      });
    }

    // Filter by price range (min/max)
    if (appliedMinPrice !== "" || appliedMaxPrice !== "") {
      filtered = filtered.filter((product) => {
        const price =
          product.type === "single"
            ? product.single?.price || 0
            : Math.min(
                ...(product.multiple?.prices?.map((p: any) => p.price) || [0])
              );

        const min = appliedMinPrice === "" ? 0 : Number(appliedMinPrice);
        const max = appliedMaxPrice === "" ? Infinity : Number(appliedMaxPrice);

        return price >= min && price <= max;
      });
    }

    // Filter by discount (checking if product has discount in metaData or other fields)
    if (appliedDiscounts.length > 0) {
      filtered = filtered.filter((product) => {
        // Try to get discount from metaData or assume 0 if not available
        const discount = (product.metaData as any)?.discount || 0;
        return appliedDiscounts.some((discountRange) => {
          switch (discountRange) {
            case "10% and above":
              return discount >= 10;
            case "20% and above":
              return discount >= 20;
            case "30% and above":
              return discount >= 30;
            case "50% and above":
              return discount >= 50;
            default:
              return false;
          }
        });
      });
    }

    // Filter by delivery type (assuming all products have free delivery for now)
    if (appliedDeliveryTypes.length > 0) {
      // For now, all products are considered to have both free and express delivery
      // This could be enhanced with actual delivery data from the product
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
    appliedDiscounts,
    appliedDeliveryTypes,
  ]);

  // Get unique sizes and colors from all products for filter options
  const availableSizes = useMemo(() => {
    if (!products) return [];
    const sizes = new Set<string>();
    products.forEach((product) => {
      const productSizes = product.metaData?.sizes;
      if (productSizes && Array.isArray(productSizes)) {
        (productSizes as string[]).forEach((size: string) => sizes.add(size));
      }
    });
    return Array.from(sizes).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    if (!products) return [];
    const colors = new Set<string>();
    products.forEach((product) => {
      const productColors = product.metaData?.colors;
      if (productColors && Array.isArray(productColors)) {
        (productColors as string[]).forEach((color: string) =>
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
        <header className="bg-white shadow-sm border-b">
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
                      placeholder="Search"
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
                      Cancel
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
                      ALL
                    </button>
                    <button className="pb-2 border-gray-900 border-b-2 font-medium text-gray-900">
                      WOMEN
                    </button>
                    <button className="pb-2 hover:border-gray-300 border-transparent border-b-2 font-medium text-gray-600 hover:text-gray-900">
                      MEN
                    </button>
                    <button className="pb-2 hover:border-gray-300 border-transparent border-b-2 font-medium text-gray-600 hover:text-gray-900">
                      KIDS
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
                    TRENDING SEARCHES
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
                          console.log("Trending search:", term);
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
                SUMMER
                <br />
                <span style={{ color: "#89CFF0" }}>FINAL CALL</span>
              </h2>
              <p
                className="mb-6 text-white text-xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                This Season's Best
              </p>
              <Button
                className="px-8 py-3 rounded-none font-medium text-white text-lg tracking-wide"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  backgroundColor: "#89CFF0",
                }}
              >
                SHOP NOW
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
        {/* Collections Section */}
        <div className="mx-auto px-4 py-12 max-w-7xl">
          <h2
            className="mb-8 font-bold text-gray-900 text-3xl text-center"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Shop by Collections
          </h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {collections?.map((collection) => {
              return (
                <div
                  key={collection.id}
                  className="flex flex-col gap-2 text-center"
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
              Featured Products
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
                    <ProductCard product={product} />
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
                🔥 SPECIAL OFFERS
              </h2>
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white border border-gray-300 border-solid"
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
                        {offer.products?.length || 0} Products included
                      </p>
                    </div>
                    <div className="p-4">
                      <Button
                        className="py-3 rounded-full w-full font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(to right, #89CFF0, #5DADE2)",
                        }}
                      >
                        View Offer Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Footer */}
        <footer className="bg-gray-900 py-12 text-white">
          <div className="flex flex-col gap-5 mx-auto px-4 max-w-7xl">
            <div className="gap-8 grid grid-cols-1 md:grid-cols-4">
              <div>
                <h3
                  className="mb-4 font-semibold text-lg"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Shop
                </h3>
                <ul
                  className="space-y-2 text-gray-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Women
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Men
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Kids
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Sale
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3
                  className="mb-4 font-semibold text-lg"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Help
                </h3>
                <ul
                  className="space-y-2 text-gray-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Customer Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Size Guide
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Returns
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Track Order
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3
                  className="mb-4 font-semibold text-lg"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  About
                </h3>
                <ul
                  className="space-y-2 text-gray-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Our Story
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Press
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Sustainability
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3
                  className="mb-4 font-semibold text-lg"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Connect
                </h3>
                <div className="flex space-x-1">
                  {Object.entries(store?.platforms || {}).map(
                    ([platformId, url]) => {
                      const platformIcons: Record<string, IconProps["icon"]> = {
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
                        <CircleTip
                          key={platformId}
                          icon={platformIcons[platformId]}
                          onClick={() => {
                            if (url) {
                              window.open(url, "_blank");
                            }
                          }}
                        />
                      );
                    }
                  )}
                  <CircleTip
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
                  >
                    <Icon icon={icons.share} />
                  </CircleTip>
                </div>
              </div>
            </div>
            <Line />
            <div
              className="text-gray-400 text-center"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <p>
                &copy; 2024 {store?.name || "SnapBuy"}. All rights reserved.
              </p>
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
                  Home
                </a>
                <Icon
                  icon={allIcons.solid.faChevronRight}
                  iconClassName="text-xs"
                />
                <span className="font-medium text-gray-900">
                  Search Results
                </span>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="mx-auto px-4 py-6 max-w-7xl">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="mb-2 font-bold text-gray-900 text-3xl">
                  {store?.name} -{" "}
                  <span className="lowercase">{searchValue.get}</span>
                </h1>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <span>Showing {filteredProducts.length} Results</span>
                </div>
              </div>
              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">Sort By</span>
                <select className="bg-white px-3 py-2 border border-gray-300 focus:border-blue-500 rounded focus:outline-none text-sm">
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                  <option>Customer Rating</option>
                </select>
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
                  {/* Discount Filter */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleFilter("discount")}
                      className="flex justify-between items-center py-2 w-full font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                    >
                      <span>
                        Discount
                        {appliedDiscounts.length > 0 && (
                          <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-full text-blue-800 text-xs">
                            {appliedDiscounts.length}
                          </span>
                        )}
                      </span>
                      <Icon
                        icon={
                          expandedFilters.discount
                            ? allIcons.solid.faChevronUp
                            : allIcons.solid.faChevronDown
                        }
                        iconClassName="text-sm transition-transform duration-200"
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFilters.discount && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 mt-3">
                            {[
                              "10% and above",
                              "20% and above",
                              "30% and above",
                              "50% and above",
                            ].map((discount) => (
                              <label
                                key={discount}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="border-gray-300 rounded"
                                  checked={selectedDiscounts.includes(discount)}
                                  onChange={() =>
                                    toggleDiscountFilter(discount)
                                  }
                                />
                                <span className="text-gray-700 text-sm">
                                  {discount}
                                </span>
                              </label>
                            ))}
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
                        No products found
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Sorry, we couldn't find any products matching "
                        {searchValue.get}"
                      </p>
                      <p className="mt-2 text-gray-500 text-sm">
                        Try adjusting your search terms or filters
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
                      Back to Home
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
                        <SearchProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                )}
                {/* Pagination (if needed) */}
                {filteredProducts.length > 0 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button className="hover:bg-gray-100 px-3 py-2 border border-gray-300 rounded text-gray-600 transition-colors">
                      <Icon icon={allIcons.solid.faChevronLeft} />
                    </button>
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button
                        key={page}
                        className={`px-3 py-2 border rounded transition-colors ${
                          page === 1
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button className="hover:bg-gray-100 px-3 py-2 border border-gray-300 rounded text-gray-600 transition-colors">
                      <Icon icon={allIcons.solid.faChevronRight} />
                    </button>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </TabContent>
    </div>
  );
};
