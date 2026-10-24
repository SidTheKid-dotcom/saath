"use client";

import { useEffect } from "react";

/** Registers /sw.js in production only, so dev hot reload never fights a cache. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
