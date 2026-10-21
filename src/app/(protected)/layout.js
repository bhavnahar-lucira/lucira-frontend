"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/redux/features/user/userSlice";
import { fetchCustomerProfile } from "@/lib/api";
import { withUtms, getCurrentFullPath, saveUtmsFromUrl } from "@/lib/utm";

// Campaign links (emailers / triggers) deep-link into these gated pages with
// utm_* on the URL. Sending a guest to a bare /login dropped both the UTMs
// (GA4 then logged the session as direct/none) and the page they were sent
// to. The login step is unchanged; the redirect now keeps the UTMs on the
// /login URL and remembers the destination so the login page can return there.
const loginUrlFor = () => {
  if (typeof window !== "undefined") {
    saveUtmsFromUrl(new URLSearchParams(window.location.search));
  }
  return withUtms("/login", { redirect: getCurrentFullPath() });
};

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(loginUrlFor());
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
             router.replace(loginUrlFor());
          }
        } catch (err) {
          console.error("[ProtectedLayout] Session verification failure:", err);
          if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
            dispatch(logout());
            router.replace(loginUrlFor());
          }
        }
      };
      checkSession();
    }
  }, [isAuthenticated, accessToken, router, dispatch]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
