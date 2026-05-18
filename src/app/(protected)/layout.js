"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/redux/features/user/userSlice";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      // Verify session with backend
      const checkSession = async () => {
        try {
          const res = await fetch("/api/customer/profile");
          if (!res.ok) {
            if (res.status === 401 || res.status === 404) {
              dispatch(logout());
              router.push("/login");
            }
          }
        } catch (err) {
          console.error("Session verification failed:", err);
        }
      };
      checkSession();
    }
  }, [isAuthenticated, router, dispatch]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
