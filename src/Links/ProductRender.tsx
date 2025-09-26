import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Icon,
  Translate,
  Line,
  Key,
  BooleanField,
} from "@biqpod/app/ui/components";
import {
  showBottomSheet,
  getFieldValue,
  useAsyncMemo,
  showPopup,
  setTemp,
  useDeviceResolution,
  getTemp,
} from "@biqpod/app/ui/hooks";
import { delay, tw } from "@biqpod/app/ui/utils";
import { ImageSlider } from "./ImageSlider";
import { motion } from "framer-motion";
import { highlightMatch } from "../routes/Clients/ClientProductRender";
import { ProductToolsBottomSheet } from "./ProductToolsBottomSheet";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { useUsedBy } from "../routes/Stores/Stores";
export interface ProductRenderProps {
  product: SnapBuy.Product;
  index: number;
}
export const ProductRender = ({ product, index }: ProductRenderProps) => {
  const isSelectionMode = getTemp<boolean>("is-selection-mode");
  const usedBy = useUsedBy();
  const { isMobile, isTablet, isDesktop } = useDeviceResolution();
  const photos = product.photos || [];
  const search = getFieldValue("producer-search-product");
  const prices = Array.from(product.multiple?.prices || []);
  const clientPrice = product.single?.client || 0;
  const customerPrice = product.single?.customer || 0;
  const isPromotion = product.type === "multiple";

  // Determine width class based on device type
  const getWidthClass = () => {
    if (isMobile) return "w-1/2";
    if (isTablet) return "w-1/3";
    if (isDesktop) return "w-1/4";
    return "w-1/2"; // fallback
  };
  // Fetch brand information if brandId exists
  const brand = useAsyncMemo(async () => {
    if (product.brandId) {
      try {
        return await snapbuyApi.getBrand(product.brandId);
      } catch (error) {
        console.error("Error fetching brand:", error);
        return null;
      }
    }
    return null;
  }, [product.brandId]);
  const selected = getTemp<string[]>("selected-products") || [];
  const isSelected = product.id && selected.includes(product.id);
  // Helper: check if any product is selected
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={tw(
        `h-[300px] p-1 ${getWidthClass()} transition-[width] duration-500`
      )}
    >
      <Card
        key={product.id}
        className={tw(
          "flex flex-col justify-between w-full h-full overflow-hidden"
        )}
      >
        <div
          className={tw(
            "relative flex justify-center items-center w-full h-[200px] overflow-hidden",
            isSelectionMode ? "pointer-events-none" : "cursor-pointer"
          )}
        >
          {!!photos.length && <ImageSlider photos={photos} />}
          {photos.length == 0 && (
            <div className="flex justify-center items-center w-full h-full">
              <Icon
                iconClassName="text-8xl text-[--biqpod-gray-opacity]"
                icon={allIcons.solid.faBoxOpen}
              />
            </div>
          )}
          {isSelectionMode && (
            <div className="top-2 left-2 z-10 absolute pointer-events-auto">
              <BooleanField
                state={{
                  get: !!isSelected,
                  set: (value) => {
                    const result =
                      typeof value === "function" ? value(!!isSelected) : value;
                    if (result && !isSelected) {
                      setTemp("selected-products", [...selected, product.id!]);
                    } else if (!result && isSelected) {
                      setTemp(
                        "selected-products",
                        selected.filter((id) => id !== product.id)
                      );
                    }
                  },
                }}
                config={{
                  style: "checkbox",
                }}
                id={`product-selection-${product.id}`}
              />
            </div>
          )}
          {!!product.available && (
            <div className="inline-flex top-0 right-0 absolute items-center gap-2 bg-[--biqpod-primary] px-3 py-1 rounded-es-2xl text-[--biqpod-primary-content] capitalize">
              <Icon icon={allIcons.solid.faTag} />
              <span className="max-md:hidden">
                <Translate content="available" />
              </span>
            </div>
          )}
          {isPromotion && (
            <div className="inline-flex top-0 left-0 absolute items-center gap-2 bg-red-600 px-3 py-1 rounded-ee-2xl text-white capitalize">
              <Icon icon={allIcons.solid.faTag} />
              <span className="max-md:hidden">
                <Translate content="promotion" />
              </span>
            </div>
          )}
          {brand && brand.photo && (
            <div className="right-1 bottom-1 absolute w-1/4 overflow-hidden">
              <img
                src={brand.photo}
                alt={brand.name}
                className="w-full h-full object-contain"
                title={brand.name}
              />
            </div>
          )}
        </div>
        <Line />
        <div className="p-2 max-md:p-1">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1">
              {highlightMatch(product.name!, search)}
            </div>
          </div>
        </div>
        <Line />
        <div className="flex justify-between items-center px-2 max-md:py-1 md:py-2">
          {!isPromotion && (
            <div className="flex flex-col gap-2">
              {clientPrice ? (
                <span className="font-bold text-[--biqpod-success] max-md:text-lg text-2xl">
                  {clientPrice} DA
                </span>
              ) : (
                <span
                  onClick={
                    usedBy === "read"
                      ? undefined
                      : async () => {
                          showPopup(<PostNewProduct product={product} />);
                          await delay(100);
                          setTemp("post-focused", 3);
                        }
                  }
                  className={
                    usedBy === "read"
                      ? "max-md:text-lg text-2xl"
                      : "hover:text-[--biqpod-primary] max-md:text-lg text-2xl underline italic cursor-pointer"
                  }
                >
                  <Translate content="no set" />
                </span>
              )}
              {customerPrice ? (
                <span className="font-bold text-[--biqpod-success] max-md:text-lg text-2xl">
                  {customerPrice} DA
                </span>
              ) : (
                <span
                  onClick={
                    usedBy === "read"
                      ? undefined
                      : async () => {
                          showPopup(<PostNewProduct product={product} />);
                          await delay(100);
                          setTemp("post-focused", 3);
                        }
                  }
                  className={
                    usedBy === "read"
                      ? "max-md:text-lg text-2xl"
                      : "hover:text-[--biqpod-primary] max-md:text-lg text-2xl underline italic cursor-pointer"
                  }
                >
                  <Translate content="no set" />
                </span>
              )}
            </div>
          )}
          {isPromotion && (
            <div className="flex flex-wrap gap-2">
              {prices
                ?.sort((price1, price2) => {
                  return price1.quantity - price2.quantity;
                })
                .map((price, index) => {
                  return (
                    <Key key={index} className="max-md:text-md md:text-xl">
                      <span className="text-[--biqpod-success]">
                        {price.price} DA
                      </span>{" "}
                      <sub>
                        {"<"}
                        {price.quantity}
                      </sub>
                    </Key>
                  );
                })}
            </div>
          )}
          <CircleTip
            icon={allIcons.solid.faEllipsisVertical}
            onClick={() => {
              showBottomSheet(
                <ProductToolsBottomSheet
                  index={index}
                  product={product}
                  usedBy={usedBy}
                />
              );
            }}
          />
        </div>
      </Card>
    </motion.div>
  );
};
