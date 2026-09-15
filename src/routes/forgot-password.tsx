import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/home-sections";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useLang();
  return (
    <>
      <PageHero title={t("forgotPasswordTitle")} lead={t("forgotPasswordLead")} />
      <div className="mx-auto max-w-md space-y-6 px-4 py-10 text-center">
        <p className="text-sm text-muted">{t("forgotPasswordBody")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/login">
            <Button size="lg" variant="secondary">
              {t("goToLogin")}
            </Button>
          </Link>
          <Link to="/kontakti">
            <Button size="lg">{t("navContact")}</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
