/**
 * Cart management utilities for AI Agent integration
 */
import React from "react";

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: number;
  fromAI?: boolean; // Track if item was added via AI recommendation
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  lastUpdated: number;
}

// Local storage key for cart
const CART_STORAGE_KEY = "snapbuy-ai-cart";

/**
 * Get current cart from localStorage
 */
export function getCart(): Cart {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (cartData) {
      const cart = JSON.parse(cartData);
      return {
        items: cart.items || [],
        totalItems: cart.totalItems || 0,
        lastUpdated: cart.lastUpdated || Date.now(),
      };
    }
  } catch (error) {
    console.error("Failed to load cart:", error);
  }

  return {
    items: [],
    totalItems: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Save cart to localStorage
 */
export function saveCart(cart: Cart): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

/**
 * Add product to cart
 */
export function addToCart(
  productId: string,
  quantity: number = 1,
  fromAI: boolean = false
): Cart {
  const cart = getCart();

  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === productId
  );

  if (existingItemIndex >= 0) {
    // Update quantity of existing item
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].addedAt = Date.now();
    if (fromAI) {
      cart.items[existingItemIndex].fromAI = true;
    }
  } else {
    // Add new item
    cart.items.push({
      productId,
      quantity,
      addedAt: Date.now(),
      fromAI,
    });
  }

  // Update totals
  cart.totalItems = cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  cart.lastUpdated = Date.now();

  // Save to localStorage
  saveCart(cart);

  return cart;
}

/**
 * Remove product from cart
 */
export function removeFromCart(productId: string): Cart {
  const cart = getCart();

  cart.items = cart.items.filter((item) => item.productId !== productId);
  cart.totalItems = cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  cart.lastUpdated = Date.now();

  saveCart(cart);

  return cart;
}

/**
 * Update quantity of item in cart
 */
export function updateCartItemQuantity(
  productId: string,
  quantity: number
): Cart {
  const cart = getCart();

  const itemIndex = cart.items.findIndex(
    (item) => item.productId === productId
  );

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].addedAt = Date.now();
    }

    cart.totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    cart.lastUpdated = Date.now();

    saveCart(cart);
  }

  return cart;
}

/**
 * Clear entire cart
 */
export function clearCart(): Cart {
  const cart: Cart = {
    items: [],
    totalItems: 0,
    lastUpdated: Date.now(),
  };

  saveCart(cart);

  return cart;
}

/**
 * Get total number of items in cart
 */
export function getCartItemCount(): number {
  return getCart().totalItems;
}

/**
 * Check if product is in cart
 */
export function isProductInCart(productId: string): boolean {
  const cart = getCart();
  return cart.items.some((item) => item.productId === productId);
}

/**
 * Get quantity of specific product in cart
 */
export function getProductQuantityInCart(productId: string): number {
  const cart = getCart();
  const item = cart.items.find((item) => item.productId === productId);
  return item ? item.quantity : 0;
}

/**
 * Get items added via AI recommendations
 */
export function getAIRecommendedItems(): CartItem[] {
  const cart = getCart();
  return cart.items.filter((item) => item.fromAI);
}

/**
 * Cart event listeners for real-time updates
 */
export type CartEventListener = (cart: Cart) => void;

class CartEventManager {
  private listeners: CartEventListener[] = [];

  subscribe(listener: CartEventListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  notify(cart: Cart): void {
    this.listeners.forEach((listener) => {
      try {
        listener(cart);
      } catch (error) {
        console.error("Cart event listener error:", error);
      }
    });
  }
}

export const cartEventManager = new CartEventManager();

/**
 * Enhanced add to cart with event notification
 */
export function addToCartWithNotification(
  productId: string,
  quantity: number = 1,
  fromAI: boolean = false
): Cart {
  const cart = addToCart(productId, quantity, fromAI);
  cartEventManager.notify(cart);
  return cart;
}

/**
 * Enhanced remove from cart with event notification
 */
export function removeFromCartWithNotification(productId: string): Cart {
  const cart = removeFromCart(productId);
  cartEventManager.notify(cart);
  return cart;
}

/**
 * Enhanced update quantity with event notification
 */
export function updateCartItemQuantityWithNotification(
  productId: string,
  quantity: number
): Cart {
  const cart = updateCartItemQuantity(productId, quantity);
  cartEventManager.notify(cart);
  return cart;
}

/**
 * React hook for cart state
 */
export function useCart() {
  const [cart, setCart] = React.useState<Cart>(getCart());

  React.useEffect(() => {
    // Subscribe to cart changes
    const unsubscribe = cartEventManager.subscribe(setCart);

    // Update cart state on component mount
    setCart(getCart());

    return unsubscribe;
  }, []);

  const handleAddToCart = React.useCallback(
    (productId: string, quantity: number = 1, fromAI: boolean = false) => {
      return addToCartWithNotification(productId, quantity, fromAI);
    },
    []
  );

  const handleRemoveFromCart = React.useCallback((productId: string) => {
    return removeFromCartWithNotification(productId);
  }, []);

  const handleUpdateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      return updateCartItemQuantityWithNotification(productId, quantity);
    },
    []
  );

  const handleClearCart = React.useCallback(() => {
    const clearedCart = clearCart();
    cartEventManager.notify(clearedCart);
    return clearedCart;
  }, []);

  return {
    cart,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity: handleUpdateQuantity,
    clearCart: handleClearCart,
    isProductInCart: React.useCallback(
      (productId: string) => isProductInCart(productId),
      [cart]
    ),
    getProductQuantity: React.useCallback(
      (productId: string) => getProductQuantityInCart(productId),
      [cart]
    ),
  };
}
