import { Link } from "@tanstack/react-router";
import { Check, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { BeforeAfter } from "@/components/before-after";
import { Button } from "@/components/ui/button";
import { BUSINESS, EXTRAS, FAQ, GALLERY, REVIEWS, SERVICE, VEHICLES } from "@/lib/catalog";
import { useLang } from "@/lib/lang";
import { formatEuro, track } from "@/lib/utils";

export function Hero() {
  const { t } = useLang();
  return (
    <section className="enri-hero relative overflow-hidden text-white">
      <div className="mx-auto flex min-h-[min(72dvh,640px)] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <span className="mb-6 inline-flex rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
          {t("heroBadge")}
        </span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">{t("heroLead")}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/pieraksts"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            {t("bookCta")}
          </Link>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
            onClick={() => track("phone_clicked", { place: "hero" })}
          >
            {t("callCta")}
          </a>
        </div>
      </div>
      <div className="enri-cta-bar">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-3.5 sm:flex-row sm:px-8">
          <p className="text-sm font-medium text-white">{t("ctaBanner")}</p>
          <Link
            to="/pieraksts"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-accent hover:bg-white/95"
          >
            {t("navBook")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TrustBar() {
  const { t } = useLang();
  const items = [t("trustHand"), t("trustChem"), t("trustAppt"), t("trustHours"), t("trustCity")];
  return (
    <section className="border-b border-line bg-elevated">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4 text-sm text-muted sm:px-8">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2">
            <Check className="size-4 text-accent" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ServicesSection() {
  const { t, lang } = useLang();
  return (
    <section id="pakalpojumi" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("servicesTitle")}</h2>
        <p className="mt-3 max-w-2xl text-muted">{t("servicesLead")}</p>
        <article className="mt-10 rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{SERVICE.label[lang]}</h3>
              <p className="mt-2 text-sm text-muted">{SERVICE.summary[lang]}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums">
              {t("fromPrice")} {formatEuro(SERVICE.priceFrom, lang)}
            </p>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {SERVICE.includes[lang].map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
          <Link to="/pieraksts" className="mt-8 inline-block">
            <Button size="lg">{t("bookCta")}</Button>
          </Link>
        </article>
      </div>
    </section>
  );
}

export function PricesSection() {
  const { t, lang } = useLang();
  return (
    <section id="cenas" className="scroll-mt-24 border-t border-line bg-elevated">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("pricesTitle")}</h2>
        <p className="mt-3 text-muted">{t("pricesLead")}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {VEHICLES.map((v) => (
            <article key={v.id} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold">{v.label[lang]}</h3>
              <p className="mt-4 text-3xl font-bold tabular-nums text-accent">{formatEuro(v.price, lang)}</p>
              <p className="mt-2 text-sm text-muted">{t("waxNote")}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <h3 className="text-lg font-semibold">{t("extrasTitle")}</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {EXTRAS.map((e) => (
              <li key={e.id} className="flex justify-between gap-4 rounded-lg border border-border bg-white px-4 py-3 text-sm">
                <span>{e.label[lang]}</span>
                <span className="tabular-nums text-muted">{formatEuro(e.price, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
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
    <section className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("advantagesTitle")}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.t} className="rounded-xl border border-border bg-elevated p-6">
              <h3 className="text-base font-semibold">{item.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GallerySection() {
  const { t } = useLang();
  const [filter, setFilter] = useState<"all" | "exterior" | "interior" | "detailing">("all");
  const items = GALLERY.filter((g) => filter === "all" || g.cat === filter);
  return (
    <section id="galerija" className="scroll-mt-24 border-t border-line bg-elevated">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("galleryTitle")}</h2>
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
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                filter === id ? "bg-accent text-white" : "border border-border bg-white text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("catBeforeAfter")}</p>
          <BeforeAfter />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((g) => (
            <figure key={g.src} className="overflow-hidden rounded-xl border border-border bg-white">
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
    <section id="atsauksmes" className="scroll-mt-24 border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("reviewsTitle")}</h2>
        <p className="mt-3 text-muted">{t("reviewsLead")}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <article key={r.name} className="rounded-xl border border-border bg-elevated p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-accent">{"●".repeat(r.rating)}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">“{r.text[lang]}”</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const { t, lang } = useLang();
  return (
    <section id="buj" className="scroll-mt-24 border-t border-line bg-elevated">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("faqTitle")}</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((item) => (
            <details key={item.q[lang]} className="rounded-xl border border-border bg-white p-4">
              <summary className="cursor-pointer font-semibold">{item.q[lang]}</summary>
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
  return (
    <section id="kontakti" className="scroll-mt-24 border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("contactTitle")}</h2>
        <p className="mt-3 text-muted">{t("contactLead")}</p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-accent" />
              <span>
                <span className="block font-semibold">{t("addressLabel")}</span>
                {BUSINESS.address}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 text-accent" />
              <span>
                <span className="block font-semibold">{t("phoneLabel")}</span>
                <a href={`tel:${BUSINESS.phone}`} className="text-accent hover:underline">
                  {BUSINESS.phoneDisplay}
                </a>
              </span>
            </p>
            <p>
              <span className="font-semibold">{t("hoursLabel")}</span>
              <br />
              {t("hoursValue")}
            </p>
            <a
              href={BUSINESS.mapsGoogle}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 font-medium hover:bg-elevated"
            >
              {t("openMap")}
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe title="map" src={BUSINESS.mapsEmbed} className="h-64 w-full" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ title, lead }: { title: string; lead?: string }) {
  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-8 sm:py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {lead ? <p className="mt-3 text-muted">{lead}</p> : null}
      </div>
    </section>
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
    "@type": "AutoWash",
    name: BUSINESS.name,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Krasta iela 42",
      addressLocality: "Rīga",
      postalCode: "LV-1003",
      addressCountry: "LV",
    },
    openingHours: "Mo-Su 09:00-21:00",
    url: "https://btautomazgatava.vercel.app",
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
    <>
      <PageHero title={title} />
      <div className="mx-auto max-w-3xl px-5 py-12 text-sm leading-relaxed text-muted sm:px-8">{children}</div>
    </>
  );
}
