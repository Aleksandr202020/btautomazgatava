export const BUSINESS = {
  name: "BTAUTOMAZGATAVA",
  tagline: "Rokas automazgātava Rīgā",
  phone: "+37126059326",
  phoneDisplay: "+371 26 059 326",
  email: "info@btautomazgatava.lv",
  address: "Krasta iela 42, Rīga, LV-1003",
  city: "Rīga",
  country: "Latvia",
  hours: "09:00–21:00",
  open: "09:00",
  close: "21:00",
  lat: 56.935658,
  lng: 24.140163,
  whatsapp: "37126059326",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  mapsGoogle: "https://www.google.com/maps/search/?api=1&query=56.935658,24.140163",
  mapsOsm: "https://www.openstreetmap.org/?mlat=56.935658&mlon=24.140163#map=17/56.935658/24.140163",
  mapsEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=24.130163%2C56.930658%2C24.150163%2C56.940658&layer=mapnik&marker=56.935658%2C24.140163",
} as const;

export const SLOT_MINUTES = 60;
export const WORK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const HOLIDAYS: string[] = [];

export type VehicleId = "car" | "suv";
export type ExtraId = "tyres" | "leather" | "antirain" | "engine" | "fragrance";
export type ServiceId = "komplekss";

export const VEHICLES: {
  id: VehicleId;
  price: number;
  label: { lv: string; ru: string; en: string };
  hint: { lv: string; ru: string; en: string };
}[] = [
  {
    id: "car",
    price: 25,
    label: { lv: "Vieglais auto", ru: "Легковой", en: "Passenger car" },
    hint: { lv: "Sedans, hatchback, kupeja", ru: "Седан, хэтчбек, купе", en: "Sedan, hatchback, coupe" },
  },
  {
    id: "suv",
    price: 30,
    label: { lv: "Jeep / Crossover / Minivan", ru: "Jeep / Crossover / Minivan", en: "Jeep / Crossover / Minivan" },
    hint: { lv: "SUV, apvidus, ģimenes", ru: "Внедорожник, кроссовер, минивэн", en: "SUV, crossover, minivan" },
  },
];

export const SERVICE = {
  id: "komplekss" as ServiceId,
  priceFrom: 25,
  label: { lv: "Kompleksā mazgāšana", ru: "Комплексная мойка", en: "Full hand wash" },
  summary: {
    lv: "Virsbūve, salons, stikli un paklājiņi — ar rokām, bez steigas.",
    ru: "Кузов, салон, стёкла и коврики — вручную, без спешки.",
    en: "Body, interior, glass and mats — by hand, without rush.",
  },
  includes: {
    lv: [
      "Virsbūves mazgāšana ar rokām",
      "Karcher skalošana",
      "Salona putekļsūcējs",
      "Paneļu tīrīšana",
      "Stiklu tīrīšana",
      "Gumijas paklājiņu mazgāšana",
    ],
    ru: [
      "Ручная мойка кузова",
      "Ополаскивание Karcher",
      "Пылесос салона",
      "Очистка панелей",
      "Очистка стёкол",
      "Мойка резиновых ковриков",
    ],
    en: [
      "Hand wash of the body",
      "Karcher rinse",
      "Interior vacuum",
      "Dashboard wipe-down",
      "Glass cleaning",
      "Rubber mat wash",
    ],
  },
};

export const EXTRAS: {
  id: ExtraId;
  price: number;
  label: { lv: string; ru: string; en: string };
}[] = [
  { id: "tyres", price: 4, label: { lv: "Riepu apstrāde", ru: "Обработка шин", en: "Tyre dressing" } },
  { id: "leather", price: 4, label: { lv: "Ādas salona apstrāde", ru: "Обработка кожи", en: "Leather care" } },
  { id: "antirain", price: 4, label: { lv: "Antilietus priekšējam stiklam", ru: "Антидождь на лобовое", en: "Anti-rain for windscreen" } },
  { id: "engine", price: 10, label: { lv: "Dzinēja mazgāšana", ru: "Мойка двигателя", en: "Engine bay wash" } },
  { id: "fragrance", price: 3, label: { lv: "Salona aromatizācija", ru: "Ароматизация салона", en: "Interior fragrance" } },
];

export function calcPrice(vehicle: VehicleId, extras: ExtraId[]): number {
  const base = VEHICLES.find((v) => v.id === vehicle)?.price ?? 0;
  const extraSum = extras.reduce((sum, id) => {
    const item = EXTRAS.find((e) => e.id === id);
    return sum + (item?.price ?? 0);
  }, 0);
  return base + extraSum;
}

export const GALLERY = [
  { src: "/images/hero.jpg", alt: "Freshly washed dark sedan", cat: "exterior" },
  { src: "/images/suv.jpg", alt: "White crossover after hand wash", cat: "exterior" },
  { src: "/images/interior.jpg", alt: "Detailed leather interior", cat: "interior" },
  { src: "/images/wash-hands.jpg", alt: "Hand wash with foam", cat: "detailing" },
  { src: "/images/beads.jpg", alt: "Water beading on coated paint", cat: "detailing" },
  { src: "/images/bay.jpg", alt: "Wash bay at dusk", cat: "exterior" },
] as const;

export const REVIEWS = [
  {
    name: "Jānis K.",
    rating: 5,
    date: "2026-08-12",
    text: {
      lv: "Mazgā ar rokām, nevis steidz caur tuneli. Auto izskatījās kā pēc detailing — bez skrāpējumiem uz lakas.",
      ru: "Моют руками, не гонят через туннель. Машина как после детейлинга — без царапин на лаке.",
      en: "Washed by hand, not rushed through a tunnel. The car looked detailed — no swirl marks.",
    },
  },
  {
    name: "Anna P.",
    rating: 5,
    date: "2026-07-28",
    text: {
      lv: "Pieraksts strādā, neatnācu uz gaidīšanu. Q5 bija tīrs gan ārā, gan salonā. Ieteikšu.",
      ru: "Запись работает, без очереди. Q5 чисто снаружи и в салоне. Рекомендую.",
      en: "Booking worked, no queue. The Q5 was clean outside and in. I'll recommend them.",
    },
  },
  {
    name: "Sergejs M.",
    rating: 4,
    date: "2026-07-03",
    text: {
      lv: "Labs darbs, 30 minūtes jeep. Riepu apstrāde izskatās dārgi. Nākamreiz ņemšu arī antillietu.",
      ru: "Хорошая работа, около часа на jeep. Чернение шин выглядит дорого. В следующий раз возьму антидождь.",
      en: "Solid work, about an hour on a jeep. Tyre dressing looks expensive. Next time I'll add anti-rain.",
    },
  },
  {
    name: "Elīna B.",
    rating: 5,
    date: "2026-06-19",
    text: {
      lv: "Paņēmu komplekso + ādu. Salons smaržo, paneļi nav taukaini. Ērti, ka var zvanīt un pārcelt laiku.",
      ru: "Взяла комплекс + кожу. Салон пахнет, панели не жирные. Удобно, что можно перенести время звонком.",
      en: "Took the full wash plus leather. Cabin smells clean, dash isn't greasy. Easy to move the slot by phone.",
    },
  },
] as const;

export const FAQ = [
  {
    q: {
      lv: "Vai var atbraukt bez pieraksta?",
      ru: "Можно приехать без записи?",
      en: "Can I come without a booking?",
    },
    a: {
      lv: "Mums ir viens darba posts, tāpēc strādājam pēc iepriekšēja pieraksta. Tas nozīmē — Jūs neatnākat uz rindu.",
      ru: "У нас один пост, поэтому работаем по предварительной записи. Вы не стоите в очереди.",
      en: "We run a single bay, so we work by appointment. You will not wait in a queue.",
    },
  },
  {
    q: {
      lv: "Cik ilgi aizņem mazgāšana?",
      ru: "Сколько длится мойка?",
      en: "How long does a wash take?",
    },
    a: {
      lv: "Parasti ap vienu stundu. Jeep un minivan var aizņemt nedaudz ilgāk. Slota garums ir 60 minūtes.",
      ru: "Обычно около часа. Jeep и минивэн могут занять чуть больше. Слот — 60 минут.",
      en: "Usually about an hour. Jeeps and minivans can take a little longer. Slots are 60 minutes.",
    },
  },
  {
    q: {
      lv: "Kas ietilpst 25 € / 30 € cenā?",
      ru: "Что входит в цену 25 € / 30 €?",
      en: "What is included in 25 € / 30 €?",
    },
    a: {
      lv: "Roku mazgāšana virsbūvei, Karcher, salona putekļsūcējs, paneļi, stikli un gumijas paklājiņi. Vasks ietilpst kompleksā.",
      ru: "Ручная мойка кузова, Karcher, пылесос салона, панели, стёкла и резиновые коврики. Воск входит в комплекс.",
      en: "Hand body wash, Karcher, interior vacuum, panels, glass and rubber mats. Wax is part of the package.",
    },
  },
  {
    q: {
      lv: "Kā var apmaksāt?",
      ru: "Как можно оплатить?",
      en: "How can I pay?",
    },
    a: {
      lv: "Uz vietas — skaidra nauda vai karte. Tiešsaistes apmaksa nav nepieciešama, lai rezervētu laiku.",
      ru: "На месте — наличные или карта. Онлайн-оплата для записи не нужна.",
      en: "On site — cash or card. You do not need to pay online to reserve a slot.",
    },
  },
  {
    q: {
      lv: "Ko darīt, ja nevaru ierasties?",
      ru: "Что делать, если не смогу приехать?",
      en: "What if I cannot make it?",
    },
    a: {
      lv: "Lūdzu, piezvaniet pēc iespējas ātrāk. Mēs atbrīvosim Jūsu laiku nākamajam klientam.",
      ru: "Позвоните как можно раньше — освободим слот для следующего клиента.",
      en: "Please call as soon as you can so we can free the slot for the next car.",
    },
  },
  {
    q: {
      lv: "Vai mazgājat dzinēju?",
      ru: "Моете ли двигатель?",
      en: "Do you wash the engine bay?",
    },
    a: {
      lv: "Jā, kā papildu pakalpojumu no 10 €. Pastāstiet par to pierakstā vai zvanot.",
      ru: "Да, как доп. услуга от 10 €. Укажите это при записи или по телефону.",
      en: "Yes, as an extra from 10 €. Add it in the booking or mention it when you call.",
    },
  },
] as const;
