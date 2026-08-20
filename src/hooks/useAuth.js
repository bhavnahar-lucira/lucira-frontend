"use client";

import { useDispatch, useSelector } from "react-redux";
import { 
  openAuthModal, 
  closeAuthModal, 
  toggleAuthModal, 
  selectIsAuthModalOpen,
  selectUser,
  selectIsAuthenticated,
  logout
} from "@/redux/features/user/userSlice";
import { removeMultipleFromCart } from "@/redux/features/cart/cartSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const openLogin = (redirectPath = null) => dispatch(openAuthModal(redirectPath));
  const closeLogin = () => dispatch(closeAuthModal());
  const toggleLogin = () => dispatch(toggleAuthModal());
  
  const handleLogout = async () => {
    // We can't use getState here directly, but we can access the store via dynamic import
    // to find and remove any free gifts before logging out.
    try {
      const { store } = await import("@/redux/store");
      const cartItems = store.getState().cart?.items || [];
      const freeGifts = cartItems.filter(item => item.isFreeGift);
      if (freeGifts.length > 0) {
        const lineIds = freeGifts.map(g => g.lineId || g.variantId);
        await dispatch(removeMultipleFromCart({ lineIds })).unwrap();
      }
    } catch (err) {
      console.error("Failed to clear free gifts on logout:", err);
    }
    dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    isAuthModalOpen,
    openLogin,
    closeLogin,
    toggleLogin,
    logout: handleLogout
  };
};
