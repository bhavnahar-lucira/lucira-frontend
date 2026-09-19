"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "@/redux/features/user/userSlice";
import { pushIdentify } from "@/lib/gtm";

/**
 * Re-identifies a shopper who was already signed in when the page loaded.
 *
 * The `login` event fires once, at the moment of logging in. The user slice is
 * persisted to localStorage and restored behind PersistGate, so on every later
 * visit the shopper is authenticated in Redux but has never been announced to
 * the analytics layer — their events land against an anonymous LUID instead of
 * their phone number. Sessions last weeks, so this compounds.
 *
 * This provider sits inside PersistGate, which means the first render here
 * already has the rehydrated user.
 */
export function AnalyticsProvider({ children }) {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const identifiedAs = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Identify once per shopper per page load. Guarding on the number rather
    // than a plain boolean means an account switch still re-identifies.
    const key = user.mobile || user.phone || user.id;
    if (!key || identifiedAs.current === key) return;
    identifiedAs.current = key;

    pushIdentify({
      id: user.id,
      mobile: user.mobile || user.phone,
      email: user.email,
      name: user.name,
    });
  }, [isAuthenticated, user]);

  return <>{children}</>;
}
