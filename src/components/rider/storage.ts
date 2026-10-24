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

export function useLang(): [Lang, (lang: Lang) => void] {
  const stored = useStored("local", LANG_KEY);
  const lang: Lang = stored === "mr" ? "mr" : "en";
  return [lang, (next) => writeStored("local", LANG_KEY, next)];
}

export const riderKey = (station: string) => `saath-rider-${station}`;
export const destKey = (station: string) => `saath-dest-${station}`;
export const driverKey = (station: string) => `saath-driver-${station}`;
