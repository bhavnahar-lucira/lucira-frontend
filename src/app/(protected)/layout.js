"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/redux/features/user/userSlice";
import { apiFetch } from "@/lib/api";
import { shopifyStorefrontFetch, CUSTOMER_QUERY } from "@/lib/shopify-client";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (accessToken) {
      // Verify session with Storefront API
      const checkSession = async () => {
        try {
          const data = await shopifyStorefrontFetch(CUSTOMER_QUERY, {
            customerAccessToken: accessToken
          });
          
          if (!data?.customer) {
            throw new Error("Invalid session");
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          dispatch(logout());
          router.push("/login");
        }
      };
      checkSession();
    }
  }, [isAuthenticated, accessToken, router, dispatch]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
