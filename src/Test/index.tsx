import { useParams } from "react-router";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useState, useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import { Icon } from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
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
const Line = () => <hr className="my-4 border-gray-300" />;
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
        <Button className="bg-rose-600 hover:bg-rose-700 px-6 py-2 rounded-full font-medium text-white">
          View All
        </Button>
      </div>
      <div
        className="relative flex items-center gap-4 pb-4 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {collectionProducts.map((product) => (
          <div key={product.id} className="flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
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
            className="font-bold text-rose-600 text-xl"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {product.type === "single"
              ? `${product.single?.price || 0} DA`
              : `From ${Math.min(
                  ...(product.multiple?.prices?.map((p: any) => p.price) || [0])
                )} DA`}
          </span>
          <Button className="bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-full w-fit text-white text-sm">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};
export const Test = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
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
  // Fetch offers/packs for this store
  const offers = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.getPacks(storeId);
  }, [storeId]);
  // Get featured products (first 8 products)
  const featuredProducts = useMemo(() => {
    return products?.slice(0, 8) || [];
  }, [products]);
  // Color gradients for collections
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Offers Banner - Show if there are offers */}
      {offers && offers.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 py-3">
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
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                WOMEN
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                CLOTHING
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                SHOES
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                ACCESSORIES
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                BAGS
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                SPORTS
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                NEW ARRIVALS
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                PREMIUM
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                SALE
              </a>
              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                BRANDS
              </a>
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
                    type="text"
                    placeholder="Search"
                    className="px-4 py-3 pr-12 rounded-lg ring-2 ring-gray-400 focus:ring-rose-500 w-full text-lg"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    autoFocus
                  />
                  <button
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2 transform"
                    onClick={() => {
                      // Handle search functionality here
                      console.log("Search clicked");
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
              <span className="text-rose-600">FINAL CALL</span>
            </h2>
            <p
              className="mb-6 text-white text-xl"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              This Season's Best
            </p>
            <Button
              className="bg-rose-600 hover:bg-rose-700 px-8 py-3 rounded-none font-medium text-white text-lg tracking-wide"
              style={{ fontFamily: "Montserrat, sans-serif" }}
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
          <div className="flex justify-center items-center bg-gradient-to-l from-rose-200/30 to-transparent h-full">
            <div className="flex justify-center items-center bg-white/90 shadow-2xl rounded-full w-80 h-80">
              <Icon icon={icons.user} iconClassName="text-6xl text-rose-600" />
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
          <div
            className="relative flex items-center gap-4 pb-4 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Collection Products Section */}
      {
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
      }
      {/* Offers Section */}
      {offers && offers.length > 0 && (
        <div className="bg-gradient-to-r from-orange-100 to-red-100 py-8">
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
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
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
                    <Button className="bg-gradient-to-r from-red-500 hover:from-red-600 to-orange-500 hover:to-orange-600 py-3 rounded-full w-full font-semibold text-white">
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
              <div className="flex space-x-4">
                <Button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full">
                  <Icon icon={icons.globe} />
                </Button>
                <Button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full">
                  <Icon icon={icons.camera} />
                </Button>
                <Button
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
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
                >
                  <Icon icon={icons.share} />
                </Button>
              </div>
            </div>
          </div>
          <Line />
          <div
            className="text-gray-400 text-center"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <p>&copy; 2024 {store?.name || "SnapBuy"}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
