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
    label: {
      lv: "Vieglais auto",
      ru: "Легковая",
      en: "Passenger car",
    },
    hint: {
      lv: "Sedans, hatchback, kupeja",
      ru: "Седан, хэтчбек, купе",
      en: "Sedan, hatchback, coupe",
    },
  },
  {
    id: "large_car",
    price: 30,
    label: {
      lv: "Krosovers / minivens",
      ru: "Кроссовер / минивэн",
      en: "Crossover / minivan",
    },
    hint: {
      lv: "SUV, krosoveri, ģimenes MPV",
      ru: "SUV, кроссоверы, семейный минивэн",
      en: "SUV, crossovers, family MPV",
    },
  },
  {
    id: "commercial",
    price: 35,
    label: {
      lv: "Mikroautobuss",
      ru: "Микроавтобус",
      en: "Minibus",
    },
    hint: {
      lv: "Caddy, Berlingo, Vito, Transporter, Sprinter",
      ru: "Caddy, Berlingo, Vito, Transporter, Sprinter",
      en: "Caddy, Berlingo, Vito, Transporter, Sprinter",
    },
  },
];

export function normalizeVehicleId(id: string): VehicleId {
  if (id === "suv") return "large_car";
  if (id === "car" || id === "large_car" || id === "commercial") return id;
  return "car";
}
