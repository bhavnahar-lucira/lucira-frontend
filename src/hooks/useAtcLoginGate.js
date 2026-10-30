"use client";

import { useDispatch, useSelector } from "react-redux";
import { openAuthModal, selectIsAuthenticated } from "@/redux/features/user/userSlice";

// Hard login gate on add-to-cart: guests must log in before anything is added.
// Redux can't hold a callback, so the deferred add lives here. AuthDialog runs
// it from its success handler, i.e. only after CheckoutAuthForm has finished
// clearing + merging the account cart (running it on the `login` dispatch would
// race that cleanup and get the new item deleted). Dismissing the modal drops it.
//
// The PDP "Unlock Exclusive Offers" strip reuses the same gate (and the same
// compact popup / bottom-sheet design) with its own copy, so the gate takes the
// modal text as options and only defaults to the add-to-cart wording.
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
  // `action` then runs once login completes. `productImage` (a URL) is shown
  // in the modal so the shopper sees the piece they are saving.
  return (
    action,
    {
      productImage = null,
      heading = "Perfect! Let’s Save Your Selection",
      subtext = "Login / Signup to save this piece to your cart & unlock member offers",
      buttonText = "Save My Selection",
      rewardSource = "atc_login",
    } = {}
  ) => {
    if (isAuthenticated) return false;
    pendingAction = action;
    dispatch(
      openAuthModal({
        useCheckoutAuth: true,
        keepSavedCart: true,
        rewardSource,
        // "atc" switches CheckoutAuthForm/AuthDialog to the add-to-cart design
        // (product thumbnail, floating close on mobile, title-case button).
        variant: "atc",
        productImage: typeof productImage === "string" && productImage ? productImage : null,
        overrideHeading: heading,
        overrideSubtext: subtext,
        overrideButtonText: buttonText,
      })
    );
    return true;
  };
}
