"use client";

import { useDispatch, useSelector } from "react-redux";
import { 
  openCart, 
  closeCart, 
  toggleCart, 
  setCart,
  removeCoupon,
  addToCart as addToCartThunk,
  removeFromCart as removeFromCartThunk,
  updateCartItem as updateCartItemThunk
} from "@/redux/features/cart/cartSlice";
import { selectCart } from "@/redux/features/cart/cartSelectors";
import { toast } from "react-toastify";

const getCartSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
};

export const useCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const user = useSelector((state) => state.user.user);
  const userId = user?.id;

  const addToCart = async (product) => {
    try {
      await dispatch(addToCartThunk({ userId, sessionId: getCartSessionId(), product })).unwrap();
      // dispatch(openCart());
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (variantId) => {
    try {
      await dispatch(removeFromCartThunk({ userId, sessionId: getCartSessionId(), variantId })).unwrap();
    } catch (err) {
      console.error("Remove from cart error:", err);
      toast.error("Failed to remove from cart");
    }
  };

  const updateCartItem = async (payload) => {
    try {
      await dispatch(updateCartItemThunk({ userId, sessionId: getCartSessionId(), ...payload })).unwrap();
    } catch (err) {
      console.error("Update cart error:", err);
      toast.error("Failed to update cart");
    }
  };

  return {
    ...cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    removeCoupon: () => dispatch(removeCoupon()),
    openCart: () => dispatch(openCart()),
    closeCart: () => dispatch(closeCart()),
    toggleCart: () => dispatch(toggleCart()),
  };
};
