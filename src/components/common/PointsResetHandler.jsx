"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { removePoints } from "@/redux/features/cart/cartSlice";

export default function PointsResetHandler() {
  const pathname = usePathname();
  const dispatch = useDispatch();

  useEffect(() => {
    // If we are NOT on the payment page, and we have points applied, we should clear them.
    // This handles cases like manual URL changes, back button, or clicking the cart icon.
    if (pathname !== "/checkout/payment") {
      dispatch(removePoints());
    }
  }, [pathname, dispatch]);

  return null;
}
