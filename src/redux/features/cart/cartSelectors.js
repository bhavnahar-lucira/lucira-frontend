export const selectCart = (state) => state.cart;

export const selectCartId = (state) => state.cart.cartId;

export const selectCartItems = (state) => state.cart.items;

export const selectCartQuantity = (state) =>
  state.cart.totalQuantity;