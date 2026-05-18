import { createSlice } from "@reduxjs/toolkit";

const MAX_RECENTLY_VIEWED = 12;

const initialState = {
  title: "Recently Viewed",
  products: [],
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState,
  reducers: {
    addRecentlyViewed: (state, action) => {
      const product = action.payload;
      if (!product) return;

      const productId = product.shopifyId || product.id || product.handle;
      if (!productId) return;

      const existingIndex = state.products.findIndex(
        (item) => (item.shopifyId || item.id || item.handle) === productId
      );

      const previewProduct = {
        id: product.id,
        shopifyId: product.shopifyId,
        handle: product.handle,
        title: product.title,
        label: product.label,
        colors: product.colors,
        price: product.price,
        compare_price: product.compare_price || product.compareAtPrice,
        compareAtPrice: product.compare_price || product.compareAtPrice,
        description: product.description,
        tags: product.tags,
        images: product.images || (product.featuredImage ? [{ url: product.featuredImage, altText: product.title }] : []),
        variants: product.variants || [],
        media: product.media || [],
        reviews: product.reviews,
        reviewStats: product.reviewStats,
        matchingProductIds: product.matchingProductIds,
        hasSimilar: product.hasSimilar,
        diamondDiscount: product.diamondDiscount,
        makingDiscount: product.makingDiscount,
        productMetafields: product.productMetafields,
      };

      if (existingIndex >= 0) {
        state.products.splice(existingIndex, 1);
      }

      state.products.unshift(previewProduct);
      if (state.products.length > MAX_RECENTLY_VIEWED) {
        state.products = state.products.slice(0, MAX_RECENTLY_VIEWED);
      }
    },
    setRecentlyViewedTitle: (state, action) => {
      state.title = action.payload || initialState.title;
    },
    clearRecentlyViewed: (state) => {
      state.products = [];
      state.title = initialState.title;
    },
  },
});

export const {
  addRecentlyViewed,
  setRecentlyViewedTitle,
  clearRecentlyViewed,
} = recentlyViewedSlice.actions;

export const selectRecentlyViewed = (state) => state.recentlyViewed || initialState;

export default recentlyViewedSlice.reducer;
