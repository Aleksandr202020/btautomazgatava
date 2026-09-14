import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/catalog";
import { LANGS } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { cn, track } from "@/lib/utils";

function Logo({ onClick, light }: { onClick?: () => void; light?: boolean }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn("flex items-baseline gap-2 no-underline", light ? "text-white" : "text-fg")}
    >
      <span className="font-display text-2xl leading-none tracking-tight">BT</span>
      <span className={cn("text-[11px] font-medium uppercase tracking-[0.22em]", light ? "text-white/70" : "text-muted")}>
        Automazgātava
      </span>
    </Link>
  );
}

/** ENRI-style primary nav */
const NAV = [
  { to: "/", key: "navHome" as const },
  { to: "/pieraksts", key: "navBook" as const },
  { to: "/pakalpojumi", key: "navServices" as const },
  { to: "/cenas", key: "navOffers" as const },
  { to: "/kabinets", key: "navClients" as const },
  { to: "/kontakti", key: "navContact" as const },
];

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
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
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-xl",
        open && "bg-white backdrop-blur-none",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to + item.key}
              to={item.to}
              className={cn(
                "rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide transition-colors",
                pathname === item.to ? "bg-black/[0.04] text-fg" : "text-muted hover:bg-black/[0.04] hover:text-fg",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/kabinets"
            className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium text-fg transition hover:bg-elevated sm:inline-flex"
          >
            <User className="size-4" />
            {t("navProfile")}
          </Link>
          <div className="hidden items-center text-[13px] text-muted sm:flex" role="group" aria-label="Language">
            {LANGS.map((l, i) => (
              <span key={l.id} className="flex items-center">
                {i > 0 ? <span className="px-1 text-border">|</span> : null}
                <button
                  type="button"
                  onClick={() => setLang(l.id)}
                  className={cn("px-1 py-1 uppercase", lang === l.id ? "font-semibold text-fg" : "hover:text-fg")}
                  aria-pressed={lang === l.id}
                >
                  {l.label}
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg text-fg lg:hidden"
            aria-label={t("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu: solid white sheet so text stays readable over dark hero */}
      {open ? (
        <div
          className="fixed inset-0 top-[72px] z-50 bg-white lg:hidden"
          style={{ backgroundColor: "#ffffff" }}
        >
          <nav className="flex h-full flex-col gap-1 overflow-y-auto px-6 py-8" aria-label="Mobile">
            <div className="mb-6 flex gap-3 text-sm text-muted">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  className={cn(
                    "uppercase transition-colors",
                    lang === l.id ? "font-semibold text-fg" : "hover:text-fg",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {NAV.map((item) => (
              <Link
                key={item.to + item.key}
                to={item.to}
                className="py-3 text-xl font-semibold text-fg transition-colors hover:text-accent"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              to="/kabinets"
              className="mt-4 py-3 text-xl font-semibold text-fg transition-colors hover:text-accent"
            >
              {t("navProfile")}
            </Link>
            <Link to="/pieraksts" className="mt-6 block">
              <Button className="w-full" size="lg">
                {t("bookCta")}
              </Button>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-line bg-[#f5f5f5]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{t("footerTag")}</p>
          <p className="mt-2 text-sm text-muted">{t("footerHours")}</p>
        </div>
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("navContact")}</h3>
          <dl className="space-y-2 text-sm text-muted">
            <div>
              <dt className="sr-only">{t("addressLabel")}</dt>
              <dd>{BUSINESS.address}</dd>
            </div>
            <div>
              <dt className="sr-only">{t("phoneLabel")}</dt>
              <dd>
                <a href={`tel:${BUSINESS.phone}`} className="hover:text-fg" onClick={() => track("phone_clicked", { place: "footer" })}>
                  {BUSINESS.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">{t("emailLabel")}</dt>
              <dd>
                <a href={`mailto:${BUSINESS.email}`} className="hover:text-fg">
                  {BUSINESS.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("navServices")}</h3>
          <Link to="/pakalpojumi" className="text-muted hover:text-fg">
            {t("navServices")}
          </Link>
          <Link to="/cenas" className="text-muted hover:text-fg">
            {t("navOffers")}
          </Link>
          <Link to="/pieraksts" className="text-muted hover:text-fg">
            {t("navBook")}
          </Link>
          <Link to="/kabinets" className="text-muted hover:text-fg">
            {t("navProfile")}
          </Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("terms")}</h3>
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
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:px-8">
          <span>{t("copyright")}</span>
          <span>{BUSINESS.address}</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
