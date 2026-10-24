import type { Lang } from "@/content/copy";

type T = Record<Lang, string>;
type F<A extends unknown[]> = Record<Lang, (...args: A) => string>;

/** Phrases the board needs that are not already in copy.ts. */
export const boardStrings = {
  loading: { en: "Loading the board…", mr: "बोर्ड लोड होत आहे…" } as T,
  mapUnavailable: {
    en: "Map unavailable on this screen",
    mr: "या स्क्रीनवर नकाशा उपलब्ध नाही",
  } as T,
  shareLine: {
    en: (share: number, solo: number) => `your share ₹${share} / solo fare ₹${solo}`,
    mr: (share: number, solo: number) => `तुमचा वाटा ₹${share} / एकट्याचे भाडे ₹${solo}`,
  } as F<[number, number]>,
  groupFare: {
    en: (total: number) => `Group total ₹${total}, legal metered fare`,
    mr: (total: number) => `गटाचे एकूण ₹${total}, कायदेशीर मीटर भाडे`,
  } as F<[number]>,
};
