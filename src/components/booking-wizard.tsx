import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createBooking, getAvailableSlots, type BookingPublic } from "@/lib/booking";
import { useBookingUi, type WizardStep } from "@/lib/booking-ui";
import { BUSINESS, calcPrice, EXTRAS, SERVICE, VEHICLES, type ExtraId } from "@/lib/catalog";
import { useLang } from "@/lib/lang";
import { upcomingDates } from "@/lib/slots";
import { cn, formatEuro, track } from "@/lib/utils";

const STEPS: WizardStep[] = [1, 2, 3, 4, 5, 6, 7];

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
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BTAUTOMAZGATAVA//booking//LV
BEGIN:VEVENT
DTSTART;TZID=Europe/Riga:${stamp}T${start}
DTEND;TZID=Europe/Riga:${stamp}T${end}
SUMMARY:BTAUTOMAZGATAVA
LOCATION:${BUSINESS.address}
DESCRIPTION:Hand car wash booking
END:VEVENT
END:VCALENDAR`;
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

export function BookingWizard({ onClose, embedded }: { onClose?: () => void; embedded?: boolean }) {
  const { t, lang } = useLang();
  const { step, setStep, draft, patch, reset } = useBookingUi();
  const [done, setDone] = useState<BookingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const dates = useMemo(() => upcomingDates(14), []);
  const slotsQ = useQuery({
    queryKey: ["slots", draft.date],
    queryFn: () => getAvailableSlots({ data: { date: draft.date } }),
    enabled: Boolean(draft.date),
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
        },
      });
      if (!res.ok) {
        setError(res.error === "slot_taken" ? t("slotTaken") : res.error === "phone" ? t("phoneInvalid") : t("errorGeneric"));
        if (res.error === "slot_taken") go(5);
        return;
      }
      setDone(res.booking);
      setStep(7);
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
    onClose?.();
  }

  return (
    <div className={cn("flex h-full flex-col bg-bg text-fg", embedded && "min-h-[70dvh]")}>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {step}/7 · {t("navBook")}
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
          <div className="space-y-3">
            <h2 className="font-display text-3xl">{t("stepVehicle")}</h2>
            {VEHICLES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  patch({ vehicleType: v.id });
                  go(2);
                }}
                className={cn(
                  "w-full rounded-xl border p-5 text-left transition-colors",
                  draft.vehicleType === v.id ? "border-fg bg-elevated" : "border-border hover:border-fg/40",
                )}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-2xl">{v.label[lang]}</span>
                  <span className="tabular-nums">{formatEuro(v.price, lang)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{v.hint[lang]}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
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
            <Button className="mt-6 w-full" size="lg" onClick={() => go(3)}>
              {t("next")}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-3xl">{t("stepExtras")}</h2>
            <div className="mt-5 space-y-2">
              {EXTRAS.map((e) => {
                const on = draft.extras.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      const extras: ExtraId[] = on
                        ? draft.extras.filter((id) => id !== e.id)
                        : [...draft.extras, e.id];
                      patch({ extras });
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left",
                      on ? "border-fg bg-elevated" : "border-border",
                    )}
                  >
                    <span className="text-sm">{e.label[lang]}</span>
                    <span className="tabular-nums text-sm text-muted">+{formatEuro(e.price, lang)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => { patch({ extras: [] }); go(4); }}>
                {t("skipExtras")}
              </Button>
              <Button onClick={() => go(4)}>{t("next")}</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-3xl">{t("stepDate")}</h2>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dates.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    patch({ date: iso, time: "" });
                    go(5);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-4 text-left text-sm",
                    draft.date === iso ? "border-fg bg-elevated" : "border-border",
                  )}
                >
                  {weekdayLabel(iso, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-display text-3xl">{t("stepTime")}</h2>
            {slotsQ.isLoading ? (
              <p className="mt-6 text-sm text-muted">…</p>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {(slotsQ.data?.slots ?? []).map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.free}
                    onClick={() => {
                      patch({ time: s.time });
                      go(6);
                    }}
                    className={cn(
                      "h-12 rounded-md border text-sm tabular-nums disabled:opacity-30",
                      draft.time === s.time ? "border-fg bg-elevated" : "border-border",
                    )}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
            {slotsQ.data && slotsQ.data.slots.every((s) => !s.free) ? (
              <p className="mt-4 text-sm text-warn">{t("noSlots")}</p>
            ) : null}
          </div>
        )}

        {step === 6 && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim() || !draft.phone.trim() || !draft.privacy) {
                setError(t("required"));
                return;
              }
              go(7);
            }}
          >
            <h2 className="font-display text-3xl">{t("stepContact")}</h2>
            <label className="block text-sm">
              {t("name")}
              <input
                required
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg"
                autoComplete="name"
              />
            </label>
            <label className="block text-sm">
              {t("phone")}
              <input
                required
                type="tel"
                inputMode="tel"
                value={draft.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="26 059 326"
                className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg"
                autoComplete="tel"
              />
            </label>
            <label className="block text-sm">
              {t("emailOpt")}
              <input
                type="email"
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
                className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg"
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              {t("comment")}
              <textarea
                value={draft.comment}
                onChange={(e) => patch({ comment: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-fg"
              />
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.privacy}
                onChange={(e) => patch({ privacy: e.target.checked })}
                className="mt-1 size-4"
                required
              />
              <span>
                {t("privacyAgree")}{" "}
                <Link to="/privatuma-politika" className="underline" onClick={onClose}>
                  {t("privacy")}
                </Link>
              </span>
            </label>
            <div className="absolute left-[-9999px]" aria-hidden>
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg">
              {t("next")}
            </Button>
          </form>
        )}

        {step === 7 && !done && (
          <div>
            <h2 className="font-display text-3xl">{t("yourOrder")}</h2>
            <dl className="mt-5 space-y-3 rounded-xl border border-border bg-surface p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("stepVehicle")}</dt>
                <dd>{vehicle?.label[lang]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("stepService")}</dt>
                <dd>{SERVICE.label[lang]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("stepDate")}</dt>
                <dd>
                  {draft.date} · {draft.time}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("stepExtras")}</dt>
                <dd className="text-right">
                  {draft.extras.length
                    ? draft.extras.map((id) => EXTRAS.find((e) => e.id === id)?.label[lang]).join(", ")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
                <dt>{t("total")}</dt>
                <dd className="tabular-nums">{formatEuro(price, lang)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">{t("payNote")}</p>
            <Button className="mt-6 w-full" size="xl" disabled={busy} onClick={submit}>
              {t("confirmCta")}
            </Button>
          </div>
        )}

        {done && (
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-ok text-ok">
              <Check />
            </div>
            <h2 className="mt-5 font-display text-3xl">{t("successTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("successLead")}</p>
            <p className="mt-6 text-lg tabular-nums">
              {done.date} · {done.time}
            </p>
            <p className="mt-1 text-muted">
              {vehicle?.label[lang]} · {formatEuro(done.price, lang)}
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <a
                className="inline-flex h-11 items-center justify-center rounded-md border border-border text-sm"
                href={googleCalUrl(done)}
                target="_blank"
                rel="noreferrer"
              >
                {t("googleCal")}
              </a>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border text-sm"
                onClick={() => {
                  const blob = new Blob([icsContent(done)], { type: "text/calendar" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "btautomazgatava.ics";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                {t("addCalendar")}
              </button>
              <Button className="mt-2" onClick={finish}>
                {t("close")}
              </Button>
            </div>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      </div>

      {step > 1 && step < 7 && (
        <div className="border-t border-line px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted">{t("total")}</span>
            <span className="tabular-nums">{formatEuro(price, lang)}</span>
          </div>
          <button type="button" className="inline-flex items-center gap-1 text-sm text-muted" onClick={() => go((step - 1) as WizardStep)}>
            <ChevronLeft className="size-4" />
            {t("back")}
          </button>
        </div>
      )}
    </div>
  );
}

export function BookingOverlay() {
  const open = useBookingUi((s) => s.open);
  const closeWizard = useBookingUi((s) => s.closeWizard);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-lg flex-col bg-bg shadow-2xl md:h-[min(92dvh,840px)] md:mt-[4dvh] md:rounded-xl md:border md:border-border">
        <BookingWizard onClose={closeWizard} />
      </div>
    </div>
  );
}

export function CookieBanner() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(!window.localStorage.getItem("bta-cookie"));
  }, []);
  if (!visible) return null;
  function choose(v: "all" | "essential") {
    window.localStorage.setItem("bta-cookie", v);
    setVisible(false);
  }
  return (
    <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-xl px-3 md:bottom-6">
      <div className="rounded-xl border border-border bg-elevated p-4 shadow-lg">
        <p className="text-sm text-muted">{t("cookieBody")}</p>
        <div className="mt-3 flex gap-2">
          <Button size="md" onClick={() => choose("all")}>
            {t("cookieAccept")}
          </Button>
          <Button variant="secondary" onClick={() => choose("essential")}>
            {t("cookieReject")}
          </Button>
        </div>
      </div>
    </div>
  );
}
