// Landing page text for Saath, English + Marathi. Same words rule as copy.ts:
// say "shared auto", "your share", "legal metered fare"; never the banned wording.

import type { Lang } from "./copy";

type T = Record<Lang, string>;

export const landing = {
  navStations: { en: "Stations", mr: "स्थानके" } as T,
  heroEyebrow: { en: "Pune Metro · shared autos", mr: "पुणे मेट्रो · शेअर्ड रिक्षा" } as T,
  heroTitle: {
    en: "Share an auto from the Metro. Pay only your share.",
    mr: "मेट्रोपासून रिक्षा शेअर करा. फक्त तुमचा वाटा द्या.",
  } as T,
  heroSub: {
    en: "Leaving the same Metro exit, going the same way? Ride together and split the legal metered fare fairly.",
    mr: "एकाच मेट्रो गेटमधून, एकाच दिशेला जात आहात? एकत्र जा आणि कायदेशीर मीटर भाडे न्याय्य पद्धतीने वाटून घ्या.",
  } as T,

  pickTitle: { en: "Pick your station", mr: "तुमचे स्थानक निवडा" } as T,
  useLocation: { en: "Use my location", mr: "माझे स्थान वापरा" } as T,
  locating: { en: "Finding you…", mr: "तुमचे स्थान शोधत आहोत…" } as T,
  locationDenied: {
    en: "Location is off. Pick your station from the list.",
    mr: "स्थान बंद आहे. यादीतून स्थानक निवडा.",
  } as T,
  locationFailed: {
    en: "Couldn't get your location. Pick your station from the list.",
    mr: "तुमचे स्थान मिळाले नाही. यादीतून स्थानक निवडा.",
  } as T,
  tooFar: {
    en: "No Metro station near you. Pick one from the list.",
    mr: "जवळ मेट्रो स्थानक नाही. यादीतून एक निवडा.",
  } as T,
  nearest: { en: "Nearest to you", mr: "तुमच्या सर्वात जवळ" } as T,
  goTo: { en: "Go to", mr: "पुढे जा:" } as T,
  away: {
    en: (km: string) => `${km} km away`,
    mr: (km: string) => `${km} किमी दूर`,
  } as Record<Lang, (km: string) => string>,
  searchLabel: { en: "Search stations", mr: "स्थानक शोधा" } as T,
  searchPlaceholder: { en: "Type a station name", mr: "स्थानकाचे नाव लिहा" } as T,
  noMatch: {
    en: "No station with that name.",
    mr: "या नावाचे स्थानक नाही.",
  } as T,
  stationCount: {
    en: (n: number) => `${n} stations`,
    mr: (n: number) => `${n} स्थानके`,
  } as Record<Lang, (n: number) => string>,
  lineName: {
    purple: { en: "Purple Line", mr: "पर्पल मार्ग" } as T,
    aqua: { en: "Aqua Line", mr: "अॅक्वा मार्ग" } as T,
  },
  alsoKnown: { en: "also", mr: "तसेच" } as T,
  interchange: { en: "Both lines", mr: "दोन्ही मार्ग" } as T,

  howTitle: { en: "How it works", mr: "हे कसे चालते" } as T,
  steps: [
    {
      title: { en: "Say where you're going", mr: "कुठे जायचे ते सांगा" } as T,
      body: {
        en: "Pick your station, type your area, drag the pin to your drop point.",
        mr: "स्थानक निवडा, परिसर लिहा, उतरण्याच्या जागी पिन ओढा.",
      } as T,
    },
    {
      title: { en: "Meet people going your way", mr: "तुमच्या दिशेचे लोक भेटा" } as T,
      body: {
        en: "As soon as someone is going your way, we match up to 3 riders and show the gate to stand at.",
        mr: "तुमच्या दिशेने कोणी आले की आम्ही जास्तीत जास्त 3 प्रवाशांना जुळवतो आणि कुठे उभे राहायचे ते दाखवतो.",
      } as T,
    },
    {
      title: { en: "Ride and pay your share", mr: "प्रवास करा, तुमचा वाटा द्या" } as T,
      body: {
        en: "The driver sees the stops in Marathi. The meter fare is split by how far each of you rides.",
        mr: "चालकाला थांबे मराठीत दिसतात. मीटर भाडे प्रत्येकाच्या अंतराप्रमाणे वाटले जाते.",
      } as T,
    },
  ],

  fareTitle: { en: "The fare rule", mr: "भाड्याचा नियम" } as T,
  fareBig: { en: "₹30 + ₹20/km", mr: "₹30 + ₹20/किमी" } as T,
  fareBody: {
    en: "Legal metered fare: ₹30 for the first 1.5 km, then ₹20 for every km after, from 1 Sep 2026. Night rides (00:00–04:59) are ×1.25.",
    mr: "कायदेशीर मीटर भाडे: पहिल्या 1.5 किमीसाठी ₹30, नंतर प्रत्येक किमीला ₹20, 1 सप्टेंबर 2026 पासून. रात्रीचे भाडे (00:00–04:59) ×1.25.",
  } as T,
  fareSource: {
    en: "Source: Hindustan Times, 2 Sep 2026; Free Press Journal, 3 Sep 2026.",
    mr: "स्रोत: हिंदुस्तान टाइम्स, 2 सप्टेंबर 2026; फ्री प्रेस जर्नल, 3 सप्टेंबर 2026.",
  } as T,

  exampleTitle: { en: "What a split looks like", mr: "वाटणी अशी दिसते" } as T,
  exampleNote: {
    en: "Worked example with made-up distances, using the same fare maths as the app.",
    mr: "काल्पनिक अंतरांचे उदाहरण; अॅपमध्ये वापरलेलेच भाडे-गणित.",
  } as T,
  exampleRoute: {
    en: (km: number, fare: number) => `One auto, ${km} km, meter ₹${fare}`,
    mr: (km: number, fare: number) => `एक रिक्षा, ${km} किमी, मीटर ₹${fare}`,
  } as Record<Lang, (km: number, fare: number) => string>,
  riderLabel: {
    en: (n: number) => `Rider ${n}`,
    mr: (n: number) => `प्रवासी ${n}`,
  } as Record<Lang, (n: number) => string>,
  dropAt: {
    en: (km: number) => `drops at ${km} km`,
    mr: (km: number) => `${km} किमीवर उतरतो`,
  } as Record<Lang, (km: number) => string>,
  yourShare: { en: "pays", mr: "देतो" } as T,
  alone: {
    en: (fare: number) => `alone ₹${fare}`,
    mr: (fare: number) => `एकटा ₹${fare}`,
  } as Record<Lang, (fare: number) => string>,
  saves: {
    en: (n: number) => `saves ₹${n}`,
    mr: (n: number) => `₹${n} वाचतात`,
  } as Record<Lang, (n: number) => string>,

  promiseTitle: {
    en: "Nobody pays more than riding alone.",
    mr: "एकटे जाण्यापेक्षा कुणालाही जास्त पैसे लागत नाहीत.",
  } as T,
  promiseBody: {
    en: "A group only forms if every rider's share is at most their own solo fare, and nobody rides much further than they would alone.",
    mr: "प्रत्येक प्रवाशाचा वाटा त्याच्या एकट्याच्या भाड्यापेक्षा जास्त नसेल आणि कुणालाही एकट्यापेक्षा फारसे लांब जावे लागणार नसेल, तरच गट बनतो.",
  } as T,

  installTitle: { en: "Keep Saath on your home screen", mr: "साथ तुमच्या होम स्क्रीनवर ठेवा" } as T,
  installBody: {
    en: "One tap from your phone, like any app. No store, no download.",
    mr: "इतर अॅपसारखे फोनवरून एका टॅपमध्ये उघडा. स्टोअर नाही, डाउनलोड नाही.",
  } as T,
  installButton: { en: "Add to home screen", mr: "होम स्क्रीनवर जोडा" } as T,
  installIos: {
    en: ["Tap the Share button", "Choose “Add to Home Screen”", "Tap Add"],
    mr: ["शेअर बटण दाबा", "“Add to Home Screen” निवडा", "Add दाबा"],
  } as Record<Lang, string[]>,
  installed: { en: "Saath is on your home screen.", mr: "साथ तुमच्या होम स्क्रीनवर आहे." } as T,
  installFallback: {
    en: "In your browser menu, choose “Install app” or “Add to Home screen”.",
    mr: "ब्राउझर मेनूमधून “Install app” किंवा “Add to Home screen” निवडा.",
  } as T,

  organisersTitle: { en: "Running a station? Open its board", mr: "स्थानक सांभाळता? त्याचा बोर्ड उघडा" } as T,
  organisersHint: {
    en: "The board shows a QR code, who is waiting, and the groups. Groups form on their own.",
    mr: "बोर्डवर QR कोड, कोण थांबले आहे आणि गट दिसतात. गट आपोआप बनतात.",
  } as T,
  boardOf: {
    en: (name: string) => `${name} board`,
    mr: (name: string) => `${name} बोर्ड`,
  } as Record<Lang, (name: string) => string>,

  footer: {
    en: "Saath: shared autos from the Metro exit. Station data from OpenStreetMap.",
    mr: "साथ: मेट्रो गेटपासून शेअर्ड रिक्षा. स्थानकांची माहिती OpenStreetMap वरून.",
  } as T,
};
