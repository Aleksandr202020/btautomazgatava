import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { VehicleSelector, type VehicleSelection } from "@/components/booking/VehicleSelector";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/home-sections";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useLang } from "@/lib/lang";
import {
  addUserVehicle,
  deleteUserVehicle,
  listUserVehicles,
  setDefaultUserVehicle,
  type UserVehicle,
} from "@/lib/user-vehicles";
import { PRICE_CATEGORY_LABELS, type PriceCategory } from "@/lib/vehicles";
import { cn, formatEuro } from "@/lib/utils";
import { useBookingUi } from "@/lib/booking-ui";

export const Route = createFileRoute("/kabinets")({
  component: KabinetsPage,
});

function KabinetsPage() {
  const { t, lang } = useLang();
  const { user, isPending } = useCurrentUserState();
  const openWizard = useBookingUi((s) => s.openWizard);
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{
    carBrand: string;
    carModel: string;
    carPriceCategory: PriceCategory | null;
  }>({ carBrand: "", carModel: "", carPriceCategory: null });
  const [sel, setSel] = useState<VehicleSelection | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const vehiclesQ = useQuery({
    queryKey: ["user-vehicles"],
    enabled: Boolean(user) && !isPending,
    queryFn: async () => {
      const res = await listUserVehicles();
      return res.vehicles as UserVehicle[];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!sel) throw new Error("incomplete");
      return addUserVehicle({
        data: {
          brand: sel.carBrand,
          model: sel.carModel,
          bodyType: sel.carBodyType,
          priceCategory: sel.carPriceCategory,
          isDefault: (vehiclesQ.data?.length ?? 0) === 0,
        },
      });
    },
    onSuccess: (res) => {
      if (!res.ok) {
        setErr(res.error === "limit" ? t("vehiclesLimit") : t("errorGeneric"));
        return;
      }
      setAdding(false);
      setDraft({ carBrand: "", carModel: "", carPriceCategory: null });
      setSel(null);
      setErr(null);
      void qc.invalidateQueries({ queryKey: ["user-vehicles"] });
    },
    onError: () => setErr(t("errorGeneric")),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteUserVehicle({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["user-vehicles"] }),
  });

  const defMut = useMutation({
    mutationFn: (id: number) => setDefaultUserVehicle({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["user-vehicles"] }),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted">
        …
      </div>
    );
  }

  // Auth off → DEV_USER; auth on + signed out → simple prompt
  if (!user) {
    return (
      <>
        <PageHero title={t("cabinetTitle")} lead={t("cabinetLead")} />
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-muted">{t("cabinetNeedSignIn")}</p>
          <Button className="mt-6" size="lg" onClick={openWizard}>
            {t("bookCta")}
          </Button>
        </div>
      </>
    );
  }

  const vehicles = vehiclesQ.data ?? [];

  return (
    <>
      <PageHero title={t("cabinetTitle")} lead={t("cabinetLead")} />
      <div className="mx-auto max-w-lg space-y-8 px-4 py-10">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{t("myVehicles")}</h2>
            {!adding && vehicles.length < 8 ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setAdding(true);
                  setErr(null);
                }}
              >
                <Plus className="mr-1.5 size-4" />
                {t("addVehicle")}
              </Button>
            ) : null}
          </div>

          {vehiclesQ.isLoading ? (
            <div className="mt-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
              ))}
            </div>
          ) : vehicles.length === 0 && !adding ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <Car className="mx-auto size-8 text-muted" />
              <p className="mt-3 text-sm text-muted">{t("noVehiclesYet")}</p>
              <Button className="mt-5" size="lg" onClick={() => setAdding(true)}>
                <Plus className="mr-1.5 size-4" />
                {t("addVehicle")}
              </Button>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {vehicles.map((v) => (
                <li
                  key={v.id}
                  className={cn(
                    "rounded-xl border p-4",
                    v.isDefault ? "border-fg bg-elevated" : "border-border bg-surface",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {v.brand === "Other" ? t("otherBrand") : v.brand}{" "}
                        {v.model === "Other" ? "" : v.model}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {PRICE_CATEGORY_LABELS[v.priceCategory][lang]} · {" "}
                        <span className="tabular-nums text-fg">{formatEuro(v.price, lang)}</span>
                      </p>
                      {v.isDefault ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                          <Star className="size-3 fill-current" />
                          {t("defaultVehicle")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!v.isDefault ? (
                        <button
                          type="button"
                          title={t("setDefault")}
                          className="rounded-md border border-border p-2 text-muted hover:border-fg hover:text-fg"
                          onClick={() => defMut.mutate(v.id)}
                        >
                          <Star className="size-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        title={t("deleteVehicle")}
                        className="rounded-md border border-border p-2 text-muted hover:border-danger hover:text-danger"
                        onClick={() => {
                          if (window.confirm(t("confirmDeleteVehicle"))) delMut.mutate(v.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted">
                {t("addVehicle")}
              </h3>
              <VehicleSelector
                value={draft}
                onChange={(s) => {
                  setSel(s);
                  setDraft({
                    carBrand: s.carBrand,
                    carModel: s.carModel,
                    carPriceCategory: s.carPriceCategory,
                  });
                }}
              />
              {err ? <p className="text-sm text-danger">{err}</p> : null}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={
                    !sel ||
                    !sel.carBrand ||
                    !sel.carModel ||
                    ((sel.carBrand === "Other" || sel.carModel === "Other") && !sel.carPriceCategory) ||
                    addMut.isPending
                  }
                  onClick={() => addMut.mutate()}
                >
                  {t("saveVehicle")}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setAdding(false);
                    setDraft({ carBrand: "", carModel: "", carPriceCategory: null });
                    setSel(null);
                    setErr(null);
                  }}
                >
                  {t("close")}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm text-muted">{t("cabinetBookHint")}</p>
          <Button className="mt-4 w-full" size="lg" onClick={openWizard}>
            {t("bookCta")}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            <Link to="/pieraksts" className="underline hover:text-fg">
              {t("navBook")}
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
