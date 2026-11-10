"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { saveOptiPhoenixLog } from "@/lib/api";
import { getConvExpLog } from "@/lib/optiphoenix";

// What we last pushed per customer: { [customerKey]: { sig, at } }.
const SYNCED_KEY = "conv_zoho_exp_log_synced";
// Convert loads via GTM and, on the live site, first writes the log ~8s into
// a fresh visit — so look a few times rather than once.
const CHECK_DELAYS_MS = [3000, 12000, 30000];
// Convert bumps lastSeen on every page view. Only a new experiment/variation
// triggers an immediate write; otherwise refresh the stored copy once a day.
const REFRESH_MS = 24 * 60 * 60 * 1000;

const readSynced = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNCED_KEY) || "{}");
  } catch {
    return {};
  }
};

// Experiment ids + variation labels, ignoring the per-page-view timestamps.
const signature = (log) =>
  Object.keys(log)
    .sort()
    .map((id) => `${id}:${log[id]?.label ?? ""}`)
    .join("|");

// Copies localStorage conv_zoho_exp_log onto the logged-in customer's
// custom.optiphoenix metafield. Login, register and checkout already carry the
// log in their request body (lib/optiphoenix.js); this catches experiments
// the customer enters later in an already-logged-in session.
export default function OptiPhoenixSync() {
  const pathname = usePathname();
  const { user, accessToken, isAuthenticated } = useSelector((state) => state.user);
  const customerKey = user?.id || user?.email || user?.mobile || "";

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !customerKey) return;

    let inFlight = false;
    const sync = async () => {
      const log = getConvExpLog();
      if (!log || Object.keys(log).length === 0 || inFlight) return;

      const sig = signature(log);
      const last = readSynced()[customerKey];
      if (last?.sig === sig && Date.now() - (last.at || 0) < REFRESH_MS) return;

      inFlight = true;
      try {
        if (await saveOptiPhoenixLog(log, accessToken)) {
          localStorage.setItem(
            SYNCED_KEY,
            JSON.stringify({ ...readSynced(), [customerKey]: { sig, at: Date.now() } })
          );
        }
      } catch (err) {
        console.warn("[OptiPhoenixSync] Failed to sync experiment log:", err);
      } finally {
        inFlight = false;
      }
    };

    const timers = CHECK_DELAYS_MS.map((ms) => setTimeout(sync, ms));
    return () => timers.forEach(clearTimeout);
  }, [pathname, isAuthenticated, accessToken, customerKey]);

  return null;
}
