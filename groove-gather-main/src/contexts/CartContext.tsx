import React, { createContext, useContext, useState, useCallback } from "react";

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  /**
   * Available stock from the backend. Cart actions must not exceed this.
   */
  stock: number;
  priceDisplay: string;
  tag: string;
  category: string;
  /**
   * Additional catalog metadata for storefront browsing
   */
  condition?: string;
  availability?: string;
  imageUrl?: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);

      const currentQty = existing ? existing.quantity : 0;
      const nextQty = currentQty + 1;

      if (typeof product.stock === "number" && product.stock >= 0 && nextQty > product.stock) {
        const available = product.stock - currentQty;
        const msg =
          available > 0
            ? `Only ${available} item${available === 1 ? "" : "s"} available in stock`
            : "No more stock available for this product";
        window.alert(msg);
        return prev;
      }

      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const product = prev.find((i) => i.id === productId);
      if (!product) return prev;

      if (quantity <= 0) {
        return prev.filter((i) => i.id !== productId);
      }

      if (typeof product.stock === "number" && product.stock >= 0 && quantity > product.stock) {
        window.alert(
          `Only ${product.stock} item${product.stock === 1 ? "" : "s"} available in stock`
        );
        return prev;
      }

      return prev.map((i) => (i.id === productId ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
