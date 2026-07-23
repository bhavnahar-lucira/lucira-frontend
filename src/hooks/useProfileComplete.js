"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "@/lib/api";

/* Same storage key the Earn Rewards page writes to (per customer). */
const STORAGE_KEY = "lucira_profile_data";

function extractNumericId(gid = "") {
  const p = String(gid).split("/");
  return p[p.length - 1];
}

/**
 * Has the customer completed their profile on /admin/rewards?
 *
 * Reads the same two sources the rewards page uses — the per-user localStorage
 * flag first (instant, so the profile banner never flashes for a completed
 * customer) and then `/api/customer/progress`, which is the source of truth.
 * Returns false while unknown / logged out.
 */
export function useProfileComplete() {
  const { accessToken, user } = useSelector((state) => state.user);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setComplete(false);
      return;
    }

    const key = `${STORAGE_KEY}_${extractNumericId(user.id)}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw && JSON.parse(raw)?.profileComplete) setComplete(true);
    } catch {}

    if (!accessToken) return;

    let cancelled = false;
    (async () => {
      try {
        const d = await apiFetch(`/api/customer/progress`);
        if (!cancelled && d?.profile_complete) setComplete(true);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [accessToken, user?.id]);

  return complete;
}

export default useProfileComplete;
