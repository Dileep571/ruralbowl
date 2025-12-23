import { useDispatch, useSelector } from 'react-redux'
import { addItem, removeItem, updateQuantity, clearCart } from '../store/slices/cartSlice'

export const useCart = () => {
  const dispatch = useDispatch()
  const cart = useSelector(state => state.cart)

  const addToCart = (product) => {
    dispatch(addItem(product))
  }

  const removeFromCart = (productId) => {
    dispatch(removeItem(productId))
  }

  const updateItemQuantity = (productId, quantity) => {
    dispatch(updateQuantity({ id: productId, quantity }))
  }

  const clearCartItems = () => {
    dispatch(clearCart())
  }

  return {
    items: cart.items,
    total: cart.total,
    quantity: cart.quantity,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCartItems,
  }
}