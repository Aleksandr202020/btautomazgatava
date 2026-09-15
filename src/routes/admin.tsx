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
import { adminResetUserPassword } from "@/lib/auth/admin-password";
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
  const [tab, setTab] = useState<"dashboard" | "list" | "create" | "users">("dashboard");
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
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="font-display text-3xl">{t("admin")}</h1>
        <p className="mt-2 text-sm text-muted">{t("adminHint")}</p>
        <form className="mt-8 space-y-4" onSubmit={login}>
          <label className="block text-sm">
            {t("adminPin")}
            <input
              type="password"
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("admin")}</p>
          <h1 className="font-display text-2xl">{t("dashboard")}</h1>
        </div>
        <Button variant="secondary" size="md" onClick={logout}>
          {t("adminLogout")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["dashboard", t("dashboard")],
            ["list", t("adminBookings")],
            ["create", t("adminCreate")],
            ["users", t("adminUsers")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              tab === id ? "bg-accent text-white" : "border border-border text-fg hover:bg-elevated",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <section className="space-y-4">
          {dashQ.isLoading ? (
            <p className="text-sm text-muted">…</p>
          ) : !dash ? (
            <p className="text-sm text-danger">{t("errorGeneric")}</p>
          ) : (
            <>
              {"dbOk" in dash && dash.dbOk === false ? (
                <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
                  DATABASE_URL nav iestatīts Vercel. Pieraksti netiek saglabāti. Pievienojiete Neon Postgres.
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={t("adminBookings")} value={String(dash.count ?? 0)} />
                <Stat label={t("adminRevenue")} value={formatEuro(dash.revenue ?? 0, lang)} />
                <Stat label={t("adminFree")} value={String(dash.free ?? 0)} />
                <Stat label={t("adminToday")} value={String(dash.today ?? "")} />
              </div>

              {dash.next ? (
                <div className="rounded-xl border border-fg bg-elevated p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("nextBooking")}</p>
                  <p className="mt-1 font-display text-xl">
                    {dash.next.time} · {dash.next.name}
                  </p>
                  <p className="mt-1 text-sm">
                    {dash.next.phone ? (
                      <a className="text-fg underline-offset-2 hover:underline" href={`tel:${dash.next.phone}`}>{dash.next.phone}</a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                    {dash.next.email ? (
                      <>
                        {" · "}
                        <a className="text-muted underline-offset-2 hover:underline" href={`mailto:${dash.next.email}`}>{dash.next.email}</a>
                      </>
                    ) : null}
                    {" · "}
                    {formatEuro(dash.next.price, lang)}
                  </p>
                </div>
              ) : null}

              <div>
                <h2 className="text-sm font-medium">{t("adminToday")}</h2>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-border">
                  {(dash.timeline ?? []).map((slot) => (
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
                          <p className="truncate font-medium">{slot.booking.name}</p>
                          <p className="truncate text-xs text-muted">
                            {slot.booking.phone ? (
                              <a className="hover:underline" href={`tel:${slot.booking.phone}`}>{slot.booking.phone}</a>
                            ) : "—"}
                            {slot.booking.email ? (
                              <>
                                {" · "}
                                <a className="hover:underline" href={`mailto:${slot.booking.email}`}>{slot.booking.email}</a>
                              </>
                            ) : null}
                            {" · "}
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
        <section className="space-y-4">
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
                  "rounded-lg px-3 py-1.5 text-sm",
                  range === id ? "bg-black text-white" : "border border-border",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder={t("search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="space-y-2">
            {bookings.map((b) => (
              <BookingRow key={b.id} b={b} lang={lang} t={t} onStatus={(status) => statusMut.mutate({ id: b.id, status })} />
            ))}
            {!bookings.length ? <p className="text-sm text-muted">—</p> : null}
          </ul>
        </section>
      )}

      {tab === "users" && <ResetPasswordForm pin={pin} t={t} />}

      {tab === "create" && (
        <CreateForm
          pin={pin}
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

function BookingRow({
  b,
  lang,
  t,
  onStatus,
}: {
  b: BookingPublic;
  lang: string;
  t: (k: never) => string;
  onStatus: (s: Status) => void;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {b.date} · {b.time}
          </p>
          <p className="text-sm font-medium text-fg">{b.name || "—"}</p>
          <p className="text-sm text-muted">
            {b.phone ? (
              <a className="hover:underline" href={`tel:${b.phone}`}>{b.phone}</a>
            ) : (
              <span>—</span>
            )}
            {b.email ? (
              <>
                {" · "}
                <a className="hover:underline" href={`mailto:${b.email}`}>{b.email}</a>
              </>
            ) : null}
          </p>
          <p className="text-xs text-muted">
            {VEHICLES.find((v) => v.id === b.vehicleType)?.label[lang as "lv" | "ru" | "en"] ?? b.vehicleType} ·{" "}
            {formatEuro(b.price, lang)}
          </p>
          {b.comment ? <p className="mt-1 text-xs text-muted">{b.comment}</p> : null}
        </div>
        <select
          className="rounded-md border border-border px-2 py-1 text-xs"
          value={b.status}
          onChange={(e) => onStatus(e.target.value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(t, s)}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}

function ResetPasswordForm({ pin, t }: { pin: string; t: (k: never) => string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (password !== password2) {
      setErr(t("passwordMismatch" as never));
      return;
    }
    if (password.length < 8) {
      setErr(t("passwordTooShort" as never));
      return;
    }
    setBusy(true);
    try {
      const res = await adminResetUserPassword({
        data: { pin, email: email.trim(), newPassword: password },
      });
      if (!res.ok) {
        setErr(
          res.error === "not_found"
            ? t("adminUserNotFound" as never)
            : t("errorGeneric" as never),
        );
        return;
      }
      setOk(true);
      setPassword("");
      setPassword2("");
    } catch {
      setErr(t("errorGeneric" as never));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4 rounded-xl border border-border p-4" onSubmit={submit}>
      <h2 className="font-display text-xl">{t("adminResetPassword" as never)}</h2>
      <p className="text-sm text-muted">{t("adminResetPasswordHint" as never)}</p>
      <label className="block text-sm">
        {t("email" as never)}
        <input
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="block text-sm">
        {t("adminNewPassword" as never)}
        <input
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <label className="block text-sm">
        {t("adminNewPassword2" as never)}
        <input
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      {ok ? <p className="text-sm text-ok">{t("adminResetPasswordOk" as never)}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "…" : t("adminResetPassword" as never)}
      </Button>
    </form>
  );
}

function CreateForm({
  pin,
  t,
  onDone,
}: {
  pin: string;
  t: (k: never) => string;
  onDone: () => void;
}) {
  const [date, setDate] = useState(rigaDate());
  const [time, setTime] = useState("10:00");
  const [vehicleType, setVehicleType] = useState<VehicleId>("car");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const slots = useMemo(() => generateSlots(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await adminCreateBooking({
        data: { pin, vehicleType, extras: [] as ExtraId[], date, time, name, phone },
      });
      if (!res.ok) {
        setErr(res.error === "slot_taken" ? t("slotTaken" as never) : t("errorGeneric" as never));
        return;
      }
      onDone();
    } catch {
      setErr(t("errorGeneric" as never));
    }
  }

  return (
    <form className="space-y-4 rounded-xl border border-border p-4" onSubmit={submit}>
      <label className="block text-sm">
        {t("stepDate" as never)}
        <input type="date" className="mt-1 w-full rounded-lg border border-border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="block text-sm">
        {t("stepTime" as never)}
        <select className="mt-1 w-full rounded-lg border border-border px-3 py-2" value={time} onChange={(e) => setTime(e.target.value)}>
          {slots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {t("vehicle" as never)}
        <select className="mt-1 w-full rounded-lg border border-border px-3 py-2" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleId)}>
          {VEHICLES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label.lv}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {t("name" as never)}
        <input className="mt-1 w-full rounded-lg border border-border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="block text-sm">
        {t("phone" as never)}
        <input className="mt-1 w-full rounded-lg border border-border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </label>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      <Button type="submit" className="w-full" size="lg">
        {t("save" as never)}
      </Button>
    </form>
  );
}
