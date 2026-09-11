import { Link } from "@tanstack/react-router";
import { Check, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { BeforeAfter } from "@/components/before-after";
import { Button } from "@/components/ui/button";
import { BUSINESS, EXTRAS, FAQ, GALLERY, REVIEWS, SERVICE, VEHICLES } from "@/lib/catalog";
import { useBookingUi } from "@/lib/booking-ui";
import { useLang } from "@/lib/lang";
import { formatEuro, track } from "@/lib/utils";

export function Hero() {
  const { t } = useLang();
  const openWizard = useBookingUi((s) => s.openWizard);
  return (
    <section className="relative isolate flex min-h-[88dvh] items-end overflow-hidden md:min-h-[92dvh]">
      <img
        src="/images/hero.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/25" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 md:pb-24">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">{t("heroKicker")}</p>
        <h1 className="mt-4 max-w-3xl whitespace-pre-line font-display text-5xl text-fg md:text-7xl">{t("heroTitle")}</h1>
        <p className="mt-5 max-w-xl text-base text-fg/80 md:text-lg">{t("heroLead")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="xl" onClick={openWizard}>
            {t("bookCta")}
          </Button>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="inline-flex h-12 items-center justify-center rounded-md border border-fg/25 px-6 text-sm uppercase tracking-[0.12em] text-fg"
            onClick={() => track("phone_clicked", { place: "hero" })}
          >
            {t("callCta")}
          </a>
        </div>
      </div>
    </section>
  );
}

export function TrustBar() {
  const { t } = useLang();
  const items = [t("trustHand"), t("trustChem"), t("trustAppt"), t("trustHours"), t("trustCity")];
  return (
    <div className="border-y border-line bg-surface">
      <ul className="mx-auto flex max-w-6xl snap-x gap-6 overflow-x-auto px-4 py-4 md:justify-between">
        {items.map((item) => (
          <li key={item} className="flex shrink-0 snap-start items-center gap-2 text-sm text-muted">
            <Check className="size-4 text-accent" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServicesSection() {
  const { t, lang } = useLang();
  const openWizard = useBookingUi((s) => s.openWizard);
  return (
    <section id="pakalpojumi" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{t("navServices")}</p>
      <h2 className="mt-3 text-4xl md:text-5xl">{t("servicesTitle")}</h2>
      <p className="mt-3 max-w-xl text-muted">{t("servicesLead")}</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {VEHICLES.map((v) => (
          <article key={v.id} className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <h3 className="font-display text-3xl">{v.label[lang]}</h3>
            <p className="mt-2 text-sm text-muted">{v.hint[lang]}</p>
            <p className="mt-6 font-display text-5xl tabular-nums">{formatEuro(v.price, lang)}</p>
            <p className="mt-2 text-sm text-muted">{SERVICE.label[lang]}</p>
            <Button className="mt-6" onClick={openWizard}>
              {t("bookCta")}
            </Button>
          </article>
        ))}
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-elevated p-6 md:p-8">
          <h3 className="font-display text-2xl">{lang === "ru" ? "Внешняя мойка" : lang === "en" ? "Exterior wash" : "Ārējā mazgāšana"}</h3>
          <ul className="mt-5 grid gap-3">
            {SERVICE.exterior[lang].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-fg/90">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-elevated p-6 md:p-8">
          <h3 className="font-display text-2xl">{lang === "ru" ? "Очистка салона" : lang === "en" ? "Interior clean" : "Salona tīrīšana"}</h3>
          <ul className="mt-5 grid gap-3">
            {SERVICE.interior[lang].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-fg/90">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted">{t("waxNote")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Professional chemistry</p>
          <p className="mt-2 font-display text-2xl">{BUSINESS.chemistry}</p>
          <p className="mt-2 text-sm text-muted">
            {lang === "ru"
              ? "В процессе работы используется профессиональная итальянская автохимия DAERG CHIMICA."
              : lang === "en"
                ? "Professional Italian car chemistry DAERG CHIMICA is used in the process."
                : "Darbā izmantojam profesionālo itāļu autoķīmiju DAERG CHIMICA."}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Professional equipment</p>
          <p className="mt-2 font-display text-2xl">{BUSINESS.equipment}</p>
          <p className="mt-2 text-sm text-muted">
            {lang === "ru"
              ? "Для мойки используется профессиональное оборудование Kärcher."
              : lang === "en"
                ? "Professional Kärcher equipment is used for washing."
                : "Mazgāšanai izmantojam profesionālo aprīkojumu Kärcher."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PricesSection() {
  const { t, lang } = useLang();
  return (
    <section id="cenas" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">{t("navPrices")}</p>
        <h2 className="mt-3 text-4xl md:text-5xl">{t("pricesTitle")}</h2>
        <p className="mt-3 max-w-xl text-muted">{t("pricesLead")}</p>
        <div className="mt-10 overflow-hidden rounded-xl border border-border">
          {VEHICLES.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0">
              <span>{v.label[lang]}</span>
              <span className="tabular-nums text-lg">{formatEuro(v.price, lang)}</span>
            </div>
          ))}
        </div>
        <h3 className="mt-12 font-display text-2xl">{t("extrasTitle")}</h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {EXTRAS.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-bg px-4 py-3">
              <span className="text-sm">{e.label[lang]}</span>
              <span className="tabular-nums text-sm text-muted">+{formatEuro(e.price, lang)}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">{t("payNote")}</p>
      </div>
    </section>
  );
}

export function AdvantagesSection() {
  const { t } = useLang();
  const items = [
    { t: t("adv1t"), d: t("adv1d") },
    { t: t("adv2t"), d: t("adv2d") },
    { t: t("adv3t"), d: t("adv3d") },
    { t: t("adv4t"), d: t("adv4d") },
    { t: t("adv5t"), d: t("adv5d") },
    { t: t("adv6t"), d: t("adv6d") },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-4xl md:text-5xl">{t("advantagesTitle")}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.t} className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-display text-2xl">{item.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GallerySection() {
  const { t } = useLang();
  const [filter, setFilter] = useState<"all" | "exterior" | "interior" | "detailing">("all");
  const items = GALLERY.filter((g) => filter === "all" || g.cat === filter);
  return (
    <section id="galerija" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-4xl md:text-5xl">{t("galleryTitle")}</h2>
        <p className="mt-3 text-muted">{t("galleryLead")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["all", t("navGallery")],
              ["exterior", t("catExterior")],
              ["interior", t("catInterior")],
              ["detailing", t("catDetail")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] ${
                filter === id ? "border-fg bg-fg text-bg" : "border-border text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-10">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">{t("catBeforeAfter")}</p>
          <BeforeAfter />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((g) => (
            <figure key={g.src} className="overflow-hidden rounded-lg border border-border">
              <img src={g.src} alt={g.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReviewsSection() {
  const { t, lang } = useLang();
  return (
    <section id="atsauksmes" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-4xl md:text-5xl">{t("reviewsTitle")}</h2>
      <p className="mt-3 text-muted">{t("reviewsLead")}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {REVIEWS.map((r) => (
          <article key={r.name} className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted" aria-label={`${r.rating} / 5`}>
                {"●".repeat(r.rating)}
                {"○".repeat(5 - r.rating)}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-fg/85">{r.text[lang]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  const { t, lang } = useLang();
  return (
    <section id="buj" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-4xl md:text-5xl">{t("faqTitle")}</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <details key={item.q.en} className="group py-4">
              <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q[lang]}
                  <span className="text-muted group-open:rotate-45 transition-transform">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a[lang]}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  const { t } = useLang();
  const [map, setMap] = useState(false);
  return (
    <section id="kontakti" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-4xl md:text-5xl">{t("contactTitle")}</h2>
      <p className="mt-3 max-w-xl text-muted">{t("contactLead")}</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <dl className="space-y-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">{t("addressLabel")}</dt>
            <dd className="mt-1 flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-accent" />
              {BUSINESS.address}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">{t("phoneLabel")}</dt>
            <dd className="mt-1">
              <a
                href={`tel:${BUSINESS.phone}`}
                className="inline-flex items-center gap-2 text-fg hover:underline"
                onClick={() => track("phone_clicked", { place: "contact" })}
              >
                <Phone className="size-4 text-accent" />
                {BUSINESS.phoneDisplay}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">{t("hoursLabel")}</dt>
            <dd className="mt-1">{t("hoursValue")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">{t("emailLabel")}</dt>
            <dd className="mt-1">
              <a href={`mailto:${BUSINESS.email}`} className="hover:underline">
                {BUSINESS.email}
              </a>
            </dd>
          </div>
        </dl>
        <div className="relative min-h-72 overflow-hidden rounded-xl border border-border">
          {map ? (
            <iframe
              title="Map"
              src={BUSINESS.mapsEmbed}
              className="size-full min-h-72 border-0"
              loading="lazy"
            />
          ) : (
            <button
              type="button"
              className="relative block size-full min-h-72 text-left"
              onClick={() => {
                setMap(true);
                track("map_clicked");
              }}
            >
              <img src="/images/bay.jpg" alt="" className="absolute inset-0 size-full object-cover" />
              <span className="absolute inset-0 bg-bg/50" />
              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="inline-flex h-11 items-center rounded-md bg-fg px-5 text-sm uppercase tracking-[0.12em] text-bg">
                  {t("openMap")}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function PageHero({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="border-b border-line bg-surface px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-6xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-xl text-muted">{lead}</p> : null}
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesSection />
      <PricesSection />
      <AdvantagesSection />
      <GallerySection />
      <ReviewsSection />
      <FaqSection />
      <ContactSection />
    </>
  );
}

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["AutoWash", "LocalBusiness"],
    name: BUSINESS.name,
    image: "/images/hero.jpg",
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Krasta iela 42",
      addressLocality: "Rīga",
      postalCode: "LV-1003",
      addressCountry: "LV",
    },
    geo: { "@type": "GeoCoordinates", latitude: BUSINESS.lat, longitude: BUSINESS.lng },
    openingHours: "Mo-Su 09:00-21:00",
    priceRange: "€€",
    url: "/",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q.lv,
      acceptedAnswer: { "@type": "Answer", text: item.a.lv },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl">{title}</h1>
      <div className="prose-legal mt-8 space-y-4 text-sm leading-relaxed text-muted">{children}</div>
      <p className="mt-10">
        <Link to="/" className="text-fg underline">
          BTAUTOMAZGATAVA
        </Link>
      </p>
    </article>
  );
}
