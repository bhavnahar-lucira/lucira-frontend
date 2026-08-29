"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Turns the shopper's saved pincode into the `stores` parameter the collection
// endpoint uses to order products by store proximity.
//
// The value is a comma-separated list of store collection handles, NEAREST
// FIRST, followed by the non-visitable warehouse. The backend treats that order
// as the bucket ranking, so the whole ordering policy is expressed here in one
// line and the server stays a pure function of it.
//
// Costs nothing extra: `resolveNearestStores` is the same memoised resolver the
// header already uses, so on a page where the header has resolved the pincode
// this returns from cache without a single additional request.
//
// Shaped as an external store rather than effect-driven state for the same
// reason as useUserPincode: this repo builds with the React Compiler, whose
// `set-state-in-effect` rule correctly rejects hydrating state inside an effect.
// Resolution is kicked off from an effect — that is an external-system sync, not
// a setState — and the result is published through the store below.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useSyncExternalStore } from "react";
import { useUserPincode } from "@/hooks/useUserPincode";
import { resolveNearestStores } from "@/lib/nearestStore";

/** pincode -> "handle,handle,…" ("" when nothing is in range). */
const resolved = new Map();
const pending = new Set();
const listeners = new Set();

const notify = () => listeners.forEach((l) => l());

function subscribe(onChange) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function ensureResolved(pincode) {
  if (pincode.length !== 6 || resolved.has(pincode) || pending.has(pincode)) return;
  pending.add(pincode);

  resolveNearestStores(pincode)
    .then((res) => {
      // EVERY visitable store, nearest first — `ranked`, not `nearby`, so the
      // ordering is not capped at NEAREST_STORE_MAX_KM. A Pune shopper gets Pune
      // stock first, then the next-nearest store's, and so on, instead of every
      // out-of-range store collapsing into the same bucket as made-to-order.
      //
      // The warehouse / head office is appended LAST, always, regardless of how
      // close it happens to sit to the shopper. It is not a place anyone visits,
      // so its distance carries no meaning for a shopper choosing a piece — a
      // Mumbai shopper standing next to Malad still wants the stock they can walk
      // in and see ranked above the stock that merely ships from nearby.
      const handles = [
        ...(res.ranked || []).map((s) => s.handle),
        ...(res.warehouses || []).map((s) => s.handle),
      ].filter(Boolean);
      resolved.set(pincode, handles.join(","));
    })
    .catch(() => {
      // A failed lookup must never break the grid — it just means no reordering.
      resolved.set(pincode, "");
    })
    .finally(() => {
      pending.delete(pincode);
      notify();
    });
}

/**
 * @returns {{ storesParam: string, pincode: string, storesReady: boolean }}
 *   storesParam — "" when there is no pincode, an unknown pincode, or no store
 *                 within range; otherwise "nearest,next,…,warehouse".
 *   storesReady — false only while a real pincode is still resolving. Lets a
 *                 caller tell "no ordering applies" apart from "ordering is not
 *                 known yet", so it can avoid firing a request it would throw
 *                 away a moment later. True when there is nothing to wait for.
 */
export function useStoreOrdering() {
  const { pincode } = useUserPincode();

  const storesParam = useSyncExternalStore(
    subscribe,
    () => (pincode.length === 6 ? resolved.get(pincode) ?? "" : ""),
    () => "" // statically rendered: no cookie on the server, so no ordering
  );

  const storesReady = useSyncExternalStore(
    subscribe,
    () => pincode.length !== 6 || resolved.has(pincode),
    () => true // statically rendered: nothing pending, so nothing to wait for
  );

  useEffect(() => {
    ensureResolved(pincode);
  }, [pincode]);

  return { storesParam, pincode, storesReady };
}
