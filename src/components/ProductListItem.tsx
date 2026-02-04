import React from "react";
import {
  CircleTip,
  Image,
  Translate,
  EmptyComponent,
  Line,
  Icon,
  Card,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";
import {
  useCopyState,
  showToast,
  showBottomSheet,
  closeBottomSheet,
} from "@biqpod/app/ui/hooks";
export interface ProductListItemProps {
  product: Biqpod.Snapbuy.Product;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onToggleAvailability?: (productId: string, available: boolean) => void;
  onViewDetails?: (productId: string) => void;
  onDuplicate?: (productId: string) => void;
  showPrice?: boolean;
  showDescription?: boolean;
}
export const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
  onViewDetails,
  onDuplicate,
  showPrice = true,
  showDescription = true,
}) => {
  const isDeleting = useCopyState(false);
  const isToggling = useCopyState(false);
  // Get product price
  const getPrice = () => {
    if (product.type === "single" && product.single) {
      return product.single.customer || product.single.client || 0;
    }
    if (product.type === "multiple" && product.multiple?.prices?.length) {
      return Math.min(...product.multiple.prices.map((p) => p.price || 0));
    }
    return 0;
  };
  const price = getPrice();
  const isAvailable = product.available ?? true;
  const handleEdit = () => {
    if (onEdit && product.id) {
      onEdit(product.id);
    }
  };
  const handleDelete = async () => {
    if (!onDelete || !product.id) return;
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    isDeleting.set(true);
    try {
      await onDelete(product.id);
      showToast("Product deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete product:", error);
      showToast("Failed to delete product", "error");
    } finally {
      isDeleting.set(false);
    }
  };
  const handleToggleAvailability = async () => {
    if (!onToggleAvailability || !product.id) return;
    isToggling.set(true);
    try {
      await onToggleAvailability(product.id, !isAvailable);
      showToast(
        `Product ${!isAvailable ? "enabled" : "disabled"} successfully`,
        "success"
      );
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      showToast("Failed to update product availability", "error");
    } finally {
      isToggling.set(false);
    }
  };
  const handleViewDetails = () => {
    if (onViewDetails && product.id) {
      onViewDetails(product.id);
    }
  };
  const handleDuplicate = () => {
    if (onDuplicate && product.id) {
      onDuplicate(product.id);
    }
  };

  const menu = [
    onViewDetails && {
      label: "View Details",
      defaultIcon: allIcons.solid.faEye,
      click: handleViewDetails,
    },
    onEdit && {
      label: "Edit Product",
      defaultIcon: allIcons.solid.faEdit,
      click: handleEdit,
    },
    onDuplicate && {
      label: "Duplicate Product",
      defaultIcon: allIcons.solid.faCopy,
      click: handleDuplicate,
    },
    onToggleAvailability && {
      label: isAvailable ? "Disable Product" : "Enable Product",
      defaultIcon: isAvailable
        ? allIcons.solid.faEyeSlash
        : allIcons.solid.faEye,
      click: handleToggleAvailability,
    },
    onDelete && {
      label: "Delete Product",
      defaultIcon: allIcons.solid.faTrash,
      click: handleDelete,
    },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex items-center gap-4 bg-[--biqpod-background-secondary] p-4 border border-[--biqpod-border] hover:border-[--biqpod-primary] rounded-lg transition-colors"
    >
      <Card className="w-full">
        <div className="flex justify-between items-center gap-3 p-2">
          {/* Product Image */}
          <div className="relative flex items-center gap-3 rounded-lg overflow-hidden">
            <Image
              src={product.files?.at(0)?.url}
              alt={product.name || "Product"}
              className="bg-[--biqpod-gray-opacity] w-16 h-16 object-cover text-[--biqpod-text-secondary]"
            />
            {/* Availability Badge */}
            {!isAvailable && (
              <div className="top-1 right-1 absolute bg-red-500 px-1.5 py-0.5 rounded text-white text-xs">
                <Translate content="Disabled" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-base truncate">
                {product.name || <Translate content="Unnamed Product" />}
              </h4>
              {showDescription && product.description && (
                <p className="mt-1 text-[--biqpod-text-secondary] text-sm line-clamp-1">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {showPrice && (
                  <span className="font-semibold text-[--biqpod-primary]">
                    ${price.toFixed(2)}
                  </span>
                )}
                {product.quantity !== undefined && (
                  <span className="text-[--biqpod-text-secondary] text-sm">
                    {product.quantity} <Translate content="in stock" />
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Product Info */}
          {/* Admin Actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <CircleTip
              icon={allIcons.solid.faEllipsisVertical}
              onClick={() => {
                showBottomSheet(
                  <EmptyComponent>
                    <div className="p-2">
                      <h1 className="font-bold text-2xl uppercase">
                        <Translate content="actions" />
                      </h1>
                    </div>
                    <Line />
                    {menu.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-6 hover:bg-[--biqpod-gray-opacity] p-3 max-md:text-lg md:text-xl capitalize cursor-pointer"
                        onClick={async () => {
                          closeBottomSheet();
                          item?.click?.();
                        }}
                      >
                        <Icon icon={item?.defaultIcon} />
                        <span>
                          <Translate content={item?.label || ""} />
                        </span>
                      </div>
                    ))}
                  </EmptyComponent>
                );
              }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
export default ProductListItem;
