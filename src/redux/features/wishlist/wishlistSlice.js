import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchWishlistApi, addWishlistApi, removeWishlistApi, syncWishlistApi } from "@/lib/api";
import { logout } from "../user/userSlice";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { dispatch, getState }) => {
    try {
      const { user } = getState().user;
      const { sessionId } = getState().cart; // Assuming sessionId is stored in cart or global state
      const data = await fetchWishlistApi(user?.id, sessionId);
      return data.items || [];
    } catch (err) {
      if (err.message === "Customer not found" || err.message === "Unauthorized") {
        dispatch(logout());
      }
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
      if (err.message === "Customer not found" || err.message === "Unauthorized") {
        dispatch(logout());
      }
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
      if (err.message === "Customer not found" || err.message === "Unauthorized") {
        dispatch(logout());
      }
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

    const remoteUniqueKeys = new Set(remoteItems.map((item) => `${item.productId}-${item.variantId || ""}`));
    const itemsToAdd = guestItems.filter((item) => !remoteUniqueKeys.has(`${item.productId}-${item.variantId || ""}`));

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
      const key = `${item.productId}-${item.variantId || ""}`;
      const existsInGuest = state.guestItems.some((i) => `${i.productId}-${i.variantId || ""}` === key);
      const existsInItems = state.items.some((i) => `${i.productId}-${i.variantId || ""}` === key);
      if (!existsInGuest) state.guestItems.unshift(item);
      if (!existsInItems) state.items.unshift(item);
    },
    removeGuestWishlistItem: (state, action) => {
      const payload = action.payload;
      const productId = typeof payload === 'string' ? payload : payload.productId;
      const variantId = typeof payload === 'string' ? "" : payload.variantId;
      
      const filterFn = (item) => {
        if (variantId) {
          return !(item.productId === productId && item.variantId === variantId);
        }
        return item.productId !== productId;
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
      .addCase(addWishlistItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        state.loading = false;
        const item = action.payload;
        if (item) {
          const key = `${item.productId}-${item.variantId || ""}`;
          if (!state.items.find((i) => `${i.productId}-${i.variantId || ""}` === key)) {
            state.items.unshift(item);
          }
        }
      })
      .addCase(addWishlistItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(removeWishlistItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const productId = typeof payload === 'string' ? payload : payload.productId;
        const variantId = typeof payload === 'string' ? "" : payload.variantId;
        
        state.items = state.items.filter((item) => {
          if (variantId) {
            return !(item.productId === productId && item.variantId === variantId);
          }
          return item.productId !== productId;
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
