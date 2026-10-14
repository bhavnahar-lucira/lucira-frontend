"use client";

import { useDispatch, useSelector } from "react-redux";
import { openAuthModal, selectIsAuthenticated } from "@/redux/features/user/userSlice";

// Hard login gate on add-to-cart: guests must log in before anything is added.
// Redux can't hold a callback, so the deferred add lives here. AuthDialog runs
// it from its success handler, i.e. only after CheckoutAuthForm has finished
// clearing + merging the account cart (running it on the `login` dispatch would
// race that cleanup and get the new item deleted). Dismissing the modal drops it.
let pendingAction = null;

export function runPendingLoginAction() {
  const action = pendingAction;
  pendingAction = null;
  if (action) action();
}

export function clearPendingLoginAction() {
  pendingAction = null;
}

export function useAtcLoginGate() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Returns true when the shopper was sent to log in (caller should stop);
  // `action` then runs once login completes.
  return (action, overrides = {}) => {
    if (isAuthenticated) return false;
    pendingAction = action;
    dispatch(
      openAuthModal({
        useCheckoutAuth: true,
        keepSavedCart: true,
        overrideHeading: overrides.overrideHeading || "Login to Add to Cart",
        overrideSubtext: overrides.overrideSubtext !== undefined
          ? overrides.overrideSubtext
          : "Login / Signup to save this piece to your cart & unlock member offers",
        overrideButtonText: overrides.overrideButtonText || "CONTINUE",
      })
    );
    return true;
  };
}

export { useAtcLoginGate as useLoginGate };

