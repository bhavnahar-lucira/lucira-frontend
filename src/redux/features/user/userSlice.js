import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
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
      const { user, accessToken } = action.payload.user ? action.payload : { user: action.payload, accessToken: state.accessToken };
      
      state.user = user;
      state.accessToken = accessToken || null;
      state.isAuthenticated = !!accessToken; // Only authenticated if we have a token
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
      console.log("[userSlice] Logging out user and clearing session.");
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    setAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Ensure name is updated if firstName/lastName changed
        if (action.payload.firstName || action.payload.lastName) {
          state.user.name = `${action.payload.firstName || state.user.firstName || ""} ${action.payload.lastName || state.user.lastName || ""}`.trim();
        }
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
  updateUser, 
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
