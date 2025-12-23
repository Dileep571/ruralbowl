import { ordersAPI } from './api';

export const createOrder = async (orderData) => {
  try {
    const data = await ordersAPI.create(orderData);
    return { success: true, data };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

export const getOrders = async () => {
  try {
    const data = await ordersAPI.getAll();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getOrderById = async (orderId) => {
  try {
    const data = await ordersAPI.getById(orderId);
    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};
