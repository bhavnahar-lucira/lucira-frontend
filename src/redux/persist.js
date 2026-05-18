import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { persistReducer } from "redux-persist";

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

export const rootPersistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["user", "cart", "wishlist", "recentlyViewed"], // persist wishlist and recently viewed list
};

export const persistUserReducer = (reducer) =>
  persistReducer(rootPersistConfig, reducer);
