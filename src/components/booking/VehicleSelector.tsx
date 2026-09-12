import { useMemo, useState } from "react";
import {
  BRAND_NAMES,
  OTHER_BRAND,
  OTHER_MODEL,
  PRICE_CATEGORY_LABELS,
  PRICES,
  SERVICE_DURATION_MINUTES,
  getModelsForBrand,
  getVehiclePrice,
  type PriceCategory,
  type BodyType,
} from "@/lib/vehicles";
import { useLang } from "@/lib/lang";
import { cn, formatEuro } from "@/lib/utils";
import type { VehicleId } from "@/lib/catalog";

export type VehicleSelection = {
  vehicleType: VehicleId;
  carBrand: string;
  carModel: string;
  carBodyType: BodyType | null;
  carPriceCategory: PriceCategory;
  carPrice: number;
  carPriceLabel: string;
  serviceDuration: number;
};

type Props = {
  value: {
    carBrand: string;
    carModel: string;
    carPriceCategory: PriceCategory | null;
  };
  onChange: (sel: VehicleSelection) => void;
};

const MANUAL_OPTIONS: { id: PriceCategory; hint: { lv: string; ru: string; en: string } }[] = [
  {
    id: "car",
    hint: {
      lv: "Sedans, hatchback, kupeja",
      ru: "Седан, хэтчбек, купе",
      en: "Sedan, hatchback, coupe",
    },
  },
  {
    id: "large_car",
    hint: {
      lv: "SUV, krosoveri, ģimenes minivens",
      ru: "SUV, кроссоверы, семейный минивэн",
      en: "SUV, crossover, family minivan",
    },
  },
  {
    id: "commercial",
    hint: {
      lv: "Komerctransports, mikroautobuss, «kabluki»",
      ru: "Коммерческий, микроавтобус, «каблуки»",
      en: "Commercial, minibus, vans",
    },
  },
];

export function VehicleSelector({ value, onChange }: Props) {
  const { lang } = useLang();
  const [brandQuery, setBrandQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  /** When true, force showing brand list even if brand already selected (user tapped "change"). */
  const [editingBrand, setEditingBrand] = useState(false);
  /** When true, force showing model list even if model already selected. */
  const [editingModel, setEditingModel] = useState(false);

  const brands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    const list = [...BRAND_NAMES, OTHER_BRAND];
    if (!q) return list;
    return list.filter((b) => b.toLowerCase().includes(q));
  }, [brandQuery]);

  const models = useMemo(() => {
    if (!value.carBrand || value.carBrand === OTHER_BRAND) return [];
    const list = getModelsForBrand(value.carBrand).map((m) => m.model);
    list.push(OTHER_MODEL);
    const q = modelQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => m.toLowerCase().includes(q));
  }, [value.carBrand, modelQuery]);

  const resolved =
    value.carBrand && value.carModel
      ? getVehiclePrice(value.carBrand, value.carModel, value.carPriceCategory)
      : null;

  const needManual =
    Boolean(value.carBrand) &&
    Boolean(value.carModel) &&
    (value.carBrand === OTHER_BRAND || value.carModel === OTHER_MODEL);

  const showBrandPicker = !value.carBrand || editingBrand;
  const showModelPicker =
    Boolean(value.carBrand) &&
    !showBrandPicker &&
    (!value.carModel || editingModel);

  function pickBrand(brand: string) {
    setModelQuery("");
    setBrandQuery("");
    setEditingBrand(false);
    setEditingModel(false);
    onChange({
      vehicleType: "car",
      carBrand: brand,
      carModel: "",
      carBodyType: null,
      carPriceCategory: "car",
      carPrice: PRICES.car,
      carPriceLabel: PRICE_CATEGORY_LABELS.car[lang],
      serviceDuration: SERVICE_DURATION_MINUTES,
    });
  }

  function changeBrand() {
    setModelQuery("");
    setBrandQuery("");
    setEditingBrand(true);
    setEditingModel(false);
    onChange({
      vehicleType: "car",
      carBrand: "",
      carModel: "",
      carBodyType: null,
      carPriceCategory: "car",
      carPrice: PRICES.car,
      carPriceLabel: PRICE_CATEGORY_LABELS.car[lang],
      serviceDuration: SERVICE_DURATION_MINUTES,
    });
  }

  function pickModel(model: string) {
    const brand = value.carBrand;
    setModelQuery("");
    setEditingModel(false);
    if (brand === OTHER_BRAND || model === OTHER_MODEL) {
      onChange({
        vehicleType: (value.carPriceCategory as VehicleId) || "car",
        carBrand: brand,
        carModel: model,
        carBodyType: null,
        carPriceCategory: value.carPriceCategory || "car",
        carPrice: PRICES[(value.carPriceCategory as PriceCategory) || "car"],
        carPriceLabel: PRICE_CATEGORY_LABELS[(value.carPriceCategory as PriceCategory) || "car"][lang],
        serviceDuration: SERVICE_DURATION_MINUTES,
      });
      return;
    }
    const r = getVehiclePrice(brand, model);
    onChange({
      vehicleType: r.priceCategory,
      carBrand: r.brand,
      carModel: r.model,
      carBodyType: r.bodyType,
      carPriceCategory: r.priceCategory,
      carPrice: r.price,
      carPriceLabel: r.priceLabel[lang],
      serviceDuration: r.serviceDuration,
    });
  }

  function changeModel() {
    setModelQuery("");
    setEditingModel(true);
    onChange({
      vehicleType: "car",
      carBrand: value.carBrand,
      carModel: "",
      carBodyType: null,
      carPriceCategory: "car",
      carPrice: PRICES.car,
      carPriceLabel: PRICE_CATEGORY_LABELS.car[lang],
      serviceDuration: SERVICE_DURATION_MINUTES,
    });
  }

  function pickManual(cat: PriceCategory) {
    onChange({
      vehicleType: cat,
      carBrand: value.carBrand || OTHER_BRAND,
      carModel: value.carModel || OTHER_MODEL,
      carBodyType: null,
      carPriceCategory: cat,
      carPrice: PRICES[cat],
      carPriceLabel: PRICE_CATEGORY_LABELS[cat][lang],
      serviceDuration: SERVICE_DURATION_MINUTES,
    });
  }

  const labels = {
    brand: { lv: "Marka", ru: "Марка", en: "Brand" },
    model: { lv: "Modelis", ru: "Модель", en: "Model" },
    search: { lv: "Meklēt…", ru: "Поиск…", en: "Search…" },
    otherBrand: { lv: "Cita marka", ru: "Другая марка", en: "Other brand" },
    otherModel: { lv: "Cits modelis", ru: "Другая модель", en: "Other model" },
    type: { lv: "Automašīnas tips", ru: "Тип автомобиля", en: "Vehicle type" },
    yourCar: { lv: "Jūsu auto", ru: "Ваш автомобиль", en: "Your vehicle" },
    category: { lv: "Kategorija", ru: "Категория", en: "Category" },
    price: { lv: "Cena", ru: "Стоимость", en: "Price" },
    duration: { lv: "Standarta laiks", ru: "Стандартное время", en: "Standard time" },
    minutes: { lv: "minūtes", ru: "минут", en: "minutes" },
    change: { lv: "Mainīt", ru: "Изменить", en: "Change" },
  };

  const brandDisplay =
    value.carBrand === OTHER_BRAND ? labels.otherBrand[lang] : value.carBrand;
  const modelDisplay =
    value.carModel === OTHER_MODEL ? labels.otherModel[lang] : value.carModel;

  const selectionComplete =
    Boolean(value.carBrand) &&
    Boolean(value.carModel) &&
    !editingBrand &&
    !editingModel &&
    (!needManual || Boolean(value.carPriceCategory));

  return (
    <div className="space-y-5">
      {/* Brand step */}
      <div>
        <label className="text-xs uppercase tracking-[0.18em] text-muted">{labels.brand[lang]}</label>

        {!showBrandPicker && value.carBrand ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-fg bg-elevated px-3 py-2.5">
              <span className="truncate text-sm font-medium">{brandDisplay}</span>
            </div>
            <button
              type="button"
              onClick={changeBrand}
              className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-sm text-muted hover:border-fg hover:text-fg"
            >
              {labels.change[lang]}
            </button>
          </div>
        ) : (
          <>
            <input
              type="search"
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
              placeholder={labels.search[lang]}
              autoFocus={editingBrand}
              className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-fg"
            />
            <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-border">
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => pickBrand(b === OTHER_BRAND ? OTHER_BRAND : b)}
                  className={cn(
                    "block w-full border-b border-line px-3 py-2.5 text-left text-sm last:border-0",
                    value.carBrand === b || (b === OTHER_BRAND && value.carBrand === OTHER_BRAND)
                      ? "bg-elevated font-medium"
                      : "hover:bg-elevated/60",
                  )}
                >
                  {b === OTHER_BRAND ? labels.otherBrand[lang] : b}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Model step — only when brand is locked */}
      {value.carBrand && !showBrandPicker ? (
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted">{labels.model[lang]}</label>

          {/* Locked model row */}
          {!showModelPicker && value.carModel ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-lg border border-fg bg-elevated px-3 py-2.5">
                <span className="truncate text-sm font-medium">{modelDisplay}</span>
              </div>
              <button
                type="button"
                onClick={changeModel}
                className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-sm text-muted hover:border-fg hover:text-fg"
              >
                {labels.change[lang]}
              </button>
            </div>
          ) : value.carBrand !== OTHER_BRAND ? (
            <>
              <input
                type="search"
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder={labels.search[lang]}
                autoFocus={editingModel}
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-fg"
              />
              <div className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-border">
                {models.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pickModel(m)}
                    className={cn(
                      "block w-full border-b border-line px-3 py-2.5 text-left text-sm last:border-0",
                      value.carModel === m ? "bg-elevated font-medium" : "hover:bg-elevated/60",
                    )}
                  >
                    {m === OTHER_MODEL ? labels.otherModel[lang] : m}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => pickModel(OTHER_MODEL)}
              className={cn(
                "mt-2 w-full rounded-lg border px-3 py-2.5 text-left text-sm",
                value.carModel === OTHER_MODEL ? "border-fg bg-elevated" : "border-border",
              )}
            >
              {labels.otherModel[lang]}
            </button>
          )}
        </div>
      ) : null}

      {/* Manual category — only when Other brand/model and model is locked */}
      {needManual && !editingModel && value.carModel ? (
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted">{labels.type[lang]}</label>
          <div className="mt-2 space-y-2">
            {MANUAL_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pickManual(o.id)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left",
                  value.carPriceCategory === o.id ? "border-fg bg-elevated" : "border-border",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{PRICE_CATEGORY_LABELS[o.id][lang]}</span>
                  <span className="tabular-nums">{formatEuro(PRICES[o.id], lang)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{o.hint[lang]}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Summary card — only when selection is complete */}
      {selectionComplete && resolved ? (
        <div className="rounded-xl border border-fg bg-elevated p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{labels.yourCar[lang]}</p>
          <p className="mt-1 font-display text-xl">
            {value.carBrand === OTHER_BRAND ? labels.otherBrand[lang] : value.carBrand}{" "}
            {value.carModel === OTHER_MODEL ? "" : value.carModel}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-muted">{labels.category[lang]}</dt>
              <dd>{resolved.priceLabel[lang]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{labels.price[lang]}</dt>
              <dd className="tabular-nums font-medium">{formatEuro(resolved.price, lang)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">{labels.duration[lang]}</dt>
              <dd>
                {SERVICE_DURATION_MINUTES} {labels.minutes[lang]}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
