import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Car, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VehicleSelector, type VehicleSelection } from "@/components/booking/VehicleSelector";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/home-sections";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  cancelMyBooking,
  getAvailableSlots,
  listMyBookings,
  updateMyBooking,
  type BookingPublic,
} from "@/lib/booking";
import { useBookingUi } from "@/lib/booking-ui";
import { useLang } from "@/lib/lang";
import { upcomingDates } from "@/lib/slots";
import {
  addUserVehicle,
  deleteUserVehicle,
  listUserVehicles,
  setDefaultUserVehicle,
  type UserVehicle,
} from "@/lib/user-vehicles";
import { PRICE_CATEGORY_LABELS, type PriceCategory } from "@/lib/vehicles";
import { cn, formatEuro } from "@/lib/utils";

/** cabinet-hide-price-v2 */
export const Route = createFileRoute("/kabinets")({
  component: KabinetsPage,
});

function statusLabel(t: (k: any) => string, status: string): string {
  switch (status) {
    case "confirmed":
      return t("statusConfirmed");
    case "cancelled":
      return t("statusCancelled");
    case "completed":
      return t("statusCompleted");
    case "new":
      return t("statusNew");
    case "no-show":
      return t("statusNoShow");
    default:
      return status;
  }
}

function vehicleLabel(v: string, lang: string): string {
  const map: Record<string, Record<string, string>> = {
    car: { lv: "Vieglais auto", ru: "Легковая", en: "Passenger car" },
    large_car: { lv: "Krosovers / minivens", ru: "Кроссовер / минивэн", en: "Crossover / minivan" },
    commercial: { lv: "Mikroautobuss", ru: "Микроавтобус", en: "Minibus" },
    suv: { lv: "Krosovers / minivens", ru: "Кроссовер / минивэн", en: "Crossover / minivan" },
  };
  return map[v]?.[lang] ?? v;
}

function isUpcoming(b: BookingPublic): boolean {
  if (b.status === "cancelled" || b.status === "completed" || b.status === "no-show") return false;
  const iso = `${b.date}T${b.time}:00`;
  return new Date(iso).getTime() >= Date.now() - 60 * 60 * 1000;
}

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
  const [editing, setEditing] = useState<BookingPublic | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const vehiclesQ = useQuery({
    queryKey: ["user-vehicles"],
    enabled: Boolean(user) && !isPending,
    queryFn: async () => {
      const res = await listUserVehicles();
      return res.vehicles as UserVehicle[];
    },
  });

  const bookingsQ = useQuery({
    queryKey: ["my-bookings"],
    enabled: Boolean(user) && !isPending,
    queryFn: async () => {
      const res = await listMyBookings();
      return res.bookings as BookingPublic[];
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

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelMyBooking({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        setToast(t("bookingCancelled"));
        void qc.invalidateQueries({ queryKey: ["my-bookings"] });
      }
    },
  });

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (isPending) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted">…</div>;
  }

  if (!user) {
    return (
      <>
        <PageHero title={t("cabinetTitle")} lead={t("cabinetLead")} />
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-muted">{t("cabinetNeedSignIn")}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/login">
              <Button size="lg">{t("goToLogin")}</Button>
            </Link>
            <Button variant="secondary" size="lg" onClick={openWizard}>
              {t("bookCta")}
            </Button>
          </div>
        </div>
      </>
    );
  }

  const vehicles = vehiclesQ.data ?? [];
  const bookings = bookingsQ.data ?? [];
  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <>
      <PageHero title={t("cabinetTitle")} lead={t("cabinetLead")} />
      <div className="mx-auto max-w-lg space-y-10 px-4 py-10">
        {toast ? (
          <div className="rounded-lg border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">{toast}</div>
        ) : null}

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{t("myBookings")}</h2>
            <Button size="md" onClick={openWizard}>
              <Plus className="size-4" />
              {t("addBooking")}
            </Button>
          </div>

          {bookingsQ.isLoading ? (
            <p className="text-sm text-muted">…</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-elevated/50 px-5 py-10 text-center">
              <Calendar className="mx-auto size-10 text-muted" />
              <p className="mt-3 text-muted">{t("noBookings")}</p>
              <Button className="mt-5" size="lg" onClick={openWizard}>
                {t("addBooking")}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    {t("upcomingBookings")}
                  </h3>
                  <ul className="space-y-3">
                    {upcoming.map((b) => (
                      <BookingCard
                        key={b.id}
                        b={b}
                        lang={lang}
                        t={t}
                        onEdit={() => setEditing(b)}
                        onCancel={() => {
                          if (window.confirm(t("confirmCancelBooking"))) cancelMut.mutate(b.id);
                        }}
                        cancelling={cancelMut.isPending}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              {past.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("pastBookings")}
                  </h3>
                  <ul className="space-y-3">
                    {past.map((b) => (
                      <BookingCard key={b.id} b={b} lang={lang} t={t} past />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{t("myVehicles")}</h2>
            {!adding && vehicles.length < 8 ? (
              <Button variant="secondary" size="md" onClick={() => { setAdding(true); setErr(null); }}>
                <Plus className="size-4" />
                {t("addVehicle")}
              </Button>
            ) : null}
          </div>

          {vehiclesQ.isLoading ? (
            <p className="mt-4 text-sm text-muted">…</p>
          ) : vehicles.length === 0 && !adding ? (
            <p className="mt-4 text-sm text-muted">{t("noVehiclesYet")}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {vehicles.map((v) => (
                <li key={v.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated">
                    <Car className="size-4 text-fg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg">{v.brand} {v.model}</p>
                    <p className="text-sm text-muted">
                      {PRICE_CATEGORY_LABELS[v.priceCategory][lang as "lv" | "ru" | "en"]}
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
                      <button type="button" title={t("setDefault")} className="rounded-md border border-border p-2 text-muted hover:border-fg hover:text-fg" onClick={() => defMut.mutate(v.id)}>
                        <Star className="size-4" />
                      </button>
                    ) : null}
                    <button type="button" title={t("deleteVehicle")} className="rounded-md border border-border p-2 text-muted hover:border-danger hover:text-danger" onClick={() => { if (window.confirm(t("confirmDeleteVehicle"))) delMut.mutate(v.id); }}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted">{t("addVehicle")}</h3>
              <VehicleSelector
                hidePrice={true}
                value={draft}
                onChange={(s) => {
                  setSel(s);
                  setDraft({ carBrand: s.carBrand, carModel: s.carModel, carPriceCategory: s.carPriceCategory });
                }}
              />
              {err ? <p className="text-sm text-danger">{err}</p> : null}
              <div className="flex gap-2">
                <Button className="flex-1" size="lg" disabled={!sel || !sel.carBrand || !sel.carModel || ((sel.carBrand === "Other" || sel.carModel === "Other") && !sel.carPriceCategory) || addMut.isPending} onClick={() => addMut.mutate()}>
                  {t("saveVehicle")}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => { setAdding(false); setDraft({ carBrand: "", carModel: "", carPriceCategory: null }); setSel(null); setErr(null); }}>
                  {t("close")}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm text-muted">{t("cabinetBookHint")}</p>
          <Button className="mt-4 w-full" size="lg" onClick={openWizard}>{t("bookCta")}</Button>
        </section>
      </div>

      {editing ? (
        <EditBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setToast(t("bookingUpdated"));
            void qc.invalidateQueries({ queryKey: ["my-bookings"] });
          }}
        />
      ) : null}
    </>
  );
}

function BookingCard({
  b, lang, t, past, onEdit, onCancel, cancelling,
}: {
  b: BookingPublic; lang: string; t: (k: any) => string; past?: boolean;
  onEdit?: () => void; onCancel?: () => void; cancelling?: boolean;
}) {
  const canManage = !past && (b.status === "confirmed" || b.status === "new");
  return (
    <li className="rounded-xl border border-border bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-fg">{b.date} · {b.time}</p>
          <p className="mt-1 text-sm text-muted">{vehicleLabel(b.vehicleType, lang)} · {formatEuro(b.price, lang)}</p>
          <p className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", b.status === "confirmed" || b.status === "new" ? "bg-accent/10 text-accent" : b.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-elevated text-muted")}>
            {statusLabel(t, b.status)}
          </p>
          {b.comment ? <p className="mt-2 text-xs text-muted">{b.comment}</p> : null}
        </div>
        {canManage ? (
          <div className="flex shrink-0 flex-col gap-1">
            <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-elevated" onClick={onEdit}>
              <Pencil className="size-3.5" />
              {t("editBooking")}
            </button>
            <button type="button" disabled={cancelling} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/5 disabled:opacity-50" onClick={onCancel}>
              <X className="size-3.5" />
              {t("cancelBooking")}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function EditBookingModal({ booking, onClose, onSaved }: { booking: BookingPublic; onClose: () => void; onSaved: () => void }) {
  const { t, lang } = useLang();
  const dates = useMemo(() => upcomingDates(14), []);
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [vehicleType, setVehicleType] = useState(booking.vehicleType);
  const [err, setErr] = useState<string | null>(null);

  const slotsQ = useQuery({
    queryKey: ["slots", date],
    queryFn: async () => {
      const res = await getAvailableSlots({ data: { date } });
      return res.slots;
    },
  });

  const saveMut = useMutation({
    mutationFn: () =>
      updateMyBooking({
        data: {
          id: booking.id,
          date,
          time,
          vehicleType: vehicleType as "car" | "large_car" | "commercial" | "suv",
        },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        setErr(res.error === "slot_taken" ? t("slotTaken") : t("errorGeneric"));
        return;
      }
      onSaved();
    },
    onError: () => setErr(t("errorGeneric")),
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const slots = slotsQ.data ?? [];
  const freeSlots = slots.filter((s) => s.free || s.time === booking.time);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} role="presentation" />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl">{t("editBookingTitle")}</h3>
          <button type="button" className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-fg" onClick={onClose} aria-label={t("close")}>
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t("bookingDate")}</label>
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <button key={d} type="button" onClick={() => { setDate(d); setTime(""); }} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition", date === d ? "border-accent bg-accent/10 text-accent" : "border-border text-fg hover:bg-elevated")}>
                  {d.slice(5)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t("bookingTime")}</label>
            {slotsQ.isLoading ? (
              <p className="text-sm text-muted">…</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {freeSlots.map((s) => (
                  <button key={s.time} type="button" onClick={() => setTime(s.time)} className={cn("rounded-lg border py-2 text-sm font-medium transition", time === s.time ? "border-accent bg-accent text-white" : "border-border text-fg hover:bg-elevated")}>
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t("bookingVehicle")}</label>
            <div className="grid grid-cols-1 gap-2">
              {(["car", "large_car", "commercial"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVehicleType(v)} className={cn("rounded-lg border px-3 py-2 text-left text-sm font-medium transition", vehicleType === v ? "border-accent bg-accent/10 text-accent" : "border-border text-fg hover:bg-elevated")}>
                  {vehicleLabel(v, lang)}
                </button>
              ))}
            </div>
          </div>

          {err ? <p className="text-sm text-danger">{err}</p> : null}

          <Button className="w-full" size="lg" disabled={!time || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {t("saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
}
