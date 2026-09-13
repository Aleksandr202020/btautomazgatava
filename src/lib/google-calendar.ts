/**
 * Google Calendar API (service account).
 *
 * Env (server only, never VITE_*):
 *   GOOGLE_CALENDAR_ID              — calendar id (or the calendar email)
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL    — service account client_email
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY — PKCS8 PEM (use \n for newlines in env)
 *
 * Share the target calendar with the service account email
 * (permission: "Make changes to events").
 *
 * If any env is missing, helpers no-op and return null.
 */
import { importPKCS8, SignJWT } from "jose";
import { BUSINESS } from "./catalog";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";

type BookingLike = {
  id?: string | number;
  date: string;
  time: string;
  name?: string;
  phone?: string;
  email?: string | null;
  vehicleType?: string;
  price?: number;
  comment?: string | null;
  extras?: string[];
};

function env() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (privateKey?.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  if (!calendarId || !clientEmail || !privateKey) return null;
  return { calendarId, clientEmail, privateKey };
}

export function isGoogleCalendarConfigured(): boolean {
  return env() !== null;
}

let cachedToken: { accessToken: string; exp: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const cfg = env();
  if (!cfg) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) {
    return cachedToken.accessToken;
  }
  try {
    const key = await importPKCS8(cfg.privateKey, "RS256");
    const assertion = await new SignJWT({ scope: SCOPE })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(cfg.clientEmail)
      .setSubject(cfg.clientEmail)
      .setAudience(TOKEN_URL)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(key);

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      console.error("google-calendar token", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cachedToken = {
      accessToken: json.access_token,
      exp: now + (json.expires_in ?? 3600),
    };
    return cachedToken.accessToken;
  } catch (err) {
    console.error("google-calendar token error", err);
    return null;
  }
}

function rigaDateTime(date: string, time: string, addMinutes = 0): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + addMinutes;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${date}T${hh}:${mm}:00`;
}

function eventBody(b: BookingLike, durationMinutes = 60) {
  const summary = `${BUSINESS.name}: ${b.name ?? "Booking"}`;
  const lines = [
    b.phone ? `Phone: ${b.phone}` : "",
    b.email ? `Email: ${b.email}` : "",
    b.vehicleType ? `Vehicle: ${b.vehicleType}` : "",
    b.price != null ? `Price: ${b.price} €` : "",
    b.comment ? `Note: ${b.comment}` : "",
    b.id != null ? `Booking #${b.id}` : "",
  ].filter(Boolean);
  return {
    summary,
    description: lines.join("\n"),
    location: BUSINESS.address,
    start: {
      dateTime: rigaDateTime(b.date, b.time),
      timeZone: "Europe/Riga",
    },
    end: {
      dateTime: rigaDateTime(b.date, b.time, durationMinutes),
      timeZone: "Europe/Riga",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 15 },
      ],
    },
  };
}

/** Create a calendar event. Returns Google event id or null. Never throws. */
export async function createCalendarEvent(b: BookingLike, durationMinutes = 60): Promise<string | null> {
  const cfg = env();
  if (!cfg) return null;
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const url = `${API}/calendars/${encodeURIComponent(cfg.calendarId)}/events`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody(b, durationMinutes)),
    });
    if (!res.ok) {
      console.error("google-calendar create", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { id?: string };
    return json.id ?? null;
  } catch (err) {
    console.error("google-calendar create error", err);
    return null;
  }
}

/** Fire-and-forget helper for booking handlers. */
export function syncBookingToGoogleCalendar(b: BookingLike, durationMinutes = 60): void {
  if (!isGoogleCalendarConfigured()) return;
  void createCalendarEvent(b, durationMinutes).then((id) => {
    if (id) console.info("google-calendar event created", id, b.date, b.time);
  });
}
