"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { usePathname } from "next/navigation";
import { store, persistor, serverState } from "./store";
import { PersistGate } from "redux-persist/integration/react";

// ─── Why the gate renders `children` while loading ───────────────────────────
// PersistGate renders its `loading` prop until redux-persist has rehydrated,
// and rehydration only ever happens in the browser. With `loading={null}` the
// server therefore rendered NOTHING inside this provider: no header, no page
// body, no footer, no per-page JSON-LD — only <title>/<meta>. Every crawler that
// does not execute JavaScript (and Google's renderer when it times out) saw an
// empty page, which is why the rate pages and blogs were not being indexed.
//
// Passing `children` as `loading` makes the server (and the first client
// render) emit the real page. Both renders use the un-rehydrated store because
// the store is created with `manualPersist` and `persistor.persist()` only runs
// in the effect below, after hydration — so the HTML and the hydrating tree
// match, and the persisted cart / user state arrives as a normal store update.
//
// ─── Routes that keep the old behaviour ──────────────────────────────────────
// Their layouts read the persisted auth state the moment they mount and
// redirect on it (ProtectedLayout, the checkout gate, login/register). For
// them `loading` stays `null`: nothing mounts until rehydration is done,
// exactly as before. They are noindex / disallowed in robots.txt, so there is
// nothing for a crawler to gain there.
const REHYDRATE_BEFORE_MOUNT = /^\/(admin|dashboard|account|checkout|success|login|register|schemes)(\/|$)/i;

// Rehydration is started once per page load. (A repeated PERSIST is a no-op in
// redux-persist anyway, e.g. under React StrictMode's double effects.)
let persistStarted = false;

export default function ReduxProvider({ children }) {
  const pathname = usePathname() || "";
  const waitForRehydration = REHYDRATE_BEFORE_MOUNT.test(pathname);

  useEffect(() => {
    if (persistStarted) return;
    persistStarted = true;
    persistor.persist();
  }, []);

  return (
    <Provider store={store} serverState={serverState}>
      <PersistGate loading={waitForRehydration ? null : children} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
