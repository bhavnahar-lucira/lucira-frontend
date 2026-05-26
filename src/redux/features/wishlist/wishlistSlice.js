import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchWishlistApi, addWishlistApi, removeWishlistApi, syncWishlistApi } from "@/lib/api";
import { logout } from "../user/userSlice";

const getNumericId = (gid) => {
  if (!gid) return 0;
  if (typeof gid === "number") return gid;
  const match = String(gid).match(/\d+$/);
  return match ? String(match[0]) : String(gid);
};

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { dispatch, getState }) => {
    try {
      const { user } = getState().user;
      const { sessionId } = getState().cart; // Assuming sessionId is stored in cart or global state
      const data = await fetchWishlistApi(user?.id, sessionId);
      return data.items || [];
    } catch (err) {
      console.error("Wishlist operation failed:", err);
      throw err;
    }
  }
);

export const addWishlistItem = createAsyncThunk(
  "wishlist/addWishlistItem",
  async (payload, { dispatch, getState }) => {
    try {
      const { user } = getState().user;
      const { sessionId } = getState().cart;
      const data = await addWishlistApi(payload, user?.id, sessionId);
      return data.item;
    } catch (err) {
      console.error("Wishlist operation failed:", err);
      throw err;
    }
  }
);

export const removeWishlistItem = createAsyncThunk(
  "wishlist/removeWishlistItem",
  async (payload, { dispatch, getState }) => {
    const productId = typeof payload === 'string' ? payload : payload.productId;
    const variantId = typeof payload === 'string' ? "" : payload.variantId;
    try {
      const { user } = getState().user;
      const { sessionId } = getState().cart;
      await removeWishlistApi(productId, variantId, user?.id, sessionId);
      return payload;
    } catch (err) {
      console.error("Wishlist operation failed:", err);
      throw err;
    }
  }
);

export const mergeGuestWishlist = createAsyncThunk(
  "wishlist/mergeGuestWishlist",
  async (_, { getState }) => {
    const { user } = getState().user;
    const { sessionId } = getState().cart;
    const { wishlist } = getState();
    
    const guestItems = wishlist.guestItems || [];
    const fetched = await fetchWishlistApi(user?.id, sessionId);
    const remoteItems = fetched.items || [];

    if (!guestItems.length) {
      return remoteItems;
    }

    const remoteUniqueKeys = new Set(remoteItems.map((item) => `${getNumericId(item.productId)}-${getNumericId(item.variantId || "")}`));
    const itemsToAdd = guestItems.filter((item) => !remoteUniqueKeys.has(`${getNumericId(item.productId)}-${getNumericId(item.variantId || "")}`));

    if (itemsToAdd.length > 0) {
        const mergedItems = [...remoteItems, ...itemsToAdd];
        await syncWishlistApi(mergedItems, user?.id, sessionId);
        return mergedItems;
    }

    return remoteItems;
  }
);

const initialState = {
  items: [],
  guestItems: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    addGuestWishlistItem: (state, action) => {
      const item = action.payload;
      const prodId = getNumericId(item.productId);
      const varId = getNumericId(item.variantId || "");
      const key = `${prodId}-${varId}`;
      
      const existsInGuest = state.guestItems.some((i) => `${getNumericId(i.productId)}-${getNumericId(i.variantId || "")}` === key);
      const existsInItems = state.items.some((i) => `${getNumericId(i.productId)}-${getNumericId(i.variantId || "")}` === key);
      
      if (!existsInGuest) state.guestItems.unshift(item);
      if (!existsInItems) state.items.unshift(item);
    },
    removeGuestWishlistItem: (state, action) => {
      const payload = action.payload;
      const productId = getNumericId(typeof payload === 'string' ? payload : payload.productId);
      const variantId = getNumericId(typeof payload === 'string' ? "" : payload.variantId);
      
      const filterFn = (item) => {
        const itemProdId = getNumericId(item.productId);
        const itemVarId = getNumericId(item.variantId || "");
        
        if (variantId && variantId !== "0") {
          return !(itemProdId === productId && itemVarId === variantId);
        }
        return itemProdId !== productId;
      };

      state.guestItems = state.guestItems.filter(filterFn);
      state.items = state.items.filter(filterFn);
    },
    restoreGuestWishlist: (state) => {
      state.items = state.guestItems;
      state.loading = false;
      state.error = null;
    },
    clearGuestWishlist: (state) => {
      state.guestItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("user/logout", (state) => {
        state.items = state.guestItems; // Revert to guest state
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addWishlistItem.pending, (state, action) => {
        state.loading = true;
        // Optimistic add
        const item = action.meta.arg;
        if (item && item.productId) {
          const prodId = getNumericId(item.productId);
          const varId = getNumericId(item.variantId || "");
          const key = `${prodId}-${varId}`;
          if (!state.items.find((i) => `${getNumericId(i.productId)}-${getNumericId(i.variantId || "")}` === key)) {
            state.items.unshift(item);
          }
        }
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        state.loading = false;
        const item = action.payload;
        if (item) {
          const prodId = getNumericId(item.productId);
          const varId = getNumericId(item.variantId || "");
          const key = `${prodId}-${varId}`;
          
          // If it's not already in there (from optimistic add), add it
          if (!state.items.find((i) => `${getNumericId(i.productId)}-${getNumericId(i.variantId || "")}` === key)) {
            state.items.unshift(item);
          }
        }
      })
      .addCase(addWishlistItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        // Revert optimistic add if necessary (optional, but for now we keep it simple)
      })
      .addCase(removeWishlistItem.pending, (state, action) => {
        state.loading = true;
        // Optimistic remove
        const payload = action.meta.arg;
        const productId = getNumericId(typeof payload === 'string' ? payload : payload.productId);
        const variantId = getNumericId(typeof payload === 'string' ? "" : (payload.variantId || ""));
        
        state.items = state.items.filter((item) => {
          const itemProdId = getNumericId(item.productId);
          const itemVarId = getNumericId(item.variantId || "");
          
          if (variantId && variantId !== "0" && variantId !== "") {
            return !(itemProdId === productId && itemVarId === variantId);
          }
          return itemProdId !== productId;
        });
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        state.loading = false;
        // No need to filter again as it was done in pending, but safe to do so
        const payload = action.payload;
        const productId = getNumericId(typeof payload === 'string' ? payload : payload.productId);
        const variantId = getNumericId(typeof payload === 'string' ? "" : (payload.variantId || ""));
        
        state.items = state.items.filter((item) => {
          const itemProdId = getNumericId(item.productId);
          const itemVarId = getNumericId(item.variantId || "");
          
          if (variantId && variantId !== "0" && variantId !== "") {
            return !(itemProdId === productId && itemVarId === variantId);
          }
          return itemProdId !== productId;
        });
      })
      .addCase(removeWishlistItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(mergeGuestWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(mergeGuestWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.guestItems = [];
      })
      .addCase(mergeGuestWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  clearWishlist,
  addGuestWishlistItem,
  removeGuestWishlistItem,
  restoreGuestWishlist,
  clearGuestWishlist,
} = wishlistSlice.actions;
export default wishlistSlice.reducer;
