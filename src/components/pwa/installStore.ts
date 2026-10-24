"use client";

import { useSyncExternalStore } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export type InstallMode = "unknown" | "installed" | "prompt" | "ios" | "none";

let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
let started = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function isIos() {
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOs;
}

function snapshot(): InstallMode {
  if (installed || isStandalone()) return "installed";
  if (deferred) return "prompt";
  if (isIos()) return "ios";
  return "none";
}

/** How this browser can install the app. "unknown" on the server and before hydration. */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, snapshot, () => "unknown");
}

/** Shows the browser's own install dialog. Only valid when the mode is "prompt". */
export async function promptInstall() {
  if (!deferred) return;
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  await event.userChoice.catch(() => undefined);
}
