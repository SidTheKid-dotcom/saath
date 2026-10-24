// All UI text for Saath. English + Marathi. Words rule (CONTRACT.md): say "shared auto",
// "your share", "legal metered fare", "estimated road distance"; the banned wording is checked by copy.test.ts.

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

  // Progress dots across the top of the rider flow
  steps: {
    where: { en: "Where to", mr: "कुठे" } as T,
    confirm: { en: "Confirm", mr: "निश्चित" } as T,
    waiting: { en: "Waiting", mr: "थांबा" } as T,
    auto: { en: "Your auto", mr: "तुमची रिक्षा" } as T,
    progress: {
      en: (i: number, n: number) => `Step ${i} of ${n}`,
      mr: (i: number, n: number) => `पायरी ${i} / ${n}`,
    } as F<[number, number]>,
  },

  // Rider state 1: destination
  rider: {
    destHelper: {
      en: "Type an area, society or landmark, then tap it.",
      mr: "परिसर, सोसायटी किंवा खूण टाइप करा, मग त्यावर टॅप करा.",
    } as T,
    metroBadge: { en: "Metro", mr: "मेट्रो" } as T,
    metroPlace: {
      en: (name: string) => `${name} Metro Station`,
      mr: (name: string) => `${name} मेट्रो स्टेशन`,
    } as F<[string]>,
    searchFailed: {
      en: "Search didn't work. Check your connection and tap Try again.",
      mr: "शोध झाला नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा दाबा.",
    } as T,
    phoneLabel: {
      en: "Your number, so your group can call you",
      mr: "तुमचा नंबर, म्हणजे तुमचा गट तुम्हाला कॉल करू शकेल",
    } as T,
    phoneHelper: {
      en: "Optional. Only the people in your auto see it.",
      mr: "ऐच्छिक. फक्त तुमच्या रिक्षातील लोकांना दिसेल.",
    } as T,
    phoneInvalid: {
      en: "Enter a 10-digit mobile number, or leave it empty.",
      mr: "10 अंकी मोबाईल नंबर टाका, किंवा रिकामे ठेवा.",
    } as T,
    joinFailed: {
      en: "Couldn't join. Check your connection and tap again.",
      mr: "सामील होता आले नाही. नेटवर्क तपासा आणि पुन्हा दाबा.",
    } as T,
    waitAt: {
      en: (gate: string) => `Wait at ${gate}`,
      mr: (gate: string) => `${gate} येथे थांबा`,
    } as F<[string]>,
    waitingNext: {
      en: "Keep this page open. Your shared auto shows up here.",
      mr: "हे पान उघडे ठेवा. तुमची शेअर्ड रिक्षा इथे दिसेल.",
    } as T,
    waitingTime: {
      en: "We match people going your way as soon as they join. If no one does, you ride solo.",
      mr: "तुमच्या दिशेने कोणी आले की आम्ही जुळवतो. कोणी नसेल तर एकटे जाल.",
    } as T,
    waitingMatch: {
      en: (n: number) =>
        n === 1
          ? "1 person is going your way. Your auto will appear in a few seconds."
          : `${n} people are going your way. Your auto will appear in a few seconds.`,
      mr: (n: number) =>
        n === 1
          ? "1 जण तुमच्या दिशेने आहे. तुमची रिक्षा काही सेकंदांत दिसेल."
          : `${n} जण तुमच्या दिशेने आहेत. तुमची रिक्षा काही सेकंदांत दिसेल.`,
    } as F<[number]>,
    waitingKeep: {
      en: "Keep this page open.",
      mr: "हे पान उघडे ठेवा.",
    } as T,
    checking: {
      en: "Checking who is at this gate…",
      mr: "या गेटवर कोण आहे ते पाहत आहोत…",
    } as T,
    quickMetro: {
      en: "Or tap a Metro station",
      mr: "किंवा मेट्रो स्टेशनवर टॅप करा",
    } as T,
    addPhone: {
      en: "Add your number so your group can call you",
      mr: "तुमचा नंबर जोडा, म्हणजे गट तुम्हाला कॉल करू शकेल",
    } as T,
    cancel: { en: "Cancel", mr: "रद्द करा" } as T,
    youPay: {
      en: (share: number) => `You pay ${rupees(share)}`,
      mr: (share: number) => `तुम्ही ${rupees(share)} द्या`,
    } as F<[number]>,
    ofTotal: {
      en: (total: number) => `of ${rupees(total)} meter fare`,
      mr: (total: number) => `${rupees(total)} मीटर भाड्यापैकी`,
    } as F<[number]>,
    people: { en: "In your auto", mr: "तुमच्या रिक्षात" } as T,
    call: { en: "Call", mr: "कॉल" } as T,
    callWho: {
      en: (who: string) => `Call ${who}`,
      mr: (who: string) => `${who} ला कॉल करा`,
    } as F<[string]>,
    newTrip: { en: "Start a new trip", mr: "नवीन प्रवास सुरू करा" } as T,

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
      en: "No match. Try a nearby landmark or area name.",
      mr: "ते ठिकाण सापडले नाही. जवळची खूण वापरून पहा.",
    } as T,
    outsideArea: {
      en: "That place is outside the Pune area.",
      mr: "हे ठिकाण पुणे क्षेत्राबाहेर आहे.",
    } as T,
    loading: { en: "Loading…", mr: "लोड होत आहे…" } as T,
    retry: { en: "Try again", mr: "पुन्हा प्रयत्न करा" } as T,
    startOver: { en: "Start over", mr: "पुन्हा सुरू करा" } as T,

    // Rider state 2: confirm pin
    confirmTitle: { en: "Is this your drop point?", mr: "हे तुमचे उतरण्याचे ठिकाण आहे का?" } as T,
    confirmHint: {
      en: "Drag the pin if it's not quite right.",
      mr: "बरोबर नसेल तर पिन ओढा.",
    } as T,
    confirmButton: { en: "Yes, drop me here", mr: "हो, इथे सोडा" } as T,
    changeDest: { en: "Change place", mr: "ठिकाण बदला" } as T,
    joining: { en: "Finding your group…", mr: "तुमचा गट शोधत आहोत…" } as T,
    mapLoading: { en: "Loading map…", mr: "नकाशा लोड होत आहे…" } as T,
    mapError: {
      en: "Map did not load. We will use the place you picked.",
      mr: "नकाशा लोड झाला नाही. तुम्ही निवडलेले ठिकाण वापरू.",
    } as T,
    pinLabel: { en: "Your drop point", mr: "तुमचे उतरण्याचे ठिकाण" } as T,
    stationLabel: { en: "Metro exit", mr: "मेट्रो गेट" } as T,

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
    waitingLabel: { en: "waiting at this exit", mr: "या गेटवर थांबले" } as T,
    sameWayLabel: { en: "going your way", mr: "तुमच्या दिशेने" } as T,
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
    share: {
      en: (share: number) => `Share ${rupees(share)}`,
      mr: (share: number) => `वाटा ${rupees(share)}`,
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
    noWaiting: { en: "No one waiting yet", mr: "अजून कोणी थांबलेले नाही" } as T,
    noGroups: {
      en: "No groups yet. They appear here on their own.",
      mr: "अजून गट नाहीत. ते आपोआप इथे येतात.",
    } as T,
    how: {
      en: "Riders scan, enter where they are going, and wait at the gate on their phone. Groups form on their own.",
      mr: "प्रवासी स्कॅन करतात, कुठे जायचे ते टाकतात, आणि फोनवर दिलेल्या गेटवर थांबतात. गट आपोआप बनतात.",
    } as T,
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

  role: {
    title: { en: "How are you travelling?", mr: "तुम्ही कसे प्रवास करताय?" } as T,
    riding: { en: "I'm riding", mr: "मी प्रवासी आहे" } as T,
    ridingSub: { en: "Find a shared auto, pay only your share", mr: "शेअर्ड रिक्षा शोधा, फक्त तुमचा वाटा द्या" } as T,
    driving: { en: "I'm driving an auto", mr: "मी रिक्षा चालक आहे" } as T,
    drivingSub: { en: "See groups ready at this gate", mr: "या गेटवर तयार गट पहा" } as T,
    toDriver: { en: "Switch to driver", mr: "चालक व्हा" } as T,
    headerDrive: { en: "I'm driving", mr: "मी चालक" } as T,
    toRider: { en: "Switch to rider", mr: "प्रवासी व्हा" } as T,
  },

  driverList: {
    title: { en: "Groups at this gate", mr: "या गेटवरील गट" } as T,
    riders: { en: (n: number) => `${n} ${n === 1 ? "rider" : "riders"}`, mr: (n: number) => `${n} प्रवासी` } as F<[number]>,
    stop: { en: (n: number) => `Stop ${n}`, mr: (n: number) => `थांबा ${n}` } as F<[number]>,
    total: { en: (n: number) => `Legal metered fare ₹${n}`, mr: (n: number) => `कायदेशीर मीटर भाडे ₹${n}` } as F<[number]>,
    km: { en: (n: number) => `${n.toFixed(1)} km`, mr: (n: number) => `${n.toFixed(1)} किमी` } as F<[number]>,
    empty: {
      en: "No groups yet. They show up here on their own when riders at this gate are matched.",
      mr: "अजून गट नाहीत. या गेटवरील प्रवासी जुळले की गट आपोआप इथे येतात.",
    } as T,
    filterHint: {
      en: "Optional. Leave this blank to see every group.",
      mr: "ऐच्छिक. सर्व गट पाहण्यासाठी रिकामा ठेवा.",
    } as T,
    loading: { en: "Loading groups…", mr: "गट लोड होत आहेत…" } as T,
    slow: { en: "Slow network. Still trying…", mr: "नेटवर्क हळू आहे. प्रयत्न सुरू आहे…" } as T,
    error: { en: "Could not load groups. Retrying every 5 seconds.", mr: "गट लोड झाले नाहीत. दर 5 सेकंदांनी पुन्हा प्रयत्न." } as T,
    open: { en: "Open card", mr: "कार्ड उघडा" } as T,
    accept: { en: "Accept this group", mr: "हा गट स्वीकारा" } as T,
    accepting: { en: "Accepting…", mr: "स्वीकारत आहे…" } as T,
    accepted: {
      en: (gate: string) => `Accepted: go to ${gate}`,
      mr: (gate: string) => `स्वीकारले: ${gate} ला जा`,
    } as F<[string]>,
    taken: { en: "Taken", mr: "घेतला गेला" } as T,
    heading: { en: "Where are you heading?", mr: "तुम्ही कुठे जात आहात?" } as T,
    headingPlaceholder: { en: "Area or metro station", mr: "भाग किंवा मेट्रो स्टेशन" } as T,
    search: { en: "Search", mr: "शोधा" } as T,
    showAll: { en: "Show all groups", mr: "सर्व गट दाखवा" } as T,
    headingTo: { en: (place: string) => `Heading to ${place}`, mr: (place: string) => `${place} कडे जात आहे` } as F<[string]>,
    lastStop: {
      en: (km: number) => `Last stop ${km} km from your destination`,
      mr: (km: number) => `शेवटचा थांबा तुमच्या ठिकाणापासून ${km} किमी`,
    } as F<[number]>,
    noneYourWay: { en: "No groups going your way right now.", mr: "सध्या तुमच्या दिशेने कोणताही गट नाही." } as T,
    alreadyTaken: { en: "Already taken", mr: "आधीच घेतला गेला" } as T,
  },

  acceptedBanner: {
    en: (gate: string) => `An auto has accepted your group. Meet at ${gate}.`,
    mr: (gate: string) => `एका रिक्षाने तुमचा गट स्वीकारला. ${gate} ला भेटा.`,
  } as F<[string]>,

  errors: {
    generic: { en: "Something went wrong. Try again.", mr: "काहीतरी चुकले. पुन्हा प्रयत्न करा." } as T,
    unknownStation: { en: "Unknown station", mr: "अज्ञात स्टेशन" } as T,
  },
} as const;

export function t(entry: T, lang: Lang): string {
  return entry[lang];
}
