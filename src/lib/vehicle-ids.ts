export type VehicleId = "car" | "large_car" | "commercial";
export type LegacyVehicleId = VehicleId | "suv";

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
    id: "large_car",
    price: 30,
    label: { lv: "Liels auto / minivens", ru: "Большой автомобиль / минивэн", en: "Large car / minivan" },
    hint: {
      lv: "SUV, krosoveri, ģimenes MPV (piem. Zafira, Touran)",
      ru: "SUV, кроссоверы, семейные MPV (напр. Zafira, Touran)",
      en: "SUV, crossovers, family MPV (e.g. Zafira, Touran)",
    },
  },
  {
    id: "commercial",
    price: 35,
    label: { lv: "Komerctransports / mikroautobuss", ru: "Коммерческий / микроавтобус", en: "Commercial / minibus" },
    hint: {
      lv: "Caddy, Berlingo, Vito, Transporter, Sprinter u.c.",
      ru: "Caddy, Berlingo, Vito, Transporter, Sprinter и др.",
      en: "Caddy, Berlingo, Vito, Transporter, Sprinter, etc.",
    },
  },
];

export function normalizeVehicleId(id: string): VehicleId {
  if (id === "suv") return "large_car";
  if (id === "car" || id === "large_car" || id === "commercial") return id;
  return "car";
}
