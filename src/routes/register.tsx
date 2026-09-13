import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RegisterForm } from "@/components/auth/AuthForms";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useLang();
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted">…</div>;
  }

  if (user) {
    return <Navigate to="/kabinets" />;
  }

  return (
    <>
      <PageHero title={t("registerTitle")} lead={t("registerLead")} />
      <div className="mx-auto max-w-md px-4 py-10">
        {authEnabled ? (
          <RegisterForm callbackURL="/kabinets" />
        ) : (
          <p className="text-center text-sm text-muted">{t("authDisabledHint")}</p>
        )}
        <p className="mt-8 text-center">
          <Link to="/" className="text-sm text-muted underline hover:text-fg">
            {t("backHome")}
          </Link>
        </p>
      </div>
    </>
  );
}
