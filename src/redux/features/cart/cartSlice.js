import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  shopifyStorefrontFetch, 
  toShopifyGid,
  CART_QUERY, 
  CART_CREATE_MUTATION, 
  CART_LINES_ADD_MUTATION, 
  CART_LINES_UPDATE_MUTATION, 
  CART_LINES_REMOVE_MUTATION 
} from "@/lib/shopify-client";
import { apiFetch } from "@/lib/api";

// Helper to get or create Shopify Cart ID
const getCartId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shopify_cart_id");
};

const setCartId = (id) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("shopify_cart_id", id);
};

// Helper to get or create guest session ID for backend cart syncing
const getSessionId = () => {
  if (typeof window === "undefined") return null;
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
};

// Map Shopify Cart to local state structure, merging custom attributes from the backend cart
const mapShopifyCart = (cart, backendCart = null) => {
  if (!cart) return { items: [], totalQuantity: 0, totalAmount: 0 };
  
  const items = cart.lines?.edges?.map(({ node }) => {
    const variantId = node.merchandise.id;
    // Find matching item in backend cart to restore custom dynamic attributes
    const backendItem = backendCart?.items?.find(i => {
      if (!i.variantId) return false;
      const bVarId = String(i.variantId).toLowerCase();
      const sVarId = String(variantId).toLowerCase();
      return bVarId === sVarId || bVarId.includes(sVarId) || sVarId.includes(bVarId);
    });

    return {
      lineId: node.id,
      variantId,
      quantity: 1, // Force quantity 1 globally as per business requirement
      title: node.merchandise.product.title,
      variantTitle: node.merchandise.title,
      handle: node.merchandise.product.handle,
      sku: node.merchandise.sku,
      price: Number(node.merchandise.price.amount),
      comparePrice: node.merchandise.compareAtPrice ? Number(node.merchandise.compareAtPrice.amount) : null,
      image: node.merchandise.image?.url,
      altText: node.merchandise.image?.altText,
      productId: node.merchandise.product.id,
      inStock: true, // Storefront API only allows adding available items

      // Dynamic metal / diamond attributes from backend cart
      goldWeight: backendItem?.goldWeight || 0,
      goldPrice: backendItem?.goldPrice || 0,
      goldPricePerGram: backendItem?.goldPricePerGram || 0,
      makingCharges: backendItem?.makingCharges || 0,
      diamondCharges: backendItem?.diamondCharges || 0,
      gst: backendItem?.gst || 0,
      finalPrice: backendItem?.finalPrice || 0,
      diamondTotalPcs: backendItem?.diamondTotalPcs || 0,
      engraving: backendItem?.engraving || "",
      engravingText: backendItem?.engravingText || "",
      engravingFont: backendItem?.engravingFont || "",
      giftText: backendItem?.giftText || "",
      color: backendItem?.color || null,
      karat: backendItem?.karat || null,
    };
  }) || [];

  // Recalculate totals locally based on enforced quantity 1
  const totalQuantity = items.length;
  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    items,
    totalQuantity,
    totalAmount,
  };
};

// Module-level variable to track ongoing sync to prevent concurrent double-syncs
let ongoingSyncPromise = null;

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (params = {}, { getState }) => {
    const userId = params?.userId || getState().user?.user?.id || null;
    const cartId = getCartId();
    if (!cartId) return { items: [], totalQuantity: 0, totalAmount: 0 };
    
    // If there's an ongoing sync, wait for it instead of starting a new one
    // this prevents double-adding in React StrictMode (dev) or rapid transitions
    if (ongoingSyncPromise) {
      await ongoingSyncPromise;
    }

    const shopifyPromise = shopifyStorefrontFetch(CART_QUERY, { cartId });
    
    const sessionId = getSessionId();
    const backendPromise = apiFetch(`/api/cart/get?userId=${userId || ""}&sessionId=${sessionId || ""}`)
      .catch(e => {
        console.error("fetchCart backend error:", e);
        return null;
      });

    const [data, backendCart] = await Promise.all([shopifyPromise, backendPromise]);
    
    // Quantity Correction: If any line in Shopify has quantity > 1, correct it to 1
    const linesToCorrect = data?.cart?.lines?.edges
      ?.filter(e => e.node.quantity > 1)
      .map(e => ({
        id: e.node.id,
        quantity: 1
      })) || [];

    if (linesToCorrect.length > 0) {
      console.log("[fetchCart] Correcting line quantities to 1...", linesToCorrect);
      try {
        await shopifyStorefrontFetch(CART_LINES_UPDATE_MUTATION, {
          cartId,
          lines: linesToCorrect
        });
        // Re-fetch Shopify cart to get updated state after correction
        const correctedData = await shopifyStorefrontFetch(CART_QUERY, { cartId });
        return mapShopifyCart(correctedData?.cart, backendCart);
      } catch (err) {
        console.error("[fetchCart] Quantity correction failed:", err);
      }
    }
    
    // Auto-heal/sync backend cart from storefront lines if backend cart has no items
    let finalBackendCart = backendCart;
    if (data?.cart?.lines?.edges?.length > 0 && (!backendCart || !backendCart.items || backendCart.items.length === 0)) {
      try {
        console.log("[fetchCart] Storefront cart has items but backend is empty. Syncing...");
        const itemsToSync = data.cart.lines.edges.map(({ node }) => ({
          variantId: node.merchandise.id,
          productId: node.merchandise.product.id,
          quantity: node.quantity,
          price: Number(node.merchandise.price.amount),
          variantTitle: node.merchandise.title,
          title: node.merchandise.product.title,
          sku: node.merchandise.sku || "",
          image: node.merchandise.image?.url || "",
          handle: node.merchandise.product.handle || "",
        }));

        finalBackendCart = await apiFetch("/api/cart/sync", {
          method: "POST",
          body: JSON.stringify({
            userId,
            sessionId,
            items: itemsToSync
          })
        });
        console.log("[fetchCart] Dynamic sync complete:", finalBackendCart);
      } catch (syncErr) {
        console.error("[fetchCart] Dynamic sync failed:", syncErr);
      }
    } else if (finalBackendCart?.items?.length > 0 && cartId) {
      // Bidirectional Sync: If MongoDB has items missing in Shopify, sync them to Shopify.
      // This happens after login when items from other devices/sessions need to be restored.
      const shopifyLines = data?.cart?.lines?.edges || [];
      const shopifyVariants = new Map(
        shopifyLines.map(e => [e.node.merchandise.id.toLowerCase(), e.node.quantity])
      );
      
      const missingInShopify = finalBackendCart.items.filter(item => {
        const vid = toShopifyGid(item.variantId, "ProductVariant").toLowerCase();
        const existingQty = shopifyVariants.get(vid) || 0;
        // Only add if it's completely missing or has a lower quantity in Shopify (merged state)
        return existingQty < item.quantity;
      });

      if (missingInShopify.length > 0) {
        console.log("[fetchCart] MongoDB items missing or higher quantity in Shopify. Syncing...", missingInShopify);
        
        // Wrap the sync in a promise to prevent concurrent runs
        ongoingSyncPromise = (async () => {
          try {
            // We use CART_LINES_ADD_MUTATION which adds to existing quantity.
            // If the item exists but has lower quantity, we only add the difference.
            const linesToAdd = missingInShopify.map(item => {
              const vid = toShopifyGid(item.variantId, "ProductVariant").toLowerCase();
              const existingQty = shopifyVariants.get(vid) || 0;
              
              // Strictly enforce quantity 1 for sync as well
              // Only add if it doesn't exist in Shopify at all
              const diff = existingQty > 0 ? 0 : 1;
              
              return {
                merchandiseId: toShopifyGid(item.variantId, "ProductVariant"),
                quantity: diff
              };
            }).filter(l => l.quantity > 0);

            if (linesToAdd.length > 0) {
              await shopifyStorefrontFetch(CART_LINES_ADD_MUTATION, {
                cartId,
                lines: linesToAdd
              });
            }
          } catch (err) {
            console.error("[fetchCart] MongoDB -> Shopify sync failed:", err);
          } finally {
            ongoingSyncPromise = null;
          }
        })();

        await ongoingSyncPromise;
        
        // Re-fetch Shopify cart to get updated state
        const updatedShopifyData = await shopifyStorefrontFetch(CART_QUERY, { cartId });
        if (updatedShopifyData?.cart) {
          return mapShopifyCart(updatedShopifyData.cart, finalBackendCart);
        }
      }
    }
    
    return mapShopifyCart(data?.cart, finalBackendCart);
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, product }, { rejectWithValue, getState }) => {
    const state = getState();
    const finalUserId = userId || state.user?.user?.id || null;
    const sessionId = getSessionId();
    let cartId = getCartId();
    
    const rawVariantId = product.shopifyVariantId || product.variantId || product.id;
    const variantId = toShopifyGid(rawVariantId, "ProductVariant");

    // Enforce Quantity of 1 and avoid duplicates with same attributes
    // We treat items with different attributes (engraving, metal, etc.) as distinct
    const existingItems = state.cart?.items || [];
    const isDuplicate = existingItems.some(item => {
      const sameVariant = String(item.variantId).toLowerCase() === variantId.toLowerCase();
      
      const itemEngraving = (item.engraving || "").trim().toLowerCase();
      const productEngraving = (product.engraving || "").trim().toLowerCase();
      const sameEngraving = itemEngraving === productEngraving;

      const sameKarat = String(item.karat || "").toLowerCase() === String(product.karat || "").toLowerCase();
      const sameColor = String(item.color || "").toLowerCase() === String(product.color || "").toLowerCase();
      const sameSize = String(item.size || "").toLowerCase() === String(product.size || "").toLowerCase();
      
      return sameVariant && sameEngraving && sameKarat && sameColor && sameSize;
    });

    if (isDuplicate) {
      console.log("[addToCart] Item already in cart with same attributes. Skipping add.");
      return state.cart; // Return existing cart state
    }
    
    // 1. Shopify Storefront Mutation
    let shopifyCartData = null;
    if (!cartId) {
      const data = await shopifyStorefrontFetch(CART_CREATE_MUTATION, {
        input: {
          lines: [{ merchandiseId: variantId, quantity: 1 }] // Force quantity 1
        }
      });
      
      const userErrors = data?.cartCreate?.userErrors;
      if (userErrors && userErrors.length > 0) {
        console.error("Shopify cartCreate UserErrors:", userErrors);
        return rejectWithValue(userErrors[0].message);
      }

      const newCart = data?.cartCreate?.cart;
      if (newCart) {
        setCartId(newCart.id);
        const fullData = await shopifyStorefrontFetch(CART_QUERY, { cartId: newCart.id });
        shopifyCartData = fullData?.cart;
      }
    } else {
      const data = await shopifyStorefrontFetch(CART_LINES_ADD_MUTATION, {
        cartId,
        lines: [{ merchandiseId: variantId, quantity: 1 }] // Force quantity 1
      });

      const userErrors = data?.cartLinesAdd?.userErrors;
      if (userErrors && userErrors.length > 0) {
        console.error("Shopify cartLinesAdd UserErrors:", userErrors);
        // If cart not found, clear local cartId and retry once
        if (userErrors.some(e => e.message.includes("not found") || e.code === "NOT_FOUND")) {
          localStorage.removeItem("shopify_cart_id");
          return rejectWithValue("Cart not found, please try adding again.");
        }
        return rejectWithValue(userErrors[0].message);
      }

      const fullData = await shopifyStorefrontFetch(CART_QUERY, { cartId });
      shopifyCartData = fullData?.cart;
    }

    // 2. Parallel Fastify Backend Call
    let backendCart = null;
    try {
      backendCart = await apiFetch("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({
          userId: finalUserId,
          sessionId,
          product: {
            ...product,
            variantId: toShopifyGid(product.shopifyVariantId || product.variantId || product.id, "ProductVariant"),
            price: Number(product.price || 0),
            quantity: 1 // Force quantity 1
          }
        })
      });
      console.log("[addToCart] Backend Cart updated successfully:", backendCart);
    } catch (e) {
      console.error("[addToCart] Backend Cart update failed:", e);
    }

    if (shopifyCartData) {
      return mapShopifyCart(shopifyCartData, backendCart);
    }
    
    return rejectWithValue("Failed to add to cart");
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ userId, lineId }, { getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();
    const cartId = getCartId();
    if (!cartId || !lineId) return { items: [], totalQuantity: 0, totalAmount: 0 };

    let targetLineId = lineId;

    // Check if the lineId passed is actually a variantId or productId
    const state = getState();
    const items = state.cart?.items || [];
    const hasLineId = items.some(item => item.lineId === lineId);

    let variantId = null;

    const foundItem = items.find(item => 
      item.lineId === lineId ||
      item.variantId === lineId || 
      item.productId === lineId ||
      (item.variantId && item.variantId.toString().toLowerCase().includes(lineId.toString().toLowerCase())) ||
      (lineId && lineId.toString().toLowerCase().includes(item.variantId.toString().toLowerCase()))
    );

    if (foundItem) {
      targetLineId = foundItem.lineId;
      variantId = foundItem.variantId;
    }

    // 1. Shopify storefront remove
    await shopifyStorefrontFetch(CART_LINES_REMOVE_MUTATION, {
      cartId,
      lineIds: [targetLineId]
    });

    // 2. Fastify backend remove
    let backendCart = null;
    if (variantId) {
      try {
        backendCart = await apiFetch("/api/cart/remove", {
          method: "POST",
          body: JSON.stringify({
            userId: finalUserId,
            sessionId,
            variantId
          })
        });
      } catch (e) {
        console.error("removeFromCart backend error:", e);
      }
    }

    const data = await shopifyStorefrontFetch(CART_QUERY, { cartId });
    return mapShopifyCart(data?.cart, backendCart);
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ userId, lineId, currentVariantId, quantity }, { getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();
    const cartId = getCartId();
    const lookupId = lineId || currentVariantId;
    if (!cartId || !lookupId) return { items: [], totalQuantity: 0, totalAmount: 0 };

    let targetLineId = lookupId;
    let resolvedVariantId = currentVariantId || null;

    // Check if the lookupId passed is actually a variantId or productId or lineId
    const state = getState();
    const items = state.cart?.items || [];

    const foundItem = items.find(item => 
      item.lineId === lookupId ||
      item.variantId === lookupId || 
      item.productId === lookupId ||
      (item.variantId && item.variantId.toString().toLowerCase().includes(lookupId.toString().toLowerCase())) ||
      (lookupId && lookupId.toString().toLowerCase().includes(item.variantId.toString().toLowerCase()))
    );

    if (foundItem) {
      targetLineId = foundItem.lineId;
      resolvedVariantId = foundItem.variantId;
    }

    // 1. Shopify Storefront update
    await shopifyStorefrontFetch(CART_LINES_UPDATE_MUTATION, {
      cartId,
      lines: [{ id: targetLineId, quantity }]
    });

    // 2. Fastify backend update
    let backendCart = null;
    if (resolvedVariantId) {
      try {
        backendCart = await apiFetch("/api/cart/update", {
          method: "POST",
          body: JSON.stringify({
            userId: finalUserId,
            sessionId,
            currentVariantId: resolvedVariantId,
            quantity
          })
        });
      } catch (e) {
        console.error("updateCartItem backend error:", e);
      }
    }

    const data = await shopifyStorefrontFetch(CART_QUERY, { cartId });
    return mapShopifyCart(data?.cart, backendCart);
  }
);

export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async ({ userId } = {}, { dispatch, getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();
    const cartId = getCartId();

    // Step 1: Merge MongoDB guest cart into user cart
    if (finalUserId && sessionId) {
      try {
        await apiFetch("/api/cart/merge", {
          method: "POST",
          body: JSON.stringify({
            userId: finalUserId,
            sessionId
          })
        });
      } catch (e) {
        console.error("mergeCart backend error:", e);
      }
    }

    // Step 2: If there's a Shopify storefront cart, sync its lines into the user's
    // MongoDB cart so all items (from any source) are present for checkout.
    // This handles the case where guest added items via Shopify cart only.
    if (finalUserId && cartId) {
      try {
        const shopifyData = await shopifyStorefrontFetch(CART_QUERY, { cartId });
        const shopifyLines = shopifyData?.cart?.lines?.edges || [];
        if (shopifyLines.length > 0) {
          const itemsToSync = shopifyLines.map(({ node }) => ({
            variantId: node.merchandise.id,
            productId: node.merchandise.product.id,
            quantity: node.quantity,
            price: Number(node.merchandise.price.amount),
            finalPrice: Number(node.merchandise.price.amount),
            variantTitle: node.merchandise.title,
            title: node.merchandise.product.title,
            sku: node.merchandise.sku || "",
            image: node.merchandise.image?.url || "",
            handle: node.merchandise.product.handle || "",
          }));

          // Sync Shopify cart items into user's MongoDB cart (merging, not replacing)
          await apiFetch("/api/cart/sync", {
            method: "POST",
            body: JSON.stringify({
              userId: finalUserId,
              sessionId,
              items: itemsToSync
            })
          }).catch(e => console.error("mergeCart Shopify sync error:", e));
        }
      } catch (e) {
        console.error("mergeCart Shopify fetch error:", e);
      }
    }

    // Step 3: Fetch the final merged cart state
    const result = await dispatch(fetchCart({ userId: finalUserId })).unwrap();
    return result;
  }
);

export const repriceCartForCheckout = createAsyncThunk(
  "cart/repriceCartForCheckout",
  async ({ userId } = {}, { dispatch, getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();

    // Call backend recalculation endpoint
    try {
      await apiFetch("/api/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          userId: finalUserId,
          sessionId
        })
      });
    } catch (e) {
      console.error("repriceCartForCheckout backend error:", e);
    }

    const result = await dispatch(fetchCart({ userId: finalUserId })).unwrap();
    return result;
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
      // Clear cart on global logout
      .addCase("user/logout", (state) => {
        state.items = [];
        state.totalQuantity = 0;
        state.totalAmount = 0;
        state.appliedCoupon = null;
        state.nectorPoints = null;
        state.error = null;
      })
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(repriceCartForCheckout.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(mergeCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
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
