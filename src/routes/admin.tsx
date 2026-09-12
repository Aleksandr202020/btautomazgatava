import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adminCreateBooking,
  adminDashboard,
  adminListBookings,
  adminSetStatus,
  type BookingPublic,
} from "@/lib/booking";
import { VEHICLES, type ExtraId, type VehicleId } from "@/lib/catalog";
import { useLang } from "@/lib/lang";
import { cn, formatEuro, rigaDate } from "@/lib/utils";
import { generateSlots } from "@/lib/slots";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const PIN_KEY = "bta-admin-pin";

type Status = "new" | "confirmed" | "completed" | "cancelled" | "no-show";

const STATUSES: Status[] = ["new", "confirmed", "completed", "cancelled", "no-show"];

function statusLabel(t: (k: never) => string, s: string) {
  const map: Record<string, string> = {
    new: t("stNew" as never),
    confirmed: t("stConfirmed" as never),
    completed: t("stCompleted" as never),
    cancelled: t("stCancelled" as never),
    "no-show": t("stNoshow" as never),
  };
  return map[s] ?? s;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + n));
  return dt.toISOString().slice(0, 10);
}

function loadPin(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(PIN_KEY) ?? "";
}

function AdminPage() {
  const { t, lang } = useLang();
  const [pin, setPin] = useState(loadPin);
  const [pinInput, setPinInput] = useState("");
  const [tab, setTab] = useState<"dashboard" | "list" | "create">("dashboard");
  const [range, setRange] = useState<"today" | "tomorrow" | "week">("today");
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const today = useMemo(() => rigaDate(), []);
  const fromTo = useMemo(() => {
    if (range === "today") return { from: today, to: today };
    if (range === "tomorrow") {
      const tom = addDays(today, 1);
      return { from: tom, to: tom };
    }
    return { from: today, to: addDays(today, 6) };
  }, [range, today]);

  const dashQ = useQuery({
    queryKey: ["admin-dash", pin],
    queryFn: () => adminDashboard({ data: { pin } }),
    enabled: Boolean(pin),
    refetchInterval: 60_000,
  });

  const listQ = useQuery({
    queryKey: ["admin-list", pin, fromTo.from, fromTo.to, q],
    queryFn: () =>
      adminListBookings({
        data: { pin, from: fromTo.from, to: fromTo.to, q },
      }),
    enabled: Boolean(pin) && tab === "list",
  });

  const statusMut = useMutation({
    mutationFn: (p: { id: number; status: Status }) =>
      adminSetStatus({ data: { pin, id: p.id, status: p.status } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-dash"] });
      void qc.invalidateQueries({ queryKey: ["admin-list"] });
    },
  });

  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const v = pinInput.trim();
    if (!v) return;
    setLoginBusy(true);
    setLoginErr(null);
    try {
      const res = await adminDashboard({ data: { pin: v } });
      if (!res.ok) {
        setLoginErr(t("errorGeneric" as never));
        return;
      }
      window.sessionStorage.setItem(PIN_KEY, v);
      setPin(v);
    } catch {
      setLoginErr(t("errorGeneric" as never));
    } finally {
      setLoginBusy(false);
    }
  }

  function logout() {
    window.sessionStorage.removeItem(PIN_KEY);
    setPin("");
    setPinInput("");
  }

  if (!pin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <h1 className="font-display text-3xl">{t("admin")}</h1>
        <p className="mt-2 text-sm text-muted">{t("adminHint")}</p>
        <form className="mt-8 space-y-4" onSubmit={login}>
          <label className="block text-sm">
            {t("adminPin")}
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="mt-1 h-12 w-full rounded-md border border-border bg-surface px-3 text-fg"
              autoFocus
            />
          </label>
          {loginErr ? <p className="text-sm text-danger">{loginErr}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={loginBusy}>
            {t("adminEnter")}
          </Button>
        </form>
      </div>
    );
  }

  const dash = dashQ.data?.ok ? dashQ.data : null;
  const bookings = listQ.data?.ok ? listQ.data.bookings : [];

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("admin")}</p>
          <h1 className="font-display text-2xl">{t("dashboard")}</h1>
        </div>
        <Button variant="secondary" size="md" onClick={logout}>
          {t("adminLogout")}
        </Button>
      </header>

      <nav className="mt-4 flex gap-2 overflow-x-auto text-sm">
        {(
          [
            ["dashboard", t("dashboard")],
            ["list", t("adminBookings")],
            ["create", t("adminCreate")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2",
              tab === id ? "border-fg bg-elevated" : "border-border text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <section className="mt-6 space-y-5">
          {dashQ.isLoading ? (
            <p className="text-sm text-muted">…</p>
          ) : !dash ? (
            <p className="text-sm text-danger">{t("errorGeneric")}</p>
          ) : (
            <>
              {"dbOk" in dash && dash.dbOk === false ? (
                <p className="rounded-lg border border-warn/40 bg-elevated px-3 py-2 text-sm text-warn">
                  DATABASE_URL nav iestatīts Vercel. Pieraksti netiek saglabāti. Pievienojiet Neon Postgres.
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={t("adminBookings")} value={String(dash.count)} />
                <Stat label={t("adminRevenue")} value={formatEuro(dash.revenue, lang)} />
                <Stat label={t("adminFree")} value={String(dash.free)} />
                <Stat label={t("adminToday")} value={dash.today} />
              </div>

              {dash.next ? (
                <div className="rounded-xl border border-fg bg-elevated p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("nextBooking")}</p>
                  <p className="mt-1 font-display text-xl">
                    {dash.next.time} · {dash.next.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {dash.next.phone} · {formatEuro(dash.next.price, lang)}
                  </p>
                </div>
              ) : null}

              <div>
                <h2 className="text-sm font-medium">{t("adminToday")}</h2>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-border">
                  {dash.timeline.map((slot) => (
                    <li
                      key={slot.time}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm",
                        slot.past && "opacity-50",
                      )}
                    >
                      <span className="w-12 tabular-nums text-muted">{slot.time}</span>
                      {slot.booking ? (
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {slot.booking.name} · {slot.booking.phone}
                          </p>
                          <p className="text-xs text-muted">
                            {statusLabel(t, slot.booking.status)} · {formatEuro(slot.booking.price, lang)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted">{t("free")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "list" && (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["today", t("adminToday")],
                ["tomorrow", t("adminTomorrow")],
                ["week", t("adminWeek")],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRange(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  range === id ? "border-fg bg-elevated" : "border-border text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />
          {listQ.isLoading ? (
            <p className="text-sm text-muted">…</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  b={b}
                  lang={lang}
                  t={t}
                  onStatus={(status) => statusMut.mutate({ id: b.id, status })}
                  busy={statusMut.isPending}
                />
              ))}
              {!bookings.length ? <p className="text-sm text-muted">—</p> : null}
            </ul>
          )}
        </section>
      )}

      {tab === "create" && (
        <CreateForm
          pin={pin}
          lang={lang}
          t={t}
          onDone={() => {
            setTab("list");
            void qc.invalidateQueries({ queryKey: ["admin-list"] });
            void qc.invalidateQueries({ queryKey: ["admin-dash"] });
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl tabular-nums">{value}</p>
    </div>
  );
}

function BookingCard({
  b,
  lang,
  t,
  onStatus,
  busy,
}: {
  b: BookingPublic;
  lang: string;
  t: (k: never) => string;
  onStatus: (s: Status) => void;
  busy: boolean;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">
          {b.date} · {b.time}
        </p>
        <p className="tabular-nums">{formatEuro(b.price, lang)}</p>
      </div>
      <p className="mt-1">
        {b.name} · {b.phone}
      </p>
      <p className="mt-1 text-xs text-muted">
        {VEHICLES.find((v) => v.id === b.vehicleType)?.label[lang as "lv" | "ru" | "en"] ?? b.vehicleType}
        {b.comment ? ` · ${b.comment}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || b.status === s}
            onClick={() => onStatus(s)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs",
              b.status === s ? "border-fg bg-elevated font-medium" : "border-border text-muted",
            )}
          >
            {statusLabel(t, s)}
          </button>
        ))}
      </div>
    </li>
  );
}

function CreateForm({
  pin,
  lang,
  t,
  onDone,
}: {
  pin: string;
  lang: string;
  t: (k: never) => string;
  onDone: () => void;
}) {
  const [date, setDate] = useState(rigaDate());
  const [time, setTime] = useState("10:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleId>("car");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slots = useMemo(() => generateSlots(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await adminCreateBooking({
        data: {
          pin,
          date,
          time,
          name,
          phone,
          vehicleType,
          extras: [] as ExtraId[],
        },
      });
      if (!res.ok) {
        setErr(res.error === "slot_taken" ? t("slotTaken" as never) : t("errorGeneric" as never));
        return;
      }
      setName("");
      setPhone("");
      onDone();
    } catch {
      setErr(t("errorGeneric" as never));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <label className="block text-sm">
        {t("stepDate" as never)}
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3"
        />
      </label>
      <label className="block text-sm">
        {t("stepTime" as never)}
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3"
        >
          {slots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {t("vehicle" as never)}
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value as VehicleId)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3"
        >
          {VEHICLES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label[lang as "lv" | "ru" | "en"]} · {formatEuro(v.price, lang)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {t("name" as never)}
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3"
        />
      </label>
      <label className="block text-sm">
        {t("phone" as never)}
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="26 059 326"
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3"
        />
      </label>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {t("save" as never)}
      </Button>
    </form>
  );
}
