import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/catalog";
import { LANGS } from "@/lib/i18n";
import { useBookingUi } from "@/lib/booking-ui";
import { useLang } from "@/lib/lang";
import { cn, track } from "@/lib/utils";

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-baseline gap-2 text-fg no-underline">
      <span className="font-display text-2xl leading-none tracking-tight">BT</span>
      <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted">Automazgātava</span>
    </Link>
  );
}

const NAV = [
  { to: "/pakalpojumi", key: "navServices" as const },
  { to: "/cenas", key: "navPrices" as const },
  { to: "/galerija", key: "navGallery" as const },
  { to: "/atsauksmes", key: "navReviews" as const },
  { to: "/buj", key: "navFaq" as const },
  { to: "/kontakti", key: "navContact" as const },
];

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  const openWizard = useBookingUi((s) => s.openWizard);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "text-sm text-muted transition-colors hover:text-fg",
                pathname === item.to && "text-fg",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center text-xs tracking-[0.14em] text-muted sm:flex" role="group" aria-label="Language">
            {LANGS.map((l, i) => (
              <span key={l.id} className="flex items-center">
                {i > 0 ? <span className="px-1 text-border">|</span> : null}
                <button
                  type="button"
                  onClick={() => setLang(l.id)}
                  className={cn("px-1 py-1 uppercase", lang === l.id ? "text-fg" : "hover:text-fg")}
                  aria-pressed={lang === l.id}
                >
                  {l.label}
                </button>
              </span>
            ))}
          </div>
          <Button size="lg" className="hidden md:inline-flex" onClick={openWizard}>
            {t("navBook")}
          </Button>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-fg lg:hidden"
            aria-label={t("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 top-16 z-40 bg-bg lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-8" aria-label="Mobile">
            <div className="mb-6 flex gap-3 text-sm tracking-[0.16em] text-muted">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  className={cn("uppercase", lang === l.id && "text-fg")}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="py-3 text-2xl font-display text-fg">
                {t(item.key)}
              </Link>
            ))}
            <Button size="xl" className="mt-8 w-full" onClick={openWizard}>
              {t("bookCta")}
            </Button>
            <a
              href={`tel:${BUSINESS.phone}`}
              className="mt-3 inline-flex h-12 items-center justify-center rounded-md border border-border text-sm uppercase tracking-[0.12em]"
              onClick={() => track("phone_clicked", { place: "menu" })}
            >
              {t("callCta")}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-line bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{t("footerTag")}</p>
          <p className="mt-2 text-sm text-muted">{t("footerHours")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/pakalpojumi" className="text-muted hover:text-fg">
            {t("navServices")}
          </Link>
          <Link to="/cenas" className="text-muted hover:text-fg">
            {t("navPrices")}
          </Link>
          <Link to="/pieraksts" className="text-muted hover:text-fg">
            {t("navBook")}
          </Link>
          <Link to="/kontakti" className="text-muted hover:text-fg">
            {t("navContact")}
          </Link>
          <Link to="/privatuma-politika" className="text-muted hover:text-fg">
            {t("privacy")}
          </Link>
          <Link to="/sikdatnu-politika" className="text-muted hover:text-fg">
            {t("cookies")}
          </Link>
          <Link to="/lietosanas-noteikumi" className="text-muted hover:text-fg">
            {t("terms")}
          </Link>
        </div>
        <div className="text-sm text-muted">
          <p>{BUSINESS.address}</p>
          <a href={`tel:${BUSINESS.phone}`} className="mt-2 block text-fg hover:underline" onClick={() => track("phone_clicked", { place: "footer" })}>
            {BUSINESS.phoneDisplay}
          </a>
          <a href={`mailto:${BUSINESS.email}`} className="mt-1 block hover:text-fg">
            {BUSINESS.email}
          </a>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-subtle">{t("copyright")}</div>
    </footer>
  );
}

export function MobileBar() {
  const { t } = useLang();
  const open = useBookingUi((s) => s.open);
  const openWizard = useBookingUi((s) => s.openWizard);
  if (open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <Button size="lg" className="h-12 w-full tracking-[0.06em] text-xs" onClick={openWizard}>
          {t("navBook")}
        </Button>
        <a
          href={`https://wa.me/${BUSINESS.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-md border border-border text-xs font-medium uppercase tracking-[0.08em]"
          onClick={() => track("whatsapp_clicked", { place: "mobile-bar" })}
        >
          <MessageCircle className="size-4" />
          {t("whatsapp")}
        </a>
        <a
          href={`tel:${BUSINESS.phone}`}
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-md border border-border text-xs font-medium uppercase tracking-[0.08em]"
          onClick={() => track("phone_clicked", { place: "mobile-bar" })}
        >
          <Phone className="size-4" />
          {t("callCta")}
        </a>
      </div>
    </div>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-fg focus:px-3 focus:py-2 focus:text-bg">
        Skip
      </a>
      <SiteHeader />
      <div id="main" className="flex-1">
        {children}
      </div>
      <SiteFooter />
      <MobileBar />
    </div>
  );
}
