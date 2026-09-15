import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createBooking, getAvailableSlots, type BookingPublic } from "@/lib/booking";
import { useBookingUi, type WizardStep } from "@/lib/booking-ui";
import { BUSINESS, calcPrice, EXTRAS, SERVICE, VEHICLES, type VehicleId } from "@/lib/catalog";
import { VehicleSelector } from "@/components/booking/VehicleSelector";
import { ExtrasStep } from "@/components/booking/ExtrasStep";
import { LoginForm } from "@/components/auth/AuthForms";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useLang } from "@/lib/lang";
import { listUserVehicles, type UserVehicle } from "@/lib/user-vehicles";
import { PRICE_CATEGORY_LABELS, SERVICE_DURATION_MINUTES } from "@/lib/vehicles";
import { upcomingDates } from "@/lib/slots";
import { cn, formatEuro, track } from "@/lib/utils";
import type { Draft } from "@/lib/booking-ui";

const STEPS: WizardStep[] = [1, 2, 3, 4, 5, 6, 7, 8];

type Slot = { time: string; free: boolean };
type SlotsResult = { date: string; slots: Slot[] };

function weekdayLabel(iso: string, lang: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d));
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang === "ru" ? "ru-RU" : "lv-LV", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dt);
}

function icsContent(b: BookingPublic) {
  const stamp = b.date.replace(/-/g, "");
  const start = b.time.replace(":", "") + "00";
  const [h, m] = b.time.split(":").map(Number);
  const endMins = (h ?? 0) * 60 + (m ?? 0) + 60;
  const end = `${String(Math.floor(endMins / 60)).padStart(2, "0")}${String(endMins % 60).padStart(2, "0")}00`;
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BTAUTOMAZGATAVA//booking//LV\nBEGIN:VEVENT\nDTSTART;TZID=Europe/Riga:${stamp}T${start}\nDTEND;TZID=Europe/Riga:${stamp}T${end}\nSUMMARY:BTAUTOMAZGATAVA\nLOCATION:${BUSINESS.address}\nDESCRIPTION:Hand car wash booking\nEND:VEVENT\nEND:VCALENDAR`;
}

function googleCalUrl(b: BookingPublic) {
  const stamp = b.date.replace(/-/g, "");
  const start = b.time.replace(":", "") + "00";
  const [h, m] = b.time.split(":").map(Number);
  const endMins = (h ?? 0) * 60 + (m ?? 0) + 60;
  const end = `${String(Math.floor(endMins / 60)).padStart(2, "0")}${String(endMins % 60).padStart(2, "0")}00`;
  const dates = `${stamp}T${start}/${stamp}T${end}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("BTAUTOMAZGATAVA")}&dates=${dates}&ctz=Europe/Riga&location=${encodeURIComponent(BUSINESS.address)}`;
}

function applySavedVehicle(v: UserVehicle, lang: "lv" | "ru" | "en", patch: (p: Partial<Draft>) => void) {
  const vehicleType = v.priceCategory as VehicleId;
  patch({
    vehicleType,
    carBrand: v.brand,
    carModel: v.model,
    carBodyType: v.bodyType,
    carPriceCategory: v.priceCategory,
    carPrice: v.price,
    carPriceLabel: PRICE_CATEGORY_LABELS[v.priceCategory][lang],
    serviceDuration: SERVICE_DURATION_MINUTES,
  });
}

export function BookingWizard({ onClose, embedded }: { onClose?: () => void; embedded?: boolean }) {
  const { t, lang } = useLang();
  const { user, isPending: userPending } = useCurrentUserState();
  const { step, setStep, draft, patch, reset } = useBookingUi();
  const [done, setDone] = useState<BookingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [manualPick, setManualPick] = useState(false);

  const savedQ = useQuery({
    queryKey: ["user-vehicles"],
    enabled: Boolean(user) && !userPending,
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const res = await listUserVehicles();
        return (res.vehicles ?? []) as UserVehicle[];
      } catch {
        return [] as UserVehicle[];
      }
    },
  });

  const saved = savedQ.data ?? [];
  const showSavedPicker = saved.length > 0 && !manualPick;

  useEffect(() => {
    if (step !== 2 || draft.carBrand || !saved.length) return;
    const def = saved.find((v) => v.isDefault) ?? saved[0];
    if (def) applySavedVehicle(def, lang, patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.length, step]);

  const dates = useMemo(() => upcomingDates(14), []);
  const slotsQ = useQuery<SlotsResult>({
    queryKey: ["slots", draft.date],
    enabled: Boolean(draft.date),
    retry: 1,
    staleTime: 0,
    queryFn: async () => {
      const date = draft.date;
      if (!date) return { date: "", slots: [] };
      // No localSlots fallback: a DB failure must surface as an error, never as "all free".
      const result = await getAvailableSlots({ data: { date } });
      return result as SlotsResult;
    },
  });

  const price = draft.vehicleType ? calcPrice(draft.vehicleType, draft.extras) : 0;
  const vehicle = VEHICLES.find((v) => v.id === draft.vehicleType);

  function go(next: WizardStep) {
    setError(null);
    setStep(next);
  }

  async function submit() {
    if (!draft.vehicleType || !draft.date || !draft.time) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createBooking({
        data: {
          vehicleType: draft.vehicleType,
          serviceId: "komplekss",
          extras: draft.extras,
          date: draft.date,
          time: draft.time,
          name: draft.name,
          phone: draft.phone,
          email: draft.email,
          comment: draft.comment,
          privacy: true,
          honeypot,
          carBrand: draft.carBrand,
          carModel: draft.carModel,
          carPriceCategory: draft.carPriceCategory ?? undefined,
        },
      });
      if (!res.ok) {
        setError(
          res.error === "slot_taken"
            ? t("slotTaken")
            : res.error === "db_unavailable"
              ? t("dbUnavailableBooking")
              : res.error === "phone"
                ? t("phoneInvalid")
                : res.error === "auth"
                  ? t("bookingRequireAuth")
                  : t("errorGeneric"),
        );
        if (res.error === "slot_taken") {
          await slotsQ.refetch();
          go(6);
        }
        return;
      }
      setDone(res.booking);
      setStep(8);
      track("booking_completed", { price: res.booking.price });
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    reset();
    setDone(null);
    setManualPick(false);
    onClose?.();
  }

  function continueAfterAccount() {
    if (user) {
      patch({
        name: draft.name || user.displayName || "",
        email: draft.email || user.primaryEmail || "",
      });
    }
    go(2);
  }

  return (
    <div className={cn("flex h-full flex-col bg-bg text-fg", embedded && "min-h-[70dvh]")}>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {step}/8 · {t("navBook")}
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {STEPS.map((s) => (
              <span key={s} className={cn("h-0.5 w-6 rounded-full", s <= step ? "bg-fg" : "bg-border")} />
            ))}
          </div>
        </div>
        {onClose ? (
          <button type="button" className="size-11 rounded-md" aria-label={t("close")} onClick={onClose}>
            <X className="mx-auto size-5" />
          </button>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-3xl">{t("signInTitle")}</h2>
            <p className="text-sm text-muted">{t("stepAccountLead")}</p>
            {userPending ? (
              <p className="text-sm text-muted">…</p>
            ) : user ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("signedInAs")}</p>
                  <p className="mt-2 font-medium">{user.displayName ?? user.primaryEmail ?? "—"}</p>
                  {user.primaryEmail ? <p className="mt-1 text-sm text-muted">{user.primaryEmail}</p> : null}
                </div>
                <Button className="w-full" size="lg" onClick={continueAfterAccount}>
                  {t("continueBooking")}
                </Button>
              </div>
            ) : authEnabled ? (
              <LoginForm
                embedded
                callbackURL="/pieraksts"
                onSuccess={() => {
                  go(2);
                }}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted">{t("authDisabledHint")}</p>
                <Button className="w-full" size="lg" onClick={() => go(2)}>
                  {t("continueBooking")}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-3xl">{t("stepVehicle")}</h2>
            {showSavedPicker ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("chooseSavedVehicle")}</p>
                {saved.map((v) => {
                  const selected =
                    draft.carBrand === v.brand &&
                    draft.carModel === v.model &&
                    draft.carPriceCategory === v.priceCategory;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => applySavedVehicle(v, lang, patch)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left",
                        selected ? "border-fg bg-elevated" : "border-border",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">
                          {v.brand === "Other" ? t("otherBrand") : v.brand}{" "}
                          {v.model === "Other" ? "" : v.model}
                        </span>
                        <span className="tabular-nums">{formatEuro(v.price, lang)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {PRICE_CATEGORY_LABELS[v.priceCategory][lang]}
                        {v.isDefault ? ` · ${t("defaultVehicle")}` : ""}
                      </p>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="w-full rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted hover:border-fg hover:text-fg"
                  onClick={() => {
                    setManualPick(true);
                    patch({
                      vehicleType: null,
                      carBrand: "",
                      carModel: "",
                      carBodyType: null,
                      carPriceCategory: null,
                      carPrice: null,
                      carPriceLabel: "",
                      serviceDuration: 60,
                    });
                  }}
                >
                  {t("orOtherVehicle")}
                </button>
                <Button className="w-full" size="lg" disabled={!draft.carBrand || !draft.carModel || !draft.vehicleType} onClick={() => go(3)}>
                  {t("next")}
                </Button>
              </div>
            ) : (
              <>
                {saved.length > 0 ? (
                  <button type="button" className="text-sm text-muted underline" onClick={() => setManualPick(false)}>
                    ← {t("chooseSavedVehicle")}
                  </button>
                ) : null}
                <VehicleSelector
                  value={{
                    carBrand: draft.carBrand,
                    carModel: draft.carModel,
                    carPriceCategory: draft.carPriceCategory,
                  }}
                  onChange={(sel) =>
                    patch({
                      vehicleType: sel.vehicleType,
                      carBrand: sel.carBrand,
                      carModel: sel.carModel,
                      carBodyType: sel.carBodyType,
                      carPriceCategory: sel.carPriceCategory,
                      carPrice: sel.carPrice,
                      carPriceLabel: sel.carPriceLabel,
                      serviceDuration: sel.serviceDuration,
                    })
                  }
                />
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    !draft.carBrand ||
                    !draft.carModel ||
                    ((draft.carBrand === "Other" || draft.carModel === "Other") && !draft.carPriceCategory)
                  }
                  onClick={() => go(3)}
                >
                  {t("next")}
                </Button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-3xl">{t("stepService")}</h2>
            <article className="mt-5 rounded-xl border border-fg bg-elevated p-5">
              <h3 className="font-display text-2xl">{SERVICE.label[lang]}</h3>
              <p className="mt-2 text-sm text-muted">{SERVICE.summary[lang]}</p>
              <ul className="mt-4 space-y-2">
                {SERVICE.includes[lang].map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <Button className="mt-6 w-full" size="lg" onClick={() => go(4)}>
              {t("next")}
            </Button>
          </div>
        )}

        {step === 4 && (
          <ExtrasStep
            extras={draft.extras}
            onChange={(extras) => patch({ extras })}
            onSkip={() => {
              patch({ extras: [] });
              go(5);
            }}
            onNext={() => go(5)}
            skipLabel={t("skipExtras")}
            nextLabel={t("next")}
            title={t("stepExtras")}
          />
        )}

        {step === 5 && (
          <div>
            <h2 className="font-display text-3xl">{t("stepDate")}</h2>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dates.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    patch({ date: iso, time: "" });
                    go(6);
                  }}
                  className={cn("rounded-lg border px-3 py-4 text-left text-sm", draft.date === iso ? "border-fg bg-elevated" : "border-border")}
                >
                  {weekdayLabel(iso, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="font-display text-3xl">{t("stepTime")}</h2>
            <p className="mt-2 text-sm text-muted">{draft.date}</p>
            {slotsQ.isLoading ? (
              <div className="mt-6 grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="h-12 animate-pulse rounded-md border border-border bg-surface" />
                ))}
              </div>
            ) : slotsQ.isError ? (
              <div className="mt-6 rounded-lg border border-danger/40 bg-danger/5 p-4">
                <p className="text-sm text-danger">{t("dbUnavailable")}</p>
                <Button type="button" variant="outline" className="mt-3" onClick={() => slotsQ.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {(slotsQ.data?.slots ?? []).map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.free}
                    onClick={() => {
                      patch({ time: s.time });
                      go(7);
                    }}
                    className={cn(
                      "h-12 rounded-md border text-sm tabular-nums transition",
                      s.free ? "border-border hover:border-fg hover:bg-elevated" : "border-border opacity-30",
                      draft.time === s.time && s.free ? "border-fg bg-elevated" : "",
                    )}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
            {!slotsQ.isLoading && !slotsQ.isError && slotsQ.data?.slots.every((s) => !s.free) ? (
              <p className="mt-4 text-sm text-warn">{t("noSlots")}</p>
            ) : null}
          </div>
        )}

        {step === 7 && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim() || !draft.phone.trim() || !draft.privacy) {
                setError(t("required"));
                return;
              }
              go(8);
            }}
          >
            <h2 className="font-display text-3xl">{t("stepContact")}</h2>
            <label className="block text-sm">
              {t("name")}
              <input required value={draft.name} onChange={(e) => patch({ name: e.target.value })} className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg" autoComplete="name" />
            </label>
            <label className="block text-sm">
              {t("phone")}
              <input required type="tel" inputMode="tel" value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="26 059 326" className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg" autoComplete="tel" />
            </label>
            <label className="block text-sm">
              {t("emailOpt")}
              <input type="email" value={draft.email} onChange={(e) => patch({ email: e.target.value })} className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg" autoComplete="email" />
            </label>
            <label className="block text-sm">
              {t("comment")}
              <textarea value={draft.comment} onChange={(e) => patch({ comment: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-fg" />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={draft.privacy} onChange={(e) => patch({ privacy: e.target.checked })} className="mt-1" />
              <span>{t("privacyAgree")}</span>
            </label>
            <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" size="lg">
              {t("next")}
            </Button>
          </form>
        )}

        {step === 8 && !done && (
          <div className="space-y-4">
            <h2 className="font-display text-3xl">{t("stepConfirm")}</h2>
            <div className="rounded-xl border border-border bg-surface p-4 text-sm">
              <p>
                <span className="text-muted">{t("bookingDate")}: </span>
                {draft.date} · {draft.time}
              </p>
              <p className="mt-1">
                <span className="text-muted">{t("bookingVehicle")}: </span>
                {draft.carBrand} {draft.carModel}
              </p>
              <p className="mt-1">
                <span className="text-muted">{t("total")}: </span>
                {formatEuro(price, lang)}
              </p>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button className="w-full" size="lg" disabled={busy} onClick={submit}>
              {busy ? t("loading") : t("confirmCta")}
            </Button>
            <button type="button" className="flex items-center gap-1 text-sm text-muted" onClick={() => go(7)}>
              <ChevronLeft className="size-4" /> {t("back")}
            </button>
          </div>
        )}

        {step === 8 && done ? (
          <div className="space-y-5 text-center">
            <h2 className="font-display text-3xl">{t("successTitle")}</h2>
            <p className="text-sm text-muted">{t("successLead")}</p>
            <p className="text-lg tabular-nums">
              {done.date} · {done.time} · {formatEuro(done.price, lang)}
            </p>
            <div className="flex flex-col gap-2">
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border border-border text-sm"
                href={googleCalUrl(done)}
                target="_blank"
                rel="noreferrer"
              >
                {t("addCalendar")}
              </a>
              <Button variant="secondary" onClick={finish}>
                {t("newBooking")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {step < 8 && step > 1 ? (
        <div className="border-t border-line px-4 py-3">
          <button type="button" className="flex items-center gap-1 text-sm text-muted" onClick={() => go((step - 1) as WizardStep)}>
            <ChevronLeft className="size-4" /> {t("back")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
