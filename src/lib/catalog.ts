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
  chemistry: "DAERG CHIMICA",
  equipment: "Kärcher",
} as const;

export const SLOT_MINUTES = 60;
export const WORK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const HOLIDAYS: string[] = [];

export type VehicleId = "car" | "suv";
export type ExtraId = "fragrance" | "tyres" | "leather" | "antirain" | "discs" | "engine";
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
    label: { lv: "SUV / Crossover / Minivan", ru: "SUV / Crossover / Minivan", en: "SUV / Crossover / Minivan" },
    hint: { lv: "SUV, apvidus, ģimenes", ru: "Внедорожник, кроссовер, минивэн", en: "SUV, crossover, minivan" },
  },
];

export const SERVICE = {
  id: "komplekss" as ServiceId,
  priceFrom: 25,
  label: { lv: "Kompleksā mazgāšana", ru: "Комплексная мойка", en: "Full hand wash" },
  summary: {
    lv: "Mēs cenšamies iegūt maksimāli kvalitatīvu rezultātu ierobežotā apkalpošanas laikā.",
    ru: "Мы стараемся получить максимально качественный результат за отведённое время обслуживания.",
    en: "We aim for the highest quality result within the time allocated for your car.",
  },
  exterior: {
    lv: [
      "Iepriekšēja virsbūves mazgāšana ar speciālo autoķīmiju",
      "Noskalošana",
      "Roku mazgāšana virsbūvei",
      "Gumijas paklājiņu mazgāšana",
      "Vaska uzklāšana",
      "Gala noskalošana",
      "Virsbūves žāvēšana",
    ],
    ru: [
      "Предварительная мойка кузова специальной автохимией",
      "Ополаскивание",
      "Ручная мойка кузова",
      "Мойка резиновых ковриков",
      "Нанесение воска",
      "Финальное ополаскивание",
      "Сушка кузова",
    ],
    en: [
      "Pre-wash of the body with specialist chemistry",
      "Rinse",
      "Hand wash of the body",
      "Rubber mat wash",
      "Wax application",
      "Final rinse",
      "Body drying",
    ],
  },
  interior: {
    lv: [
      "Salona putekļsūcējs",
      "Sēdekļu tīrīšana",
      "Grīdas tīrīšana",
      "Bagāžnieka tīrīšana (ja brīvs)",
      "Tekstila paklājiņu tīrīšana",
      "Paneļu tīrīšana",
      "Plastmasas elementu tīrīšana",
      "Stiklu tīrīšana no iekšpuses",
    ],
    ru: [
      "Пылесос салона",
      "Очистка сидений",
      "Очистка пола",
      "Очистка багажника (если свободен)",
      "Очистка текстильных ковриков",
      "Очистка панелей",
      "Очистка пластиковых элементов",
      "Очистка стёкол изнутри",
    ],
    en: [
      "Interior vacuum",
      "Seat cleaning",
      "Floor cleaning",
      "Boot cleaning (if empty)",
      "Textile mat cleaning",
      "Dashboard wipe-down",
      "Plastic elements cleaning",
      "Interior glass cleaning",
    ],
  },
  includes: {
    lv: [] as string[],
    ru: [] as string[],
    en: [] as string[],
  },
};

SERVICE.includes = {
  lv: [...SERVICE.exterior.lv, ...SERVICE.interior.lv],
  ru: [...SERVICE.exterior.ru, ...SERVICE.interior.ru],
  en: [...SERVICE.exterior.en, ...SERVICE.interior.en],
};

export const EXTRAS: {
  id: ExtraId;
  price: number;
  label: { lv: string; ru: string; en: string };
}[] = [
  { id: "fragrance", price: 3, label: { lv: "Aromatizācija", ru: "Ароматизация", en: "Fragrance" } },
  { id: "tyres", price: 4, label: { lv: "Riepu apstrāde", ru: "Обработка шин", en: "Tyre dressing" } },
  { id: "leather", price: 4, label: { lv: "Ādas apstrāde", ru: "Обработка кожи", en: "Leather care" } },
  { id: "antirain", price: 4, label: { lv: "Antilietus", ru: "Антидождь", en: "Anti-rain" } },
  { id: "discs", price: 4, label: { lv: "Disku tīrīšana", ru: "Очистка дисков", en: "Wheel cleaning" } },
  { id: "engine", price: 15, label: { lv: "Dzinēja mazgāšana", ru: "Мойка двигателя", en: "Engine bay wash" } },
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
      lv: "Labs darbs, ap stundu jeep. Riepu apstrāde izskatās dārgi. Nākamreiz ņemšu arī antilietu.",
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
      lv: "Vai nepieciešama iepriekšēja rezervācija?",
      ru: "Нужна ли предварительная запись?",
      en: "Is a prior booking required?",
    },
    a: {
      lv: "Jā. Mums ir viens darba posts, tāpēc strādājam tikai pēc iepriekšēja pieraksta. Jūs neatnākat uz rindu.",
      ru: "Да. У нас один пост, поэтому работаем только по предварительной записи. Вы не стоите в очереди.",
      en: "Yes. We run a single bay, so we work only by appointment. You will not wait in a queue.",
    },
  },
  {
    q: {
      lv: "Cik ilgi ilgst automašīnas apkalpošana?",
      ru: "Сколько длится обслуживание автомобиля?",
      en: "How long does a service take?",
    },
    a: {
      lv: "Parasti ap vienu stundu. SUV un minivan var aizņemt nedaudz ilgāk. Slota garums ir 60 minūtes.",
      ru: "Обычно около часа. SUV и минивэн могут занять чуть больше. Слот — 60 минут.",
      en: "Usually about an hour. SUVs and minivans can take a little longer. Slots are 60 minutes.",
    },
  },
  {
    q: {
      lv: "Kas ir iekļauts kompleksā?",
      ru: "Что входит в комплекс?",
      en: "What is included in the package?",
    },
    a: {
      lv: "Ārējā manuālā mazgāšana (ķīmija, skalošana, vasks, žāvēšana) un salona tīrīšana (putekļsūcējs, sēdekļi, grīda, paneļi, stikli). Pilns saraksts ir uz lapas.",
      ru: "Внешняя ручная мойка (химия, ополаскивание, воск, сушка) и очистка салона (пылесос, сиденья, пол, панели, стёкла). Полный список — на сайте.",
      en: "Exterior hand wash (chemistry, rinse, wax, dry) and interior clean (vacuum, seats, floor, panels, glass). Full list is on the page.",
    },
  },
  {
    q: {
      lv: "Vai mazgājat SUV un krosoverus?",
      ru: "Моете ли SUV и кроссоверы?",
      en: "Do you wash SUVs and crossovers?",
    },
    a: {
      lv: "Jā. SUV / Crossover / Minivan — 30 €.",
      ru: "Да. SUV / Crossover / Minivan — 30 €.",
      en: "Yes. SUV / Crossover / Minivan — 30 €.",
    },
  },
  {
    q: {
      lv: "Vai var pievienot papildu pakalpojumus?",
      ru: "Можно ли добавить дополнительные услуги?",
      en: "Can I add extra services?",
    },
    a: {
      lv: "Jā — aromatizācija, riepas, āda, antilietus, diski, dzinējs. Izvēlieties tos pieraksta formā.",
      ru: "Да — ароматизация, шины, кожа, антидождь, диски, двигатель. Выберите их в форме записи.",
      en: "Yes — fragrance, tyres, leather, anti-rain, wheels, engine. Select them in the booking form.",
    },
  },
  {
    q: {
      lv: "Vai varu atcelt rezervāciju?",
      ru: "Могу ли я отменить запись?",
      en: "Can I cancel a booking?",
    },
    a: {
      lv: "Jā. Lūdzu, piezvaniet vai uzrakstiet WhatsApp pēc iespējas ātrāk, lai atbrīvotu laiku nākamajam klientam.",
      ru: "Да. Позвоните или напишите в WhatsApp как можно раньше, чтобы освободить слот.",
      en: "Yes. Please call or message on WhatsApp as soon as you can so we can free the slot.",
    },
  },
  {
    q: {
      lv: "Vai cena mainās, ja automašīna ir ļoti netīra?",
      ru: "Меняется ли цена, если машина очень грязная?",
      en: "Does the price change if the car is very dirty?",
    },
    a: {
      lv: "Nē. Cena atkarīga no auto tipa un izvēlētajiem pakalpojumiem. Nestandarta papildu darbi tiek saskaņoti atsevišķi.",
      ru: "Нет. Цена зависит от типа авто и выбранных услуг. Нестандартные дополнительные работы согласовываются отдельно.",
      en: "No. Price depends on vehicle type and selected services. Non-standard extra work is agreed separately.",
    },
  },
] as const;
