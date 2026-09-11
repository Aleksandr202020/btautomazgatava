/**
 * Vehicle classification for BT Automazgātava.
 */
import dataA from "./vehicles-data-a.json";
import dataB from "./vehicles-data-b.json";

export type BodyType =
  | "sedan"
  | "hatchback"
  | "wagon"
  | "suv"
  | "mpv"
  | "van"
  | "commercial";

export type PriceCategory = "car" | "large_car" | "commercial";

export type VehicleEntry = {
  model: string;
  bodyType: BodyType;
  priceCategory: PriceCategory;
};

export type BrandEntry = {
  brand: string;
  models: VehicleEntry[];
};

export const PRICES: Record<PriceCategory, number> = {
  car: 25,
  large_car: 30,
  commercial: 35,
};

export const SERVICE_DURATION_MINUTES = 60;

export const PRICE_CATEGORY_LABELS: Record<
  PriceCategory,
  { lv: string; ru: string; en: string }
> = {
  car: { lv: "Vieglais auto", ru: "Легковой автомобиль", en: "Passenger car" },
  large_car: { lv: "Liels auto / minivens", ru: "Большой автомобиль / минивэн", en: "Large car / minivan" },
  commercial: { lv: "Komerctransports / mikroautobuss", ru: "Коммерческий / микроавтобус", en: "Commercial / minibus" },
};

const OTHER_BRAND = "Other";
const OTHER_MODEL = "Other";

export const VEHICLE_DATABASE = [...(dataA as BrandEntry[]), ...(dataB as BrandEntry[])];

export const BRAND_NAMES = VEHICLE_DATABASE.map((b) => b.brand).sort((a, b) =>
  a.localeCompare(b, "en"),
);

export function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const brandIndex = new Map<string, BrandEntry>();
for (const b of VEHICLE_DATABASE) {
  brandIndex.set(normalizeKey(b.brand), b);
  if (b.brand === "Škoda") brandIndex.set("skoda", b);
  if (b.brand === "Mercedes-Benz") {
    brandIndex.set("mercedes", b);
    brandIndex.set("mercedes benz", b);
  }
  if (b.brand === "Citroën") brandIndex.set("citroen", b);
  if (b.brand === "Volkswagen") brandIndex.set("vw", b);
}

export function findBrand(brand: string): BrandEntry | undefined {
  if (!brand || brand === OTHER_BRAND) return undefined;
  return brandIndex.get(normalizeKey(brand));
}

export function findModel(brand: string, model: string): VehicleEntry | undefined {
  if (!model || model === OTHER_MODEL) return undefined;
  const b = findBrand(brand);
  if (!b) return undefined;
  const key = normalizeKey(model);
  return b.models.find((m) => normalizeKey(m.model) === key);
}

export type ResolvedVehicle = {
  brand: string;
  model: string;
  bodyType: BodyType | null;
  priceCategory: PriceCategory;
  price: number;
  priceLabel: { lv: string; ru: string; en: string };
  serviceDuration: number;
  known: boolean;
};

export function getVehiclePrice(
  brand: string,
  model: string,
  manualCategory?: PriceCategory | null,
): ResolvedVehicle {
  const known = findModel(brand, model);
  if (known) {
    return {
      brand: findBrand(brand)?.brand ?? brand,
      model: known.model,
      bodyType: known.bodyType,
      priceCategory: known.priceCategory,
      price: PRICES[known.priceCategory],
      priceLabel: PRICE_CATEGORY_LABELS[known.priceCategory],
      serviceDuration: SERVICE_DURATION_MINUTES,
      known: true,
    };
  }
  const cat: PriceCategory =
    manualCategory && PRICES[manualCategory] != null ? manualCategory : "car";
  return {
    brand: brand || OTHER_BRAND,
    model: model || OTHER_MODEL,
    bodyType: null,
    priceCategory: cat,
    price: PRICES[cat],
    priceLabel: PRICE_CATEGORY_LABELS[cat],
    serviceDuration: SERVICE_DURATION_MINUTES,
    known: false,
  };
}

export function getModelsForBrand(brand: string): VehicleEntry[] {
  return findBrand(brand)?.models ?? [];
}

export { OTHER_BRAND, OTHER_MODEL };
