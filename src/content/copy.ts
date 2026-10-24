// All UI text for Saath. English + Marathi. Words rule (CONTRACT.md): say "shared auto",
// "your share", "legal metered fare", "estimated road distance"; never "official", "RTO approved", "guaranteed".

export type Lang = "en" | "mr";
type T = Record<Lang, string>;
type F<A extends unknown[]> = Record<Lang, (...args: A) => string>;

const rupees = (n: number) => `₹${n}`;

export const copy = {
  appName: { en: "Saath", mr: "साथ" } as T,
  tagline: {
    en: "Share an auto from the Metro exit. Split the legal metered fare.",
    mr: "मेट्रो गेटपासून शेअर्ड रिक्षा. कायदेशीर मीटर भाडे वाटून घ्या.",
  } as T,
  fareRule: {
    en: "Legal metered fare (₹30 + ₹20/km, from 1 Sep 2026)",
    mr: "कायदेशीर मीटर भाडे (₹30 + ₹20/किमी, 1 सप्टेंबर 2026 पासून)",
  } as T,
  nightFare: {
    en: "Night fare ×1.25 (00:00–04:59)",
    mr: "रात्रीचे भाडे ×1.25 (00:00–04:59)",
  } as T,
  estimated: { en: "Estimated road distance", mr: "अंदाजे रस्त्याचे अंतर" } as T,
  switchLang: { en: "मराठी", mr: "English" } as T,

  // Rider state 1: destination
  rider: {
    title: { en: "Where are you going?", mr: "तुम्ही कुठे जात आहात?" } as T,
    stationLine: {
      en: (station: string) => `From ${station} Metro`,
      mr: (station: string) => `${station} मेट्रोपासून`,
    } as F<[string]>,
    nameLabel: { en: "Your name (optional)", mr: "तुमचे नाव (ऐच्छिक)" } as T,
    destLabel: { en: "Destination", mr: "ठिकाण" } as T,
    destPlaceholder: { en: "Area, society or landmark", mr: "परिसर, सोसायटी किंवा खूण" } as T,
    searching: { en: "Searching…", mr: "शोधत आहोत…" } as T,
    noResults: {
      en: "Couldn't find that place. Try a nearby landmark.",
      mr: "ते ठिकाण सापडले नाही. जवळची खूण वापरून पहा.",
    } as T,
    outsideArea: {
      en: "That place is outside the Pune area.",
      mr: "हे ठिकाण पुणे क्षेत्राबाहेर आहे.",
    } as T,

    // Rider state 2: confirm pin
    confirmTitle: { en: "Confirm your drop point", mr: "उतरण्याचे ठिकाण निश्चित करा" } as T,
    confirmHint: {
      en: "Drag the pin to where the auto should drop you.",
      mr: "रिक्षा जिथे सोडेल तिथे पिन ओढा.",
    } as T,
    confirmButton: { en: "Find a shared auto", mr: "शेअर्ड रिक्षा शोधा" } as T,
    changeDest: { en: "Change destination", mr: "ठिकाण बदला" } as T,

    // Rider state 3: waiting
    waitingTitle: {
      en: "Finding people going your way",
      mr: "तुमच्या दिशेने जाणारे प्रवासी शोधत आहोत",
    } as T,
    waitingCount: {
      en: (n: number) => (n === 1 ? "1 person waiting at this exit" : `${n} people waiting at this exit`),
      mr: (n: number) => `या गेटवर ${n} जण थांबले आहेत`,
    } as F<[number]>,
    sameWayCount: {
      en: (n: number) => (n === 1 ? "1 going your way" : `${n} going your way`),
      mr: (n: number) => `${n} जण तुमच्या दिशेने`,
    } as F<[number]>,
    waitingHint: {
      en: "Keep this screen open. Groups form when the board says go.",
      mr: "ही स्क्रीन उघडी ठेवा. बोर्डवरून गट बनवले जातील.",
    } as T,
    slowNetwork: {
      en: "Slow connection, retrying…",
      mr: "नेटवर्क धीमे आहे, पुन्हा प्रयत्न करत आहोत…",
    } as T,

    // Rider state 4: group card
    groupTitle: { en: "Your shared auto", mr: "तुमची शेअर्ड रिक्षा" } as T,
    soloTitle: { en: "Riding solo this time", mr: "या वेळी एकट्याने प्रवास" } as T,
    soloHint: {
      en: "No one is going your way right now, so you pay the solo meter fare.",
      mr: "सध्या तुमच्या दिशेने कोणी नाही, त्यामुळे एकट्याचे मीटर भाडे.",
    } as T,
    yourShare: {
      en: (share: number, total: number) => `You pay ${rupees(share)} of ${rupees(total)}`,
      mr: (share: number, total: number) => `${rupees(total)} पैकी तुमचा वाटा ${rupees(share)}`,
    } as F<[number, number]>,
    youSave: {
      en: (saved: number) => `${rupees(saved)} less than riding alone`,
      mr: (saved: number) => `एकट्यापेक्षा ${rupees(saved)} कमी`,
    } as F<[number]>,
    meetAt: {
      en: (gate: string) => `Meet at ${gate}`,
      mr: (gate: string) => `${gate} येथे भेटा`,
    } as F<[string]>,
    dropOrder: { en: "Drop order", mr: "उतरण्याचा क्रम" } as T,
    you: { en: "You", mr: "तुम्ही" } as T,
    rider: {
      en: (i: number) => `Rider ${i}`,
      mr: (i: number) => `प्रवासी ${i}`,
    } as F<[number]>,
    showDriver: { en: "Show the driver", mr: "चालकाला दाखवा" } as T,
  },

  // Driver card (shown full screen to the auto driver; big type)
  driver: {
    title: { en: "Shared auto, metered fare", mr: "शेअर्ड रिक्षा, मीटरप्रमाणे भाडे" } as T,
    stops: { en: "Stops", mr: "थांबे" } as T,
    stop: {
      en: (i: number, place: string) => `${i}. ${place}`,
      mr: (i: number, place: string) => `${i}. ${place}`,
    } as F<[number, string]>,
    total: {
      en: (total: number) => `Total meter fare ${rupees(total)}`,
      mr: (total: number) => `एकूण मीटर भाडे ${rupees(total)}`,
    } as F<[number]>,
    runMeter: { en: "Please run the meter.", mr: "कृपया मीटर सुरू करा." } as T,
    distance: {
      en: (km: number) => `${km.toFixed(1)} km`,
      mr: (km: number) => `${km.toFixed(1)} किमी`,
    } as F<[number]>,
    back: { en: "Back", mr: "मागे" } as T,
  },

  // Board page (projector)
  board: {
    scanTitle: { en: "Scan to share an auto", mr: "शेअर्ड रिक्षासाठी स्कॅन करा" } as T,
    waiting: { en: "Waiting", mr: "थांबलेले" } as T,
    groups: { en: "Groups", mr: "गट" } as T,
    formGroups: { en: "Form groups", mr: "गट बनवा" } as T,
    forming: { en: "Forming groups…", mr: "गट बनवत आहोत…" } as T,
    noWaiting: { en: "No one waiting yet", mr: "अजून कोणी थांबलेले नाही" } as T,
    noGroups: { en: "No groups yet", mr: "अजून गट नाहीत" } as T,
    keyPrompt: { en: "Enter the board key", mr: "बोर्ड की टाका" } as T,
    keyWrong: { en: "Board key not accepted", mr: "बोर्ड की चुकीची आहे" } as T,
    groupLabel: {
      en: (i: number, size: number) => `Group ${i} · ${size} ${size === 1 ? "rider" : "riders"}`,
      mr: (i: number, size: number) => `गट ${i} · ${size} प्रवासी`,
    } as F<[number, number]>,
    soloLabel: { en: "Solo", mr: "एकटे" } as T,
    nobodyPaysMore: {
      en: "Nobody pays more than riding alone.",
      mr: "कोणीही एकट्यापेक्षा जास्त भाडे देत नाही.",
    } as T,
  },

  errors: {
    generic: { en: "Something went wrong. Try again.", mr: "काहीतरी चुकले. पुन्हा प्रयत्न करा." } as T,
    unknownStation: { en: "Unknown station", mr: "अज्ञात स्टेशन" } as T,
  },
} as const;

export function t(entry: T, lang: Lang): string {
  return entry[lang];
}
