"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Single hook for reading and writing the shopper's pincode.
//
// It deliberately speaks the protocol the PDP already established so every
// surface stays in sync without any of them knowing about each other:
//
//   1. cookie  `user_pincode`               — 1 year, survives reloads
//   2. redux   `user.pincode`               — persisted via redux-persist
//   3. event   `lucira:user-pincode`        — live cross-component broadcast
//
// ProductPageClient.jsx and AtcBar.jsx already read (1) and listen to (3), so
// setting a pincode in the header updates the PDP with no extra wiring.
//
// The cookie is the transport, and it is read through useSyncExternalStore
// rather than an effect. That matters here for two reasons: collection and
// product pages are statically generated, so the server has no cookie to read
// (getServerSnapshot returns "" and React reconciles after hydration with no
// mismatch); and this repo builds with the React Compiler, whose
// `set-state-in-effect` rule correctly rejects hydrating state inside an effect.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPincode as setPincodeAction, selectPincode } from "@/redux/features/user/userSlice";

export const USER_PINCODE_COOKIE = "user_pincode";
export const USER_PINCODE_EVENT = "lucira:user-pincode";

export function readPincodeCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${USER_PINCODE_COOKIE}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]).replace(/\D/g, "").slice(0, 6) : "";
}

function writePincodeCookie(pincode) {
  if (typeof document === "undefined") return;
  document.cookie = pincode
    ? `${USER_PINCODE_COOKIE}=${pincode}; path=/; max-age=31536000; SameSite=Lax`
    : `${USER_PINCODE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function broadcast(pincode) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(USER_PINCODE_EVENT, { detail: { pincode } })
  );
}

/* ---- external store: the cookie, kept live by the broadcast event --------- */

function subscribe(onChange) {
  window.addEventListener(USER_PINCODE_EVENT, onChange);
  return () => window.removeEventListener(USER_PINCODE_EVENT, onChange);
}

// Returns a primitive, so React's identity check is a value comparison.
const getSnapshot = () => readPincodeCookie();
const getServerSnapshot = () => "";

/**
 * @returns {{
 *   pincode: string,
 *   commit: (pincode: string) => void,
 *   clear: () => void
 * }}
 */
export function useUserPincode() {
  const dispatch = useDispatch();
  const reduxPincode = useSelector(selectPincode);
  const pincode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // If redux-persist still holds a pincode but the cookie has expired, restore
  // the cookie from it. Writing a cookie and firing an event are external-system
  // syncs — no setState, so this stays clear of cascading renders.
  useEffect(() => {
    const saved = String(reduxPincode || "").replace(/\D/g, "").slice(0, 6);
    if (saved.length === 6 && readPincodeCookie() !== saved) {
      writePincodeCookie(saved);
      broadcast(saved);
    }
  }, [reduxPincode]);

  const commit = useCallback(
    (value) => {
      const next = String(value || "").replace(/\D/g, "").slice(0, 6);
      if (next.length !== 6) return;
      writePincodeCookie(next);
      dispatch(setPincodeAction(next));
      broadcast(next);
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    writePincodeCookie("");
    dispatch(setPincodeAction(""));
    broadcast("");
  }, [dispatch]);

  return { pincode, commit, clear };
}
