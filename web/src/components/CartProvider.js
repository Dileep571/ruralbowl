'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '@/lib/api';
import { getCart, addToCart as addToCartAPI, updateCartItem, removeFromCart as removeFromCartAPI, clearCart as clearCartAPI, getCartCount } from '@/lib/cart';
import { isAuthenticated } from '@/lib/auth';
import { useToast } from './ToastProvider';

const CartContext = createContext();

const GUEST_CART_KEY = 'ruralbowl_guest_cart';

// Helper functions for guest cart (localStorage)
const getGuestCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error reading guest cart:', error);
    return [];
  }
};

const saveGuestCart = (cart) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

const clearGuestCart = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Load cart on mount
  useEffect(() => {
    if (isAuthenticated()) {
      loadServerCart();
    } else {
      loadGuestCartFromStorage();
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const handleLogin = () => {
      // When user logs in, merge guest cart and load server cart
      if (isAuthenticated()) {
        mergeGuestCartToServer();
      }
    };

    const handleLogout = () => {
      // When user logs out, clear cart and load guest cart
      setCart([]);
      setCartCount(0);
      clearGuestCart();
      loadGuestCartFromStorage();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:login', handleLogin);
      window.addEventListener('auth:logout', handleLogout);

      return () => {
        window.removeEventListener('auth:login', handleLogin);
        window.removeEventListener('auth:logout', handleLogout);
      };
    }
  }, []);

  const loadGuestCartFromStorage = () => {
    const guestCart = getGuestCart();
    setCart(guestCart);
    const count = guestCart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

  const loadServerCart = async () => {
    try {
      setLoading(true);
      const cartData = await getCart();
      setCart(cartData);
      const count = cartData.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Merge guest cart to server when user logs in
  const mergeGuestCartToServer = async () => {
    const guestCart = getGuestCart();
    if (guestCart.length === 0) {
      await loadServerCart();
      return;
    }

    try {
      // Convert guest cart format to API format
      const items = guestCart.map(item => ({
        product_id: item.product?.id || item.product_id,
        quantity: item.quantity
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/cart/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HttpOnly cookies
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        const data = await response.json();
        clearGuestCart();
        setCart(data.cart || []);
        const count = (data.cart || []).reduce((total, item) => total + item.quantity, 0);
        setCartCount(count);
        if (items.length > 0) {
          toast.success('Cart items merged successfully!');
        }
      } else {
        // If merge fails, just load server cart
        await loadServerCart();
      }
    } catch (error) {
      console.error('Error merging cart:', error);
      await loadServerCart();
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated()) {
      // Guest cart: store in localStorage
      try {
        setLoading(true);
        const guestCart = getGuestCart();
        
        // Check if product already in cart (considering variant if present)
        const existingIndex = guestCart.findIndex(
          item => {
            const itemProductId = item.product?.id || item.product_id;
            const itemVariantId = item.variant_id || null;
            const productVariantId = product.variant_id || null;
            return itemProductId === product.id && itemVariantId === productVariantId;
          }
        );

        let updatedCart;
        if (existingIndex >= 0) {
          // Update quantity
          updatedCart = [...guestCart];
          updatedCart[existingIndex].quantity += quantity;
        } else {
          // Add new item
          updatedCart = [...guestCart, {
            id: `guest_${Date.now()}`, // Temporary ID for guest items
            product_id: product.id,
            variant_id: product.variant_id || null,
            quantity,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              unit: product.unit,
              image_url: product.image_url,
              stock_quantity: product.stock_quantity,
              has_variants: product.has_variants
            }
          }];
        }

        saveGuestCart(updatedCart);
        setCart(updatedCart);
        const count = updatedCart.reduce((total, item) => total + item.quantity, 0);
        setCartCount(count);
        toast.success(`${product.name} added to cart!`);
        return true;
      } catch (error) {
        console.error('Error adding to guest cart:', error);
        toast.error('Failed to add item to cart');
        return false;
      } finally {
        setLoading(false);
      }
    }

    // Authenticated user: use server API
    try {
      setLoading(true);
      const result = await addToCartAPI(product.id, quantity, product.variant_id);
      if (result.success) {
        await loadServerCart();
        toast.success(`${product.name} added to cart!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!isAuthenticated()) {
      // Guest cart: remove from localStorage
      const guestCart = getGuestCart();
      const updatedCart = guestCart.filter(item => item.id !== cartItemId);
      saveGuestCart(updatedCart);
      setCart(updatedCart);
      const count = updatedCart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
      toast.success('Item removed from cart');
      return;
    }

    // Authenticated user: use server API
    try {
      const result = await removeFromCartAPI(cartItemId);
      if (result.success) {
        await loadServerCart();
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    if (!isAuthenticated()) {
      // Guest cart: update in localStorage
      const guestCart = getGuestCart();
      const updatedCart = guestCart.map(item =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      saveGuestCart(updatedCart);
      setCart(updatedCart);
      const count = updatedCart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
      toast.success('Cart updated');
      return;
    }

    // Authenticated user: use server API
    try {
      const result = await updateCartItem(cartItemId, quantity);
      if (result.success) {
        await loadServerCart();
        toast.success('Cart updated');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const clearCart = async (showMessage = true) => {
    if (!isAuthenticated()) {
      // Guest cart: clear localStorage
      clearGuestCart();
      setCart([]);
      setCartCount(0);
      if (showMessage) toast.success('Cart cleared');
      return;
    }

    // Authenticated user: use server API
    try {
      const result = await clearCartAPI();
      if (result.success) {
        setCart([]);
        setCartCount(0);
        if (showMessage) toast.success('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      if (showMessage) toast.error('Failed to clear cart');
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      return total + (parseFloat(price) * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      loading,
      refreshCart: isAuthenticated() ? loadServerCart : loadGuestCartFromStorage,
      mergeGuestCartToServer
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
