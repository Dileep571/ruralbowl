import { cartAPI } from './api';

export const getCart = async () => {
  try {
    const data = await cartAPI.get();
    // Backend returns array directly, not wrapped in cart property
    return Array.isArray(data) ? data : (data.cart || []);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
};

export const getCartTotal = async () => {
  try {
    const data = await cartAPI.get();
    // Backend returns array directly, calculate total from items
    const cart = Array.isArray(data) ? data : (data.cart || []);
    const total = cart.reduce((sum, item) => {
      const price = item?.product?.price || 0;
      const quantity = item?.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    return parseFloat(total || 0);
  } catch (error) {
    console.error('Error fetching cart total:', error);
    return 0;
  }
};

export const addToCart = async (productId, quantity = 1, variantId = null) => {
  try {
    const data = await cartAPI.add(productId, quantity, variantId);
    return { success: true, data };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error.message };
  }
};

export const updateCartItem = async (cartItemId, quantity) => {
  try {
    const data = await cartAPI.update(cartItemId, quantity);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error: error.message };
  }
};

export const removeFromCart = async (cartItemId) => {
  try {
    const data = await cartAPI.remove(cartItemId);
    return { success: true, data };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error: error.message };
  }
};

export const clearCart = async () => {
  try {
    const data = await cartAPI.clear();
    return { success: true, data };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error: error.message };
  }
};

export const getCartCount = async () => {
  try {
    const data = await cartAPI.get();
    // Backend returns array directly, not wrapped in cart property
    const cart = Array.isArray(data) ? data : (data.cart || []);
    return cart.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error fetching cart count:', error);
    return 0;
  }
};
