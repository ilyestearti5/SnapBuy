import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Icon,
  Translate,
  Line,
  EmptyComponent,
  Button,
  Image,
} from "@biqpod/app/ui/components";
import {
  showBottomSheet,
  getFieldValue,
  useAsyncMemo,
  setTemp,
  useDeviceResolution,
  getTemp,
} from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { FilesSlider } from "./FilesSlider";
import { motion } from "framer-motion";
import { highlightMatch } from "../routes/Clients/ClientProductRender";
import { ProductToolsBottomSheet } from "./ProductToolsBottomSheet";
import { snapbuyApi } from "../apis";
import { useUsedBy } from "../routes/Stores/Stores";
import { Biqpod } from "@biqpod/app/ui/types";
export interface ProductRenderProps {
  product: Biqpod.Snapbuy.Product;
}
export const ProductRender = ({ product }: ProductRenderProps) => {
  const isSelectionMode = getTemp<boolean>("is-selection-mode");
  const usedBy = useUsedBy();
  const { isMobile, isTablet, isDesktop } = useDeviceResolution();
  const photos = product.files || [];
  const search = getFieldValue("producer-search-product");
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
        return await snapbuyApi.brands.get(product.brandId);
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
        `h-[250px] p-1 ${getWidthClass()} transition-[width] duration-500`
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
          {!!photos.length && <FilesSlider files={photos} />}
          {photos.length == 0 && (
            <div className="flex justify-center items-center w-full h-full">
              <Icon
                className="text-[--biqpod-gray-opacity] text-8xl"
                icon={allIcons.solid.faBoxOpen}
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
          {brand && (
            <div className="right-1 bottom-1 absolute opacity-70 w-1/4 overflow-hidden pointer-events-none">
              <Image
                src={brand.photo}
                alt={<span>{brand.name}</span>}
                className="w-full h-full object-contain"
                title={brand.name}
              />
            </div>
          )}
        </div>
        <Line />
        <div className="flex justify-between items-center gap-2 p-2 max-md:p-1">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1">
              {highlightMatch(product.name!, search)}
            </div>
          </div>
          <CircleTip
            icon={allIcons.solid.faEllipsisVertical}
            onClick={() => {
              showBottomSheet(
                <ProductToolsBottomSheet product={product} usedBy={usedBy} />
              );
            }}
          />
        </div>
        {isSelectionMode && (
          <EmptyComponent>
            <Line />
            <div className="p-3">
              <Button
                className={tw(
                  "rounded-full",
                  isSelected &&
                    "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                )}
                onClick={() => {
                  if (!isSelected) {
                    setTemp("selected-products", [...selected, product.id!]);
                  } else {
                    setTemp(
                      "selected-products",
                      selected.filter((id) => id !== product.id)
                    );
                  }
                }}
                icon={isSelected ? allIcons.solid.faCheck : undefined}
              >
                <Translate content={isSelected ? "deselect" : "select"} />
              </Button>
            </div>
          </EmptyComponent>
        )}
      </Card>
    </motion.div>
  );
};
