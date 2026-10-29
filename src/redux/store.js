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
  blacklist: ["loading", "error", "nectorPoints"],
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

// manualPersist: rehydration from localStorage does NOT start at module load.
// ReduxProvider calls persistor.persist() after React has hydrated, so the first
// client render sees the same un-rehydrated store the server rendered with
// (no hydration mismatch) and the persisted cart / user state lands a tick
// later as an ordinary REHYDRATE update.
export const persistor = persistStore(store, { manualPersist: true });

// The state the server rendered with: reducer defaults, nothing persisted.
// ReduxProvider hands it to react-redux as `serverState`, so that while React
// is hydrating, every useSelector reads this snapshot instead of the live
// store. React hydrates the root layout before the page's Suspense boundary,
// and rehydration (started from the root layout's effect) can therefore land
// before the header hydrates; without this snapshot a logged-in visitor's
// header would render the avatar while the server HTML has the guest icon,
// and React would throw the whole server-rendered tree away.
export const serverState = store.getState();
