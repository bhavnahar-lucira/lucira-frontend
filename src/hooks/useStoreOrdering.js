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
      // Visitable stores by distance, then the warehouse. A shopper far from every
      // store still gets warehouse-stocked products ahead of made-to-order ones,
      // which is the only ranking that means anything at that distance.
      const handles = [
        ...(res.nearby || []).map((s) => s.handle),
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
 * @returns {{ storesParam: string, pincode: string }}
 *   storesParam — "" when there is no pincode, an unknown pincode, or no store
 *                 within range; otherwise "nearest,next,…,warehouse".
 */
export function useStoreOrdering() {
  const { pincode } = useUserPincode();

  const storesParam = useSyncExternalStore(
    subscribe,
    () => (pincode.length === 6 ? resolved.get(pincode) ?? "" : ""),
    () => "" // statically rendered: no cookie on the server, so no ordering
  );

  useEffect(() => {
    ensureResolved(pincode);
  }, [pincode]);

  return { storesParam, pincode };
}
