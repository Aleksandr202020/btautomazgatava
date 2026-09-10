import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { BookingOverlay, CookieBanner } from "@/components/booking-wizard";
import { SiteShell } from "@/components/site-shell";
import { LanguageProvider, useLang } from "@/lib/lang";
import { NotFoundPage } from "@/components/not-found";
import appCss from "../styles.css?url";

const APP_NAME = "BTAUTOMAZGATAVA";

function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <SiteShell>{children}</SiteShell>
        <BookingOverlay />
        <CookieBanner />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function NotFound() {
  return <NotFoundInner />;
}

function NotFoundInner() {
  const { t } = useLang();
  return <NotFoundPage title={t("notFound")} home={t("backHome")} book={t("bookCta")} />;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BTAUTOMAZGATAVA — rokas automazgātava Rīgā" },
      {
        name: "description",
        content:
          "Rokas automazgātava Rīgā, Krasta iela 42. Vieglais auto 25 €, Jeep / Crossover / Minivan 30 €. Katru dienu 09:00–21:00 pēc pieraksta.",
      },
      { name: "theme-color", content: "#080809" },
      { name: "robots", content: "index,follow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Outfit:wght@400;500;600&display=swap",
      },
      { rel: "canonical", href: "/" },
    ],
  }),
  notFoundComponent: NotFound,
  component: () => (
    <html lang="lv" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <Providers>
            <Outlet />
          </Providers>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

void APP_NAME;
