'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductConfiguration, Cart, CartItem, CartContextType, CartDiscount } from '@/types';
import { trackShopifyAddToCart } from '@/lib/shopify-analytics';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/gtm';
import { getInstallationServicePrice } from '@/lib/pricing';
import { getDraftOrderStatus } from '@/lib/api';
import { isPromoCode } from '@/data/promotions';

const CartContext = createContext<CartContextType | undefined>(undefined);

const defaultCartContext: CartContextType = {
  cart: {
    items: [],
    total: 0,
    itemCount: 0,
    installationService: false,
    installationServicePrice: 0,
    discounts: [],
    discountAmount: 0,
  },
  addToCart: () => {},
  updateCartItem: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  updateItemPrices: () => {},
  setInstallationService: () => {},
  applyDiscount: () => {},
  removeDiscount: () => {},
  clearCart: () => {},
  markCheckoutStarted: () => {},
};

export const useCart = () => {
  const context = useContext(CartContext);
  return context ?? defaultCartContext;
};

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = 'cart';
// Records a checkout the customer was sent to Shopify's hosted checkout for, so a
// later visit can tell a completed purchase from an abandoned one and clear the
// cart only in the first case. See the init effect below for how it's resolved.
const PENDING_CHECKOUT_STORAGE_KEY = 'cart_pending_checkout';

interface SerializableCartItem extends Omit<CartItem, 'addedAt'> {
  addedAt: string;
}

interface PendingCheckout {
  draftOrderId: string;
  startedAt: string;
}

// Matches Shopify's checkout: percentage codes are each taken from the same
// subtotal (20% + 15% = 35% off), then fixed-amount codes come off what is left.
const calculateCartTotals = (items: CartItem[], installationService: boolean, discounts: CartDiscount[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const installationServicePrice = installationService ? getInstallationServicePrice(itemCount) : 0;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const percentOff = discounts
    .filter((discount) => discount.type === 'percentage')
    .reduce((sum, discount) => sum + subtotal * (discount.value / 100), 0);
  const fixedOff = discounts
    .filter((discount) => discount.type === 'fixed_amount')
    .reduce((sum, discount) => sum + discount.value, 0);
  const discountAmount = Math.min(percentOff + fixedOff, subtotal);
  return {
    total: subtotal - discountAmount + installationServicePrice,
    itemCount,
    installationServicePrice,
    discountAmount,
  };
};

// Only one of the announcement bar codes applies at a time; any other code
// (such as the newsletter code) is added alongside it.
const withDiscount = (discounts: CartDiscount[], discount: CartDiscount) => {
  const code = discount.code.toUpperCase();
  const kept = discounts.filter(
    (existing) =>
      existing.code.toUpperCase() !== code && !(isPromoCode(code) && isPromoCode(existing.code))
  );
  return [...kept, discount];
};

const readSavedDiscounts = (parsedCart: { discounts?: unknown; discount?: unknown }): CartDiscount[] => {
  const isDiscount = (value: unknown): value is CartDiscount =>
    Boolean(value) && typeof (value as CartDiscount).code === 'string';
  if (Array.isArray(parsedCart.discounts)) return parsedCart.discounts.filter(isDiscount);
  // Carts saved before several codes were allowed.
  return isDiscount(parsedCart.discount) ? [parsedCart.discount] : [];
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
    discounts: [],
    discountAmount: 0,
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
      const { total, itemCount, installationServicePrice, discountAmount } = calculateCartTotals(
        items,
        installationService,
        prev.discounts
      );
      return { ...prev, items, total, itemCount, installationService, installationServicePrice, discountAmount };
    });
  };

  // Cart state is intentionally local-only to avoid a runtime database dependency.
  useEffect(() => {
    const loadLocalCart = () => {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) return { items: [], installationService: false, discounts: [] as CartDiscount[] };

      try {
        const parsedCart = JSON.parse(savedCart);
        const parsedItems = Array.isArray(parsedCart.items)
          ? parsedCart.items.map((item: SerializableCartItem) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }))
          : [];
        const discounts = readSavedDiscounts(parsedCart);
        return { items: parsedItems, installationService: Boolean(parsedCart.installationService), discounts };
      } catch (error) {
        console.error('Error loading local cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], installationService: false, discounts: [] as CartDiscount[] };
      }
    };

    // If checkout was started on a previous visit, find out whether it actually
    // completed before deciding whether to keep the cart that was deliberately
    // left in place when the customer was sent to Shopify. Resolves to true only
    // for a confirmed purchase — a still-open checkout, an expired/cancelled
    // draft order, or a lookup failure all leave the cart untouched, since the
    // safe default is to never discard items the customer didn't buy.
    const resolvePendingCheckout = async (): Promise<boolean> => {
      const raw = localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
      if (!raw) return false;

      let pending: PendingCheckout;
      try {
        pending = JSON.parse(raw);
        if (!pending?.draftOrderId) throw new Error('Missing draftOrderId');
      } catch (error) {
        console.error('Error reading pending checkout marker:', error);
        localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
        return false;
      }

      try {
        const status = await getDraftOrderStatus(pending.draftOrderId);
        // Shopify marks a draft order "completed" once its invoice is paid, at
        // which point it also carries a real order id — check both since either
        // is sufficient evidence of a real purchase.
        if (status.status === 'completed' || status.orderId) {
          localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
          return true;
        }
        return false;
      } catch (error) {
        // Network hiccup or an unrecognized draft order — leave the marker so
        // this is retried on the next visit rather than guessing either way.
        console.error('Error checking pending checkout status:', error);
        return false;
      }
    };

    (async () => {
      const purchased = await resolvePendingCheckout();
      const { items: localItems, installationService, discounts } = purchased
        ? { items: [], installationService: false, discounts: [] as CartDiscount[] }
        : loadLocalCart();

      const { total, itemCount, installationServicePrice, discountAmount } = calculateCartTotals(
        localItems,
        installationService,
        discounts
      );
      setCart({ items: localItems, total, itemCount, installationService, installationServicePrice, discounts, discountAmount });
      if (purchased) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      hasInitializedRef.current = true;
    })();
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
      // Date.now() alone is not unique: two adds in the same millisecond (a
      // double-click, or "add both" flows) produced two items sharing an id, and
      // editing or removing one then hit both.
      id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

  const updateItemPrices = (updates: { id: string; price: number }[]) => {
    if (updates.length === 0) return;
    applyCartItems((prevItems) =>
      prevItems.map((item) => {
        const update = updates.find((u) => u.id === item.id);
        return update ? { ...item, product: { ...item.product, price: update.price } } : item;
      })
    );
  };

  const setInstallationService = (enabled: boolean) => {
    applyCartItems(
      (prevItems) => prevItems,
      () => enabled
    );
  };

  const applyDiscount = (discount: CartDiscount) => {
    setCart((prev) => {
      const discounts = withDiscount(prev.discounts, discount);
      const { total, itemCount, installationServicePrice, discountAmount } = calculateCartTotals(
        prev.items,
        prev.installationService,
        discounts
      );
      return { ...prev, discounts, discountAmount, total, itemCount, installationServicePrice };
    });
  };

  const removeDiscount = (code: string) => {
    setCart((prev) => {
      const discounts = prev.discounts.filter((discount) => discount.code.toUpperCase() !== code.toUpperCase());
      const { total, itemCount, installationServicePrice, discountAmount } = calculateCartTotals(
        prev.items,
        prev.installationService,
        discounts
      );
      return { ...prev, discounts, discountAmount, total, itemCount, installationServicePrice };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      total: 0,
      itemCount: 0,
      installationService: false,
      installationServicePrice: 0,
      discounts: [],
      discountAmount: 0,
    });
    localStorage.removeItem(CART_STORAGE_KEY);
    // Nothing left to reconcile a pending checkout against once the cart is
    // cleared, whether that happened here or via the customer's own "Clear Cart".
    localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
  };

  const markCheckoutStarted = (draftOrderId: string) => {
    try {
      const pending: PendingCheckout = { draftOrderId, startedAt: new Date().toISOString() };
      localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Error recording checkout start:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateCartItem,
        removeFromCart,
        updateQuantity,
        updateItemPrices,
        setInstallationService,
        applyDiscount,
        removeDiscount,
        clearCart,
        markCheckoutStarted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
