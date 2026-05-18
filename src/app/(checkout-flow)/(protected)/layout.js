"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { repriceCartForCheckout } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";

export default function CheckoutProtectedLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(
    (state) => state.user
  );
  const user = useSelector((state) => state.user.user);
  const hasRepricedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login"); // Redirect to login page instead of homepage
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || hasRepricedRef.current) return;

    hasRepricedRef.current = true;
    dispatch(repriceCartForCheckout({ userId: user?.id }))
      .unwrap()
      .then((data) => {
        if (data?.pricesChanged) {
          toast.info("Some cart prices were updated for checkout.", {
            position: "top-right",
            autoClose: 3000,
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

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
