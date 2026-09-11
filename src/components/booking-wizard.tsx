import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Armchair,
  Check,
  ChevronLeft,
  CircleDot,
  CloudRain,
  Disc,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createBooking, getAvailableSlots, type BookingPublic } from "@/lib/booking";
import { useBookingUi, type WizardStep } from "@/lib/booking-ui";
import { BUSINESS, calcPrice, EXTRAS, SERVICE, VEHICLES, type ExtraId } from "@/lib/catalog";
import { VehicleSelector } from "@/components/booking/VehicleSelector";
import { useLang } from "@/lib/lang";
import { upcomingDates } from "@/lib/slots";
import { cn, formatEuro, track } from "@/lib/utils";

const STEPS: WizardStep[] = [1, 2, 3, 4, 5, 6, 7];

const EXTRA_ICONS: Record<ExtraId, JSX.Element> = {
  fragrance: <Sparkles className="size-6" />,
  tyres: <CircleDot className="size-6" />,
  leather: <Armchair className="size-6" />,
  antirain: <CloudRain className="size-6" />,
  discs: <Disc className="size-6" />,
  engine: <Wrench className="size-6" />,
};

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
