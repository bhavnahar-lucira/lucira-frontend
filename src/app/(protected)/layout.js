"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/redux/features/user/userSlice";
import { fetchCustomerProfile } from "@/lib/api";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (accessToken) {
      // Verify session via Fastify Backend (proxies to Shopify Admin API if needed)
      const checkSession = async () => {
        try {
          if (process.env.NODE_ENV === "development") {
             console.log("[ProtectedLayout] Running authenticated session check...");
          }
          
          // Use authenticated helper
          const data = await fetchCustomerProfile(accessToken);
          
          if (process.env.NODE_ENV === "development") {
            console.log("[ProtectedLayout] Session check response:", data);
          }

          if (!data || !data.customer) {
             console.warn("[ProtectedLayout] Session invalid. Logging out.");
             dispatch(logout());
             router.replace("/login");
          }
        } catch (err) {
          console.error("[ProtectedLayout] Session verification failure:", err);
          if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
            dispatch(logout());
            router.replace("/login");
          }
        }
      };
      checkSession();
    }
  }, [isAuthenticated, accessToken, router, dispatch]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
