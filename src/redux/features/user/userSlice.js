import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authRedirectPath: null,
  pincode: "",
  collectionContext: null, // Track current browsing context (e.g., '9kt-collection')
  referralLink: "",
  referralLoading: false,
  referralError: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAuthModalOpen = false;
    },
    setPincode: (state, action) => {
      state.pincode = String(action.payload || "")
        .replace(/\D/g, "")
        .slice(0, 6);
    },
    setCollectionContext: (state, action) => {
      state.collectionContext = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
    openAuthModal: (state, action) => {
      state.isAuthModalOpen = true;
      state.authRedirectPath = action.payload || null;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
      state.authRedirectPath = null;
    },
    toggleAuthModal: (state) => {
      state.isAuthModalOpen = !state.isAuthModalOpen;
      if (!state.isAuthModalOpen) state.authRedirectPath = null;
    },
    setReferralLoading: (state, action) => {
      state.referralLoading = action.payload;
    },
    setReferralLink: (state, action) => {
      state.referralLink = action.payload;
      state.referralError = null;
    },
    setReferralError: (state, action) => {
      state.referralError = action.payload;
    },
  },
});

export const { 
  login, 
  setPincode, 
  setCollectionContext,
  logout, 
  setAvatar, 
  openAuthModal, 
  closeAuthModal, 
  toggleAuthModal,
  setReferralLoading, 
  setReferralLink, 
  setReferralError 
} = userSlice.actions;
export default userSlice.reducer;

export const selectUser = (state) => state.user.user;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectIsAuthModalOpen = (state) => state.user.isAuthModalOpen;
export const selectPincode = (state) => state.user.pincode;