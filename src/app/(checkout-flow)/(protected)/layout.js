"use client";

import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { repriceCartForCheckout } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";

export default function CheckoutProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector(
    (state) => state.user
  );
  const user = useSelector((state) => state.user.user);
  const hasRepricedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || accessToken.startsWith('simulated_')) {
      if (!pathname.startsWith("/checkout")) {
        router.push("/login"); // Redirect to login page instead of homepage
      }
    }
  }, [isAuthenticated, accessToken, router, pathname]);

  useEffect(() => {
    if (!isAuthenticated || hasRepricedRef.current) return;

    hasRepricedRef.current = true;
    dispatch(repriceCartForCheckout({ userId: user?.id }))
      .unwrap()
      .then((data) => {
        if (data?.pricesChanged) {
          toast.info("Your cart total has been updated to today's live gold rates.", {
            position: "top-right",
            autoClose: 4000,
            closeOnClick: true,
            theme: "light",
          });
        }
      })
      .catch((err) => {
        console.error("Checkout repricing failed:", err);
        hasRepricedRef.current = false;
      });
  }, [dispatch, isAuthenticated, user?.id]);

  if (!isAuthenticated || !accessToken || accessToken.startsWith('simulated_')) {
    if (!pathname.startsWith("/checkout")) {
      return null;
    }
  }

  return <>{children}</>;
}
