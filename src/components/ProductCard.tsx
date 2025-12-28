import React from "react";
import { Icon, Button, CircleTip, Image } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";
import { useCopyState } from "@biqpod/app/ui/hooks";
export interface ProductCardProps {
  product: Biqpod.Snapbuy.Product;
  onAddToCart?: (productId: string, quantity?: number) => void;
  onViewDetails?: (productId: string) => void;
  compact?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
}
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  compact = false,
  showPrice = true,
  showDescription = true,
}) => {
  const quantity = useCopyState(1);
  const isAddingToCart = useCopyState(false);
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
  const hasStock = product.quantity ? product.quantity > 0 : true;
  const canAddToCart = isAvailable && hasStock && onAddToCart;
  const handleAddToCart = async () => {
    if (!canAddToCart || !product.id) return;
    isAddingToCart.set(true);
    try {
      onAddToCart(product.id, quantity.get);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      isAddingToCart.set(false);
    }
  };
  const handleViewDetails = () => {
    if (onViewDetails && product.id) {
      onViewDetails(product.id);
    }
  };
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-[--biqpod-background-secondary] p-3 border border-[--biqpod-border] hover:border-[--biqpod-primary] rounded-lg transition-colors"
      >
        {/* Product Image */}
        <div className="flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={product.files?.at(0)?.url}
            alt={product.name || "Product"}
            className="bg-[--biqpod-gray-opacity] w-16 h-16 object-cover text-[--biqpod-text-secondary]"
          />
        </div>
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            {product.name || "Unnamed Product"}
          </h4>
          {showPrice && (
            <p className="font-semibold text-[--biqpod-primary] text-sm">
              ${price.toFixed(2)}
            </p>
          )}
          {!isAvailable && (
            <span className="text-red-500 text-xs">Out of Stock</span>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {canAddToCart && (
            <CircleTip icon={allIcons.solid.faPlus} onClick={handleAddToCart} />
          )}
          {onViewDetails && (
            <CircleTip
              icon={allIcons.solid.faEye}
              onClick={handleViewDetails}
            />
          )}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[--biqpod-background-secondary] border border-[--biqpod-border] hover:border-[--biqpod-primary] rounded-lg overflow-hidden transition-colors"
    >
      {/* Product Image */}
      <div className="relative bg-[--biqpod-gray-opacity] aspect-square overflow-hidden">
        <Image
          src={product.files?.at(0)?.url}
          alt={product.name || "Product"}
          className="object-cover text-[--biqpod-text-secondary]"
        />
        {/* Availability Badge */}
        {!isAvailable && (
          <div className="top-2 right-2 absolute bg-red-500 px-2 py-1 rounded text-white text-xs">
            Out of Stock
          </div>
        )}
        {/* Limited Badge */}
        {product.limited && (
          <div className="top-2 left-2 absolute bg-orange-500 px-2 py-1 rounded text-white text-xs">
            Limited
          </div>
        )}
      </div>
      {/* Product Info */}
      <div className="p-4">
        <h3 className="mb-2 font-semibold text-lg line-clamp-2">
          {product.name || "Unnamed Product"}
        </h3>
        {showDescription && product.description && (
          <p className="mb-3 text-[--biqpod-text-secondary] text-sm line-clamp-3">
            {product.description}
          </p>
        )}
        {/* Price and Quantity Info */}
        <div className="flex justify-between items-center mb-4">
          {showPrice && (
            <div className="flex flex-col">
              <span className="font-bold text-[--biqpod-primary] text-xl">
                ${price.toFixed(2)}
              </span>
              {product.type === "multiple" && product.multiple?.prices && (
                <span className="text-[--biqpod-text-secondary] text-xs">
                  Starting price
                </span>
              )}
            </div>
          )}
          {product.quantity !== undefined && (
            <div className="text-right">
              <span className="text-[--biqpod-text-secondary] text-sm">
                {product.quantity} in stock
              </span>
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {canAddToCart && (
            <div className="flex flex-1 items-center gap-2">
              {/* Quantity Selector */}
              <div className="flex items-center gap-1 border border-[--biqpod-border] rounded">
                <button
                  onClick={() => quantity.set(Math.max(1, quantity.get - 1))}
                  className="hover:bg-[--biqpod-gray-opacity] p-1 transition-colors"
                  disabled={quantity.get <= 1}
                >
                  <Icon icon={allIcons.solid.faMinus} />
                </button>
                <span className="px-2 py-1 min-w-[2rem] text-sm text-center">
                  {quantity.get}
                </span>
                <button
                  onClick={() => quantity.set(quantity.get + 1)}
                  className="hover:bg-[--biqpod-gray-opacity] p-1 transition-colors"
                  disabled={
                    product.quantity ? quantity.get >= product.quantity : false
                  }
                >
                  <Icon icon={allIcons.solid.faPlus} />
                </button>
              </div>
              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                className={tw(
                  "flex-1 bg-[--biqpod-primary] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
                  isAddingToCart.get && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon
                  icon={
                    isAddingToCart.get
                      ? allIcons.solid.faSpinner
                      : allIcons.solid.faCartPlus
                  }
                />
                {isAddingToCart.get ? "Adding..." : "Add to Cart"}
              </Button>
            </div>
          )}
          {/* View Details Button */}
          {onViewDetails && (
            <CircleTip
              icon={allIcons.solid.faEye}
              onClick={handleViewDetails}
            />
          )}
        </div>
        {/* Multiple Prices Display */}
        {product.type === "multiple" && product.multiple?.prices && (
          <div className="mt-3 pt-3 border-[--biqpod-border] border-t">
            <p className="mb-2 text-[--biqpod-text-secondary] text-xs">
              Bulk Pricing:
            </p>
            <div className="gap-1 grid grid-cols-2 text-xs">
              {product.multiple.prices.slice(0, 4).map((priceInfo, index) => (
                <div key={index} className="flex justify-between">
                  <span>{priceInfo.quantity}+ units:</span>
                  <span className="font-medium">
                    ${priceInfo.price?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default ProductCard;
