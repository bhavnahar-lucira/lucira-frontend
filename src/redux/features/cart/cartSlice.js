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

const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47753346973914";

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
export const getSessionId = () => {
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

      // Extract attributes from Shopify selectedOptions as fallback
      const shopifyOptions = node.merchandise.selectedOptions || [];
      const shopifyColor = shopifyOptions.find(o => o.name.toLowerCase().includes("color") || o.name.toLowerCase().includes("metal"))?.value;
      const shopifySize = shopifyOptions.find(o => o.name.toLowerCase() === "size" || o.name.toLowerCase().includes("ring"))?.value;
      const parsedTitle = node.merchandise.title !== "Default Title" ? node.merchandise.title : "";

      // Try to intelligently parse color/karat if Shopify option just returned "14KT Rose Gold"
      let fallbackKarat = null;
      let fallbackColor = null;
      if (shopifyColor) {
        if (shopifyColor.toLowerCase().includes("14k")) fallbackKarat = "14K";
        else if (shopifyColor.toLowerCase().includes("18k")) fallbackKarat = "18K";
        
        if (shopifyColor.toLowerCase().includes("rose")) fallbackColor = "Rose Gold";
        else if (shopifyColor.toLowerCase().includes("yellow")) fallbackColor = "Yellow Gold";
        else if (shopifyColor.toLowerCase().includes("white")) fallbackColor = "White Gold";
      }

      const isFreeGift = backendItem?.isFreeGift || false;
      const backendPrice = Number(backendItem?.finalPrice || backendItem?.price || 0);
      const shopifyPrice = Number(node.merchandise.price.amount);
      const finalUnitPrice = isFreeGift ? 0 : (backendPrice > 0 ? backendPrice : shopifyPrice);

      return {
        lineId: node.id,
        variantId,
        quantity: node.quantity,
        title: (isFreeGift && variantId === GOLDCOIN_VARIANT_ID) ? "Free Gold Coin" : node.merchandise.product.title,
        variantTitle: (isFreeGift && variantId === GOLDCOIN_VARIANT_ID) ? "Free Gift" : node.merchandise.title,
        handle: node.merchandise.product.handle,
        sku: node.merchandise.sku,
        price: finalUnitPrice,
        comparePrice: node.merchandise.compareAtPrice ? Number(node.merchandise.compareAtPrice.amount) : null,
        image: node.merchandise.image?.url,
        altText: node.merchandise.image?.altText,
        productId: node.merchandise.product.id,
        inStock: backendItem?.inStock !== undefined ? backendItem.inStock : (node.merchandise.availableForSale && !node.merchandise.currentlyNotInStock),
        isFreeGift,
        category: backendItem?.category || backendItem?.type || "",
        estDelivery: backendItem?.estDelivery || null,
        leadTime: backendItem?.leadTime || 12,
        availableSizes: backendItem?.availableSizes || [],

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
        color: backendItem?.color || fallbackColor || shopifyColor || null,
        karat: backendItem?.karat || fallbackKarat || null,
        size: backendItem?.size || shopifySize || parsedTitle,
        variantOptions: backendItem?.variantOptions || [],
        properties: backendItem?.properties || {},
      };
    }) || [];

  // Recalculate totals locally
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

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
    const context = params?.context || "storefront";
    const cartId = getCartId();
    if (!cartId) return { items: [], totalQuantity: 0, totalAmount: 0, context };
    
    // If there's an ongoing sync, wait for it instead of starting a new one
    // this prevents double-adding in React StrictMode (dev) or rapid transitions
    if (ongoingSyncPromise) {
      await ongoingSyncPromise;
    }

    const shopifyPromise = shopifyStorefrontFetch(CART_QUERY, { cartId });
    
    const sessionId = getSessionId();
    const backendPromise = apiFetch(`/api/cart/get?userId=${userId || ""}&sessionId=${sessionId || ""}&context=${context}`)
      .catch(e => {
        console.error("fetchCart backend error:", e);
        return null;
      });

    const [data, backendCart] = await Promise.all([shopifyPromise, backendPromise]);
    
    // Quantity correction logic removed to allow quantity > 1
    
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
            context,
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
              
              // Add the difference in quantity
              const diff = item.quantity > existingQty ? item.quantity - existingQty : 0;
              
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
  async ({ userId, product, context = "storefront" }, { rejectWithValue, getState }) => {
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
      // Skip duplicate check for Gold Coins to allow multiple quantities
      if (String(variantId).toLowerCase() === GOLDCOIN_VARIANT_ID.toLowerCase()) return false;

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
          lines: [{ merchandiseId: variantId, quantity: product.quantity || 1 }]
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
        lines: [{ merchandiseId: variantId, quantity: product.quantity || 1 }]
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
          context,
          product: {
            ...product,
            variantId: toShopifyGid(product.shopifyVariantId || product.variantId || product.id, "ProductVariant"),
            price: Number(product.finalPrice || product.price || 0), // Prefer dynamic finalPrice for calculation
            finalPrice: Number(product.finalPrice || product.price || 0),
            quantity: product.quantity || 1
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
  async ({ userId, lineId, context = "storefront" }, { getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();
    const cartId = getCartId();
    if (!cartId || !lineId) return { items: [], totalQuantity: 0, totalAmount: 0, context };

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
            variantId,
            context
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
  async ({ userId, lineId, currentVariantId, nextVariantId, quantity, size, price, finalPrice, variantTitle, inStock, sku, goldWeight, diamondTotalPcs, diamondCarat, leadTime, estDelivery, context = "storefront" }, { getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();
    const cartId = getCartId();
    const lookupId = lineId || currentVariantId;
    if (!cartId || !lookupId) return { items: [], totalQuantity: 0, totalAmount: 0, context };

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
    const lineUpdate = { id: targetLineId };
    if (quantity !== undefined) lineUpdate.quantity = quantity;
    if (nextVariantId) lineUpdate.merchandiseId = toShopifyGid(nextVariantId, "ProductVariant");

    await shopifyStorefrontFetch(CART_LINES_UPDATE_MUTATION, {
      cartId,
      lines: [lineUpdate]
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
            nextVariantId,
            quantity,
            size,
            price,
            finalPrice,
            variantTitle,
            inStock,
            sku,
            goldWeight,
            diamondTotalPcs,
            diamondCarat,
            leadTime,
            estDelivery,
            context
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
  async ({ userId, context = "storefront" } = {}, { dispatch, getState }) => {
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
            sessionId,
            context
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
              context,
              items: itemsToSync
            })
          }).catch(e => console.error("mergeCart Shopify sync error:", e));
        }
      } catch (e) {
        console.error("mergeCart Shopify fetch error:", e);
      }
    }

    // Step 3: Fetch the final merged cart state
    const result = await dispatch(fetchCart({ userId: finalUserId, context })).unwrap();
    return result;
  }
);

export const repriceCartForCheckout = createAsyncThunk(
  "cart/repriceCartForCheckout",
  async ({ userId, context = "storefront" } = {}, { dispatch, getState }) => {
    const finalUserId = userId || getState().user?.user?.id || null;
    const sessionId = getSessionId();

    // Call backend recalculation endpoint
    try {
      await apiFetch("/api/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          userId: finalUserId,
          sessionId,
          context
        })
      });
    } catch (e) {
      console.error("repriceCartForCheckout backend error:", e);
    }

    const result = await dispatch(fetchCart({ userId: finalUserId, context })).unwrap();
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

      // Clear local storage to prevent cart resurrection from Shopify/Backend sync
      if (typeof window !== "undefined") {
        localStorage.removeItem("shopify_cart_id");
        localStorage.removeItem("checkout_selection");
        localStorage.removeItem("checkoutBillingAddressSelection");
      }
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

        // Clear local storage to prevent cart resurrection for new sessions
        if (typeof window !== "undefined") {
          localStorage.removeItem("shopify_cart_id");
          localStorage.removeItem("checkout_selection");
          localStorage.removeItem("checkoutBillingAddressSelection");
        }
      })
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(repriceCartForCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(repriceCartForCheckout.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(repriceCartForCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(mergeCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalQuantity = action.payload.totalQuantity || 0;
          state.totalAmount = action.payload.totalAmount || 0;
        }
      })
      .addCase(mergeCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
