'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductConfiguration, Cart, CartItem, CartContextType } from '@/types';
import { trackShopifyAddToCart } from '@/lib/shopify-analytics';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/gtm';
import { getInstallationServicePrice } from '@/lib/pricing';

const CartContext = createContext<CartContextType | undefined>(undefined);

const defaultCartContext: CartContextType = {
  cart: { items: [], total: 0, itemCount: 0, installationService: false, installationServicePrice: 0 },
  addToCart: () => {},
  updateCartItem: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  setInstallationService: () => {},
  clearCart: () => {},
};

export const useCart = () => {
  const context = useContext(CartContext);
  return context ?? defaultCartContext;
};

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = 'cart';

interface SerializableCartItem extends Omit<CartItem, 'addedAt'> {
  addedAt: string;
}

const calculateCartTotals = (items: CartItem[], installationService: boolean) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const installationServicePrice = installationService ? getInstallationServicePrice(itemCount) : 0;
  return {
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) + installationServicePrice,
    itemCount,
    installationServicePrice,
  };
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
    itemCount: 0,
    installationService: false,
    installationServicePrice: 0,
  });

  const applyCartItems = (
    updateItems: (prevItems: CartItem[]) => CartItem[],
    updateInstallationService?: (prevInstallationService: boolean) => boolean
  ) => {
    setCart((prev) => {
      const items = updateItems(prev.items);
      const installationService = updateInstallationService
        ? updateInstallationService(prev.installationService)
        : prev.installationService;
      const { total, itemCount, installationServicePrice } = calculateCartTotals(items, installationService);
      return { items, total, itemCount, installationService, installationServicePrice };
    });
  };

  // Cart state is intentionally local-only to avoid a runtime database dependency.
  useEffect(() => {
    const loadLocalCart = () => {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) return { items: [], installationService: false };

      try {
        const parsedCart = JSON.parse(savedCart);
        const parsedItems = Array.isArray(parsedCart.items)
          ? parsedCart.items.map((item: SerializableCartItem) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }))
          : [];
        return { items: parsedItems, installationService: Boolean(parsedCart.installationService) };
      } catch (error) {
        console.error('Error loading local cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], installationService: false };
      }
    };

    const { items: localItems, installationService } = loadLocalCart();
    queueMicrotask(() => {
      const { total, itemCount, installationServicePrice } = calculateCartTotals(localItems, installationService);
      setCart({ items: localItems, total, itemCount, installationService, installationServicePrice });
      hasInitializedRef.current = true;
    });
  }, []);

  // Persist cart locally for guests and signed-in users.
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    if (cart.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);

  const addToCart = (
    product: Product,
    configuration: ProductConfiguration,
    installationService?: boolean
  ) => {
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product,
      configuration,
      quantity: 1,
      addedAt: new Date(),
    };

    applyCartItems(
      (prevItems) => [...prevItems, newItem],
      installationService ? () => true : undefined
    );
    trackShopifyAddToCart(product);
    trackAddToCart(product, 1, configuration);
    router.push('/cart');
  };

  const updateCartItem = (itemId: string, product: Product, configuration: ProductConfiguration) => {
    applyCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              product,
              configuration,
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    // Read from the committed cart, not the state updater: updaters can run
    // more than once (StrictMode, re-renders) and would double-fire the event.
    const removedItem = cart.items.find((item) => item.id === itemId);
    if (removedItem) {
      trackRemoveFromCart(removedItem);
    }

    applyCartItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== itemId);
      if (updatedItems.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      return updatedItems;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    applyCartItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const setInstallationService = (enabled: boolean) => {
    applyCartItems(
      (prevItems) => prevItems,
      () => enabled
    );
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0, installationService: false, installationServicePrice: 0 });
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateCartItem, removeFromCart, updateQuantity, setInstallationService, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
