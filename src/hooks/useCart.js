"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  openCart,
  closeCart,
  toggleCart,
  setCart,
  removeCoupon,
  removePoints,
  addToCart as addToCartThunk,
  removeFromCart as removeFromCartThunk,
  removeMultipleFromCart as removeMultipleFromCartThunk,
  updateCartItem as updateCartItemThunk,
  fetchCart as fetchCartThunk,
} from "@/redux/features/cart/cartSlice";
import { selectCart } from "@/redux/features/cart/cartSelectors";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

const CART_CONTEXT = process.env.NODE_ENV === "development" ? "localhost" : "storefront";

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

  const addToCart = async (payload) => {
    try {
      // payload can be { product } or { products }
      await dispatch(addToCartThunk(payload)).unwrap();
      // dispatch(openCart());
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (lineId) => {
    try {
      await dispatch(removeFromCartThunk({ lineId })).unwrap();
    } catch (err) {
      console.error("Remove from cart error:", err);
      toast.error("Failed to remove from cart");
    }
  };

  const updateCartItem = async (payload) => {
    try {
      // payload should contain lineId and quantity
      await dispatch(updateCartItemThunk(payload)).unwrap();
    } catch (err) {
      console.error("Update cart error:", err);
      toast.error("Failed to update cart");
    }
  };

  // Claim-gated automatic discounts (Product Discounts rules toggled "Show in
  // Saving Zone drawer") have no line item to add/remove — the backend just
  // flips a flag on the cart doc and re-prices. Refetch afterward so the
  // Shopify-merged item prices/activeDiscounts stay consistent (same pattern
  // this hook already relies on elsewhere for the merged cart shape).
  //
  // Only one discount mechanism applies at a time — claiming here removes an
  // applied code coupon or redeemed Lucira Coins/points first (mirrors the
  // free-gift claim flow, which does the same for the same reason).
  const claimDiscount = async (discountId, { coinsApplicable = false } = {}) => {
    try {
      if (cart.appliedCoupon) {
        dispatch(removeCoupon());
        toast.info("Coupon removed — only one discount can apply at a time.");
      }
      // Coins survive the claim only when this rule was configured to
      // allow them (dashboard: "Lucira Coins applicable").
      if (cart.nectorPoints && !coinsApplicable) {
        dispatch(removePoints());
        toast.info("Lucira Coins removed — only one discount can apply at a time.");
      }
      await apiFetch("/api/cart/discount/claim", {
        method: "POST",
        body: JSON.stringify({ userId, sessionId: getCartSessionId(), discountId, context: CART_CONTEXT }),
      });
      await dispatch(fetchCartThunk()).unwrap();
    } catch (err) {
      console.error("Claim discount error:", err);
      toast.error("Failed to claim discount");
      // Re-thrown so callers (FreeGiftReward's toggle, CartSummary's Apply
      // button) can tell a failed claim apart from a successful one instead
      // of always showing their own "applied!" toast after this resolves.
      throw err;
    }
  };

  const unclaimDiscount = async (discountId) => {
    try {
      await apiFetch("/api/cart/discount/unclaim", {
        method: "POST",
        body: JSON.stringify({ userId, sessionId: getCartSessionId(), discountId, context: CART_CONTEXT }),
      });
      await dispatch(fetchCartThunk()).unwrap();
    } catch (err) {
      console.error("Unclaim discount error:", err);
      toast.error("Failed to remove discount");
      throw err;
    }
  };

  return {
    ...cart,
    addToCart,
    removeFromCart,
    claimDiscount,
    unclaimDiscount,
    removeMultipleFromCart: async (payload) => {
      try {
        await dispatch(removeMultipleFromCartThunk(payload)).unwrap();
      } catch (err) {
        console.error("Remove multiple from cart error:", err);
        toast.error("Failed to remove items from cart");
      }
    },
    updateCartItem,
    // A bare call clears every coupon; passing a code removes just that one
    // so a combined partner survives. Guarded against click handlers that
    // pass an event through.
    removeCoupon: (code) => dispatch(removeCoupon(typeof code === "string" ? code : undefined)),
    openCart: () => dispatch(openCart()),
    closeCart: () => dispatch(closeCart()),
    toggleCart: () => dispatch(toggleCart()),
  };
};
