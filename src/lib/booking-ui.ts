import { create } from "zustand";
import type { ExtraId, VehicleId } from "./catalog";
import type { BodyType, PriceCategory } from "./vehicles";

/** 1 = account, 2 = vehicle … 8 = confirm */
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Draft = {
  vehicleType: VehicleId | null;
  carBrand: string;
  carModel: string;
  carBodyType: BodyType | null;
  carPriceCategory: PriceCategory | null;
  carPrice: number | null;
  carPriceLabel: string;
  serviceDuration: number;
  extras: ExtraId[];
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  comment: string;
  privacy: boolean;
};

const emptyDraft = (): Draft => ({
  vehicleType: null,
  carBrand: "",
  carModel: "",
  carBodyType: null,
  carPriceCategory: null,
  carPrice: null,
  carPriceLabel: "",
  serviceDuration: 60,
  extras: [],
  date: "",
  time: "",
  name: "",
  phone: "",
  email: "",
  comment: "",
  privacy: false,
});

type Store = {
  open: boolean;
  step: WizardStep;
  draft: Draft;
  openWizard: () => void;
  closeWizard: () => void;
  setStep: (s: WizardStep) => void;
  patch: (p: Partial<Draft>) => void;
  reset: () => void;
};

export const useBookingUi = create<Store>((set) => ({
  open: false,
  step: 1,
  draft: emptyDraft(),
  openWizard: () => {
    set({ open: true, step: 1 });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bta:event", { detail: { event: "booking_started" } }));
    }
  },
  closeWizard: () => set({ open: false }),
  setStep: (step) => set({ step }),
  patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
  reset: () => set({ step: 1, draft: emptyDraft() }),
}));
