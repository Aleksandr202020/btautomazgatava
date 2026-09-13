import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInButtons } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useLang();
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted">…</div>;
  }

  // Already signed in (or auth off → dev user)
  if (user) {
    return <Navigate to="/kabinets" />;
  }

  return (
    <>
      <PageHero title={t("signInTitle")} lead={t("bookingRequireAuth")} />
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-12">
        {authEnabled ? (
          <SignInButtons callbackURL="/kabinets" />
        ) : (
          <p className="text-center text-sm text-muted">{t("authDisabledHint")}</p>
        )}
        <Link to="/" className="text-sm text-muted underline hover:text-fg">
          {t("backHome")}
        </Link>
      </div>
    </>
  );
}
