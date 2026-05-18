import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

// Helper to get or create session ID
const getSessionId = () => {
  if (typeof window === "undefined") return null;
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ userId }) => {
    const sessionId = getSessionId();
    return await apiFetch(`/api/cart/get?userId=${userId || ''}&sessionId=${sessionId || ''}`);
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, sessionId, product }) => {
    const finalSessionId = sessionId || getSessionId();
    return await apiFetch(`/api/cart/add`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId: finalSessionId, product }),
    });
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ userId, sessionId, variantId }) => {
    const finalSessionId = sessionId || getSessionId();
    return await apiFetch(`/api/cart/remove`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId: finalSessionId, variantId }),
    });
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ userId, sessionId, currentVariantId, nextVariantId, quantity, size, price, variantTitle, inStock, sku }) => {
    const finalSessionId = sessionId || getSessionId();
    return await apiFetch(`/api/cart/update`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        sessionId: finalSessionId,
        currentVariantId,
        nextVariantId,
        quantity,
        size,
        price,
        variantTitle,
        inStock,
        sku,
      }),
    });
  }
);

export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async ({ userId }) => {
    const sessionId = getSessionId();
    return await apiFetch(`/api/cart/merge`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId }),
    });
  }
);

export const repriceCartForCheckout = createAsyncThunk(
  "cart/repriceCartForCheckout",
  async ({ userId }) => {
    const sessionId = getSessionId();
    return await apiFetch("/api/cart/checkout", {
      method: "POST",
      body: JSON.stringify({ userId, sessionId }),
    });
  }
);

const initialState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  appliedCoupon: null,
  nectorPoints: null, // { coin_value: 0, fiat_value: 0, points_label: "" }
  isCartOpen: false,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      state.appliedCoupon = null;
      state.nectorPoints = null;
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },
    applyPoints: (state, action) => {
      state.nectorPoints = action.payload;
    },
    removePoints: (state) => {
      state.nectorPoints = null;
    },
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(repriceCartForCheckout.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(mergeCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      });
  },
});

export const { 
  clearCart, 
  applyCoupon, 
  removeCoupon, 
  applyPoints,
  removePoints,
  openCart, 
  closeCart, 
  toggleCart 
} = cartSlice.actions;
export default cartSlice.reducer;
