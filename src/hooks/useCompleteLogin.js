"use client";

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { apiFetch } from "@/lib/api";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";
import { toE164 } from "@/lib/phone";

const NITRO_ORG_ID = process.env.NEXT_PUBLIC_NITRO_ORG_ID;

// Same best-effort Nitro enrichment OtpSpinAuth does after a popup login.
function nitroEnrich({ email, phone, name }) {
  if (typeof window === "undefined" || typeof window.nitro?.identify !== "function") return;
  if (!phone) return;
  try {
    window.nitro.identify(
      email || "",
      phone,
      name || "",
      { source: "popup", org_token: NITRO_ORG_ID, is_consented: true },
      function () {
        try {
          window.nitro.pushEvent("is_consented", { phone });
          window.nitro.pushEvent("otp_verified", { phone });
        } catch (_) {}
      }
    );
  } catch (_) {}
}

/**
 * Post-OTP session bootstrap shared with the wheel's loginSuccess: GTM
 * signup/login, Redux login, Nitro, avatar, cart + wishlist merge. Never
 * navigates — the caller decides when to leave the popup.
 */
export function useCompleteLogin() {
  const dispatch = useDispatch();

  return useCallback(
    async (data, { isSignup = false, mobile = "", email = "", name = "" } = {}) => {
      const user = data?.user || data?.customer || {};
      const userId = user.id;
      const phone = toE164(mobile || user.mobile || user.phone) || mobile;
      const displayName = user.first_name
        ? `${user.first_name} ${user.last_name || ""}`.trim()
        : name || phone || "";

      const gtmUser = { id: userId, mobile: phone, phone, email: user.email, name: displayName };
      if (isSignup) pushSignup(gtmUser);
      else pushLogin(gtmUser);

      dispatch(
        login({
          user: {
            id: userId,
            mobile: phone,
            phone,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            party_id: null,
            name: displayName,
          },
          accessToken: data.accessToken,
        })
      );

      nitroEnrich({ email: email || user.email, phone: mobile, name: displayName });

      try {
        const av = await apiFetch("/api/customer/profile/avatar");
        if (av?.avatar) dispatch(setAvatar(av.avatar));
      } catch (_) {}
      try {
        await dispatch(mergeCart({ userId })).unwrap();
      } catch (err) {
        console.error("Cart merge failed:", err);
      }
      try {
        await dispatch(mergeGuestWishlist()).unwrap();
      } catch (err) {
        console.error("Wishlist merge failed:", err);
      }
    },
    [dispatch]
  );
}
