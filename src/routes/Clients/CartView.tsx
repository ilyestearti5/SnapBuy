import React, { useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import { Card, Button, Translate, Icon } from "@biqpod/app/ui/components";
import { useAsyncMemo, confirm, showToast } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../../apis";
import { getPrice } from "../../utils";
import {
  addToCart,
  deleteCart,
  initCart,
  removeCart,
  useCart,
  useFullCart,
} from "@biqpod/snapbuy";
interface CartItemProps {
  prodId: string;
  count: number;
  onQuantityChange: (newCount: number) => void;
  onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({
  prodId,
  count,
  onQuantityChange,
  onRemove,
}) => {
  const product = useAsyncMemo(async () => {
    try {
      return await snapbuyApi.getProduct(prodId);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return null;
    }
  }, [prodId]);

  const price = useMemo(() => {
    if (!product) return { total: 0, choised: null };
    return getPrice(product, count);
  }, [product, count]);

  const handleQuantityChange = (newCount: number) => {
    if (newCount <= 0) {
      onRemove();
    } else {
      onQuantityChange(newCount);
    }
  };

  if (!product) {
    return (
      <Card className="animate-pulse">
        <div className="flex gap-4 p-4">
          <div className="bg-gray-200 rounded w-20 h-20"></div>
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 rounded w-3/4 h-4"></div>
            <div className="bg-gray-200 rounded w-1/2 h-4"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Product Image */}
        <div className="flex-shrink-0 rounded-lg w-20 h-20 overflow-hidden">
          {product.photos && product.photos.length > 0 ? (
            <img
              src={product.photos[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex justify-center items-center bg-gray-200 w-full h-full">
              <Icon
                icon={allIcons.solid.faImage}
                iconClassName="text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <h3 className="mb-1 font-semibold text-gray-900 text-lg">
              {product.name}
            </h3>
            <p className="mb-2 text-gray-600 text-sm">
              {product.description && product.description.length > 100
                ? product.description.substring(0, 100) + "..."
                : product.description}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-green-600 text-lg">
                {price.total} DA
              </span>
              {price.choised && (
                <span className="text-gray-500 text-sm">
                  ({price.choised.price} DA each)
                </span>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(count - 1)}
                className="flex justify-center items-center bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 transition-colors"
              >
                <Icon icon={allIcons.solid.faMinus} iconClassName="text-sm" />
              </button>

              <span className="min-w-[40px] font-semibold text-lg text-center">
                {count}
              </span>

              <button
                onClick={() => handleQuantityChange(count + 1)}
                className="flex justify-center items-center bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 transition-colors"
              >
                <Icon icon={allIcons.solid.faPlus} iconClassName="text-sm" />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={onRemove}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-red-600 transition-colors"
            >
              <Icon icon={allIcons.solid.faTrash} iconClassName="text-sm" />
              <span className="text-sm">
                <Translate content="Remove" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface CartViewProps {
  storeId: string;
}

export const CartView: React.FC<CartViewProps> = ({ storeId }) => {
  // Initialize cart on component mount
  initCart();

  const cartItems = useFullCart(storeId);
  const cart = useCart(storeId);

  // Calculate totals
  const { totalItems, totalPrice } = useAsyncMemo(async () => {
    let totalItems = 0;
    let totalPrice = 0;

    for (const item of cartItems) {
      totalItems += item.count;

      try {
        const product = await snapbuyApi.getProduct(item.prodId);
        if (product) {
          const price = getPrice(product, item.count);
          totalPrice += price.total;
        }
      } catch (error) {
        console.error("Failed to fetch product for total calculation:", error);
      }
    }

    return { totalItems, totalPrice };
  }, [cartItems]) || { totalItems: 0, totalPrice: 0 };

  const handleQuantityChange = (prodId: string, newCount: number) => {
    addToCart(storeId, prodId, newCount);
  };

  const handleRemoveItem = async (prodId: string) => {
    const confirmed = await confirm({
      title: "Remove Item",
      message: "Are you sure you want to remove this item from your cart?",
      type: "warning",
    });

    if (confirmed) {
      removeCart(storeId, prodId);
      showToast("Item removed from cart", "success");
    }
  };

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: "Clear Cart",
      message: "Are you sure you want to remove all items from your cart?",
      detail: "This action cannot be undone.",
      type: "warning",
    });

    if (confirmed) {
      deleteCart(storeId);
      showToast("Cart cleared", "success");
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "warning");
      return;
    }

    // Here you would implement your checkout logic
    showToast("Checkout functionality to be implemented", "info");
  };

  if (!cart || cartItems.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-8 h-full">
        <div className="text-center">
          <Icon
            icon={allIcons.solid.faShoppingCart}
            iconClassName="text-8xl text-gray-300 mb-4"
          />
          <h2 className="mb-2 font-bold text-gray-500 text-2xl">
            <Translate content="Your cart is empty" />
          </h2>
          <p className="mb-6 text-gray-400">
            <Translate content="Add some products to get started" />
          </p>
          <Button
            className="px-6 py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: "#89CFF0" }}
          >
            <Icon icon={allIcons.solid.faArrowLeft} iconClassName="mr-2" />
            <Translate content="Continue Shopping" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-gray-200 border-b">
        <h1 className="font-bold text-gray-900 text-2xl">
          <Translate content="Shopping Cart" /> ({totalItems})
        </h1>
        <button
          onClick={handleClearCart}
          className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors"
        >
          <Icon icon={allIcons.solid.faTrash} />
          <span>
            <Translate content="Clear Cart" />
          </span>
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 p-4 overflow-y-auto">
        {cartItems.map((item) => (
          <CartItem
            key={item.prodId}
            prodId={item.prodId}
            count={item.count}
            onQuantityChange={(newCount) =>
              handleQuantityChange(item.prodId, newCount)
            }
            onRemove={() => handleRemoveItem(item.prodId)}
          />
        ))}
      </div>

      {/* Summary and Checkout */}
      <div className="bg-gray-50 p-4 border-gray-200 border-t">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              <Translate content="Total Items" />:
            </span>
            <span className="font-semibold">{totalItems}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-900">
              <Translate content="Total Price" />:
            </span>
            <span className="font-bold text-green-600 text-xl">
              {totalPrice} DA
            </span>
          </div>
        </div>

        <div className="gap-3 grid grid-cols-1 md:grid-cols-2">
          <Button
            onClick={() => {
              // Navigate back to shopping
            }}
            className="hover:bg-gray-50 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
          >
            <Icon icon={allIcons.solid.faArrowLeft} iconClassName="mr-2" />
            <Translate content="Continue Shopping" />
          </Button>

          <Button
            onClick={handleCheckout}
            className="px-4 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: "#89CFF0" }}
          >
            <Icon icon={allIcons.solid.faCreditCard} iconClassName="mr-2" />
            <Translate content="Checkout" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartView;
