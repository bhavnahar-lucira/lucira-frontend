/**
 * Run `fn` once the main thread is idle, or after `timeout` ms at the latest.
 *
 * Used for fire-and-forget analytics beacons on the PDP so they never compete
 * with first paint and hydration. The work still runs (it is not dropped when
 * the tab is busy), it just runs after the browser has had a chance to render.
 * Server-safe: a no-op when there is no window.
 */
export function runWhenIdle(fn, timeout = 2000) {
  if (typeof window === "undefined") return;
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => fn(), { timeout });
  } else {
    window.setTimeout(fn, Math.min(timeout, 500));
  }
}
