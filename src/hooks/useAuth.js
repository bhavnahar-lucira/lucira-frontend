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

export const useAuth = () => {
  const dispatch = useDispatch();
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const openLogin = (redirectPath = null) => dispatch(openAuthModal(redirectPath));
  const closeLogin = () => dispatch(closeAuthModal());
  const toggleLogin = () => dispatch(toggleAuthModal());
  
  const handleLogout = () => {
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
