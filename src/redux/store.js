import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { rootPersistConfig } from "./persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

import userReducer from "./features/user/userSlice";
import cartReducer from "./features/cart/cartSlice";
import wishlistReducer from "./features/wishlist/wishlistSlice";
import recentlyViewedReducer from "./features/recentlyViewed/recentlyViewedSlice";

const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

const cartPersistConfig = {
  key: "cart",
  storage,
  blacklist: ["loading", "error"],
};

const wishlistPersistConfig = {
  key: "wishlist",
  storage,
  blacklist: ["loading", "error"],
};

const rootReducer = combineReducers({
  user: userReducer,
  cart: persistReducer(cartPersistConfig, cartReducer),
  wishlist: persistReducer(wishlistPersistConfig, wishlistReducer),
  recentlyViewed: recentlyViewedReducer,
});

const persistedReducer = persistReducer(
  {
    ...rootPersistConfig,
    whitelist: ["user", "recentlyViewed"], // cart and wishlist are now handled separately
  },
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
