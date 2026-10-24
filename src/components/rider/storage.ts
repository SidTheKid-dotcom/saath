"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "../../content/copy";

type Area = "local" | "session";

const listeners = new Set<() => void>();

function area(kind: Area): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(kind: Area, key: string): string | null {
  return area(kind)?.getItem(key) ?? null;
}

export function writeStored(kind: Area, key: string, value: string | null) {
  const store = area(kind);
  if (store) {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** A storage value as external state: null on the server, the real value after hydration. */
export function useStored(kind: Area, key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readStored(kind, key),
    () => null,
  );
}

const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const LANG_KEY = "saath-lang";

function readLang(): Lang {
  const stored = readStored("local", LANG_KEY);
  if (stored === "mr" || stored === "en") return stored;
  if (typeof navigator !== "undefined" && /^mr\b/i.test(navigator.language)) return "mr";
  return "en";
}

/** Saved choice wins. A first visit follows the phone language when it is Marathi. */
export function useLang(): [Lang, (lang: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, readLang, () => "en" as Lang);
  return [lang, (next) => writeStored("local", LANG_KEY, next)];
}

export const riderKey = (station: string) => `saath-rider-${station}`;
export const destKey = (station: string) => `saath-dest-${station}`;
export const driverKey = (station: string) => `saath-driver-${station}`;
