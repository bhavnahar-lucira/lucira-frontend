import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  shopifyStorefrontFetch, 
  CART_QUERY, 
  CART_CREATE_MUTATION, 
  CART_LINES_ADD_MUTATION, 
  CART_LINES_UPDATE_MUTATION, 
  CART_LINES_REMOVE_MUTATION 
} from "@/lib/shopify-client";

// Helper to get or create Shopify Cart ID
const getCartId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shopify_cart_id");
};

const setCartId = (id) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("shopify_cart_id", id);
};

// Map Shopify Cart to local state structure
const mapShopifyCart = (cart) => {
  if (!cart) return { items: [], totalQuantity: 0, totalAmount: 0 };
  
  const items = cart.lines?.edges?.map(({ node }) => ({
    lineId: node.id,
    variantId: node.merchandise.id,
    quantity: node.quantity,
    title: node.merchandise.product.title,
    variantTitle: node.merchandise.title,
    handle: node.merchandise.product.handle,
    sku: node.merchandise.sku,
    price: Number(node.merchandise.price.amount),
    compare_price: node.merchandise.compareAtPrice ? Number(node.merchandise.compareAtPrice.amount) : null,
    image: node.merchandise.image?.url,
    altText: node.merchandise.image?.altText,
    productId: node.merchandise.product.id,
    inStock: true, // Storefront API only allows adding available items
  })) || [];

  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    items,
    totalQuantity: cart.totalQuantity || 0,
    totalAmount: Number(cart.cost?.totalAmount?.amount || 0),
  };
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async () => {
    const cartId = getCartId();
    if (!cartId) return { items: [], totalQuantity: 0, totalAmount: 0 };
    
    const data = await shopifyStorefrontFetch(CART_QUERY, { cartId });
    return mapShopifyCart(data?.cart);
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ product }) => {
    let cartId = getCartId();
    const variantId = product.shopifyVariantId || product.variantId || product.id;
    
    if (!cartId) {
      const data = await shopifyStorefrontFetch(CART_CREATE_MUTATION, {
        input: {
          lines: [{ merchandiseId: variantId, quantity: product.quantity || 1 }]
        }
      });
      const newCart = data?.cartCreate?.cart;
      if (newCart) {
        setCartId(newCart.id);
        const fullData = await shopifyStorefrontFetch(CART_QUERY, { cartId: newCart.id });
        return mapShopifyCart(fullData?.cart);
      }
    } else {
      await shopifyStorefrontFetch(CART_LINES_ADD_MUTATION, {
        cartId,
        lines: [{ merchandiseId: variantId, quantity: product.quantity || 1 }]
      });
      const fullData = await shopifyStorefrontFetch(CART_QUERY, { cartId });
      return mapShopifyCart(fullData?.cart);
    }
    return { items: [], totalQuantity: 0, totalAmount: 0 };
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ lineId }) => {
    const cartId = getCartId();
    if (!cartId || !lineId) return;

    await shopifyStorefrontFetch(CART_LINES_REMOVE_MUTATION, {
      cartId,
      lineIds: [lineId]
    });
    
    const data = await shopifyStorefrontFetch(CART_QUERY, { cartId });
    return mapShopifyCart(data?.cart);
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ lineId, quantity }) => {
    const cartId = getCartId();
    if (!cartId || !lineId) return;

    await shopifyStorefrontFetch(CART_LINES_UPDATE_MUTATION, {
      cartId,
      lines: [{ id: lineId, quantity }]
    });
    
    const data = await shopifyStorefrontFetch(CART_QUERY, { cartId });
    return mapShopifyCart(data?.cart);
  }
);

// Coupons are handled by Shopify Cart as well, but for now we'll keep the points/coupons logic 
// as is or move them to the Fastify backend in Phase 2 if they use custom logic.
export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async () => {
     // Shopify handles cart merging automatically if we associate the cart with a customer token.
     // For now, just fetch the existing cart.
     return await fetchCart();
  }
);

export const repriceCartForCheckout = createAsyncThunk(
  "cart/repriceCartForCheckout",
  async () => {
    return await fetchCart();
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
